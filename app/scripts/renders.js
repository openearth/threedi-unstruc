/* global map, d3, _ */
/* exported render, unrender, play, pause, update */

'use strict';
var render = {};
var unrender = {};
var update = {};
var play = {};
var pause = {};
render.xbeach = function(model) {
    var name = 'zs';
    var svg = d3.select('#plot').append('svg')
            .attr('viewBox', '0 0 150 100')
            .attr('width', '800px')
            .attr('height', '600px');

    svg.append('path').attr('id', 'water');
    svg.append('path').attr('id', 'bathymetry');
    
    
};

unrender.dflowfm = function(model){
    $('#grid' + model.uuid).remove();
    // Remove map.on event
};
render.dflowfm = function(model){
    var url = model.gridurl;
    url = 'grid.json';
    $.getJSON(url, function(data) {
        // Use overlays as a context
        console.log(data);
        model.grid = data;
        model.variable = 's1';
        var svg = d3.select(map.getPanes().overlayPane).append('svg');
        svg
            .attr('id', 'grid' + model.uuid);
        var g = svg.append('g').attr('class', 'leaflet-zoom-hide');

        function projectPoint(x, y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        var transform = d3.geo.transform({point: projectPoint});
        var path = d3.geo.path().projection(transform);
        // Reposition the SVG to cover the features.
        function reset() {
            var bounds = path.bounds(model.grid),
                topLeft = bounds[0],
                bottomRight = bounds[1];
            svg
                .attr('width', bottomRight[0] - topLeft[0])
                .attr('height', bottomRight[1] - topLeft[1])
                .style('left', topLeft[0] + 'px')
                .style('top', topLeft[1] + 'px');

            g
                .attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

            features
                .attr('d', path);

        }
        var features = g.selectAll('path')
                .data(model.grid.features)
                .enter()
                .append('path')
                .attr('id', function(feature) {return 'c' + feature.properties.index;})
                .attr('d', path)
                .on('click', function(feature){
                    model.ws.send(JSON.stringify({
                        'set_var_index': model.variable, 
                        'index': [feature.properties.index],
                        'dtype': 'double', 
                        'shape': [1]
                    }));
                    model.ws.send(new Float64Array([10]));
                });
        

        map.on('viewreset', reset);
        reset();
        
    });
    
};


update.xbeach = function(model){
    var name = 'zs';
    var zs = model.vars['zs'];
    var zb = model.vars['zb'];
    var index = d3.range(zs.length);
    var xdomain = [
        0,
        zs.length
    ];
    var ydomain = [
        -0.3,1.0
        // Math.min(_.min(zs), _.min(zb)),
        // Math.max(_.max(zs), _.max(zb))
    ];
    
    var w = 150,
        h = 100;
    
    var x = d3.scale.linear().domain(xdomain).range([0, w]),
        y = d3.scale.linear().domain(ydomain).range([h, 0]);
    var area = d3.svg.area()
            .x(function(d) { return x(d.x); })
            .y0(function(d) { return y(d.y0); })
            .y1(function(d) { return y(d.y1); });
    
    var data = _.map(index, function(index){return {y0: zb[index], y1: zs[index], x: index};});
    d3.select('#plot').select('#water').attr('d', area(data));

    data = _.map(index, function(index){return {y0: ydomain[0], y1: zb[index], x: index};});
    d3.select('#plot').select('#bathymetry').attr('d', area(data));

    data = _.map(index, function(index){return {y: zb[index], x: index};});

    var drag = d3.behavior.drag()
            .origin(function(d) {
                var origin = {y: y(d.y), x: x(d.x)};
                return origin;
            })
            .on("drag", dragmove)
            .on("dragend", dragend);

    var svg = d3.select('#plot').select('svg');
    var circles = svg
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", 1)
            .attr("cx", function(d){
                return x(d.x);
            })
            .attr("cy", function(d){
                return y(d.y);
            })
            .attr("id", function(d,i){
                return "circle" + i;
            })
            .call(drag);

    function dragmove(d) {
        // Select the span
        console.log('dragging', d);
        var span = Math.round(1.0 + Math.abs(x.invert(d3.event.x) - d.x) );
        var oldy = data[d.x].y;
        var newy = y.invert(d3.event.y);
        var dy = newy - oldy;
        d3.selectAll('circle').classed({active:false});
        d3.range(zs.length).map(function(i){
            // span: 4
            // 1-1/16, 1-4/16, 1-9/16, 0,
            //
            var ratio = Math.max(1 - Math.abs(d.x - data[i].x)/Math.max(span, 1), 0);
            if (i in data) {
                data[i].y = data[i].y + dy * ratio;

            }
            if (ratio>0) {
                d3.select('#circle' + i).classed({active: true});
            }
        });
        drawcircles();
    }

    function dragend(d) {
        model.ws.send(JSON.stringify({
            'set_var': 'zb', 
            'dtype': 'double', 
            'shape': [zb.length]
        }));
        console.log("sending", _.map(data, function(d){return d.y;}), "of size", zb.length);
        model.ws.send(new Float64Array(_.map(data, function(d){return d.y;})));
        d3.selectAll('circle').classed({active: false});
    }
    function drawcircles() {
        circles
            .data(data)
            .attr("cx", function(d){
                return x(d.x);
            })
            .attr("cy", function(d){
                return y(d.y);
            });
    }

    

};


update.dflowfm = function(model) {
    var name = model.variable;
    var color = d3.scale.linear()
            .domain([ 0.6, 1.2])
            .range(['#2e5d70', 'white']);

    d3.selectAll('path')
        .style('fill', function(feature){ 
            var value = 0;
            if (name in model.vars) {
                value = model.vars[name][feature.properties.index];
            } 
            return color(value);
        });
};


play.dflowfm = function(model){
    console.log('setting model update', model.update );
    model.ws.send(JSON.stringify({remote: 'play'}));
    model.intervalId = setInterval(model.update, 1000);
};
play.xbeach = function(model){
    console.log('setting model update', model.update );
    model.ws.send(JSON.stringify({remote: 'play'}));
    model.intervalId = setInterval(model.update, 1000);
};


pause.dflowfm = function(model){
    clearInterval(model.intervalId);
    model.ws.send(JSON.stringify({remote: 'pause'}));
};
pause.xbeach = function(model){
    clearInterval(model.intervalId);
    model.ws.send(JSON.stringify({remote: 'pause'}));
};