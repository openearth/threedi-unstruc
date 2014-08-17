/* global map */
/* exported render, unrender, play, pause, update */

'use strict';
var render = {};
var unrender = {};
var update = {};
var play = {};
var pause = {};
unrender.dflowfm = function(model){
    $('#grid' + model.uuid).remove();
};
render.dflowfm = function(model){
    var url = model.gridurl;
    url = 'grid.json';
    $.getJSON(url, function(data) {
        // Use overlays as a context
        console.log(data);
        model.grid = data;
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
                .attr('d', path);

        map.on('viewreset', reset);
        reset();
        
    });
    
};

update.dflowfm = function(model) {
    model.ws.send(JSON.stringify({'get_var': 's1'}));
    var color = d3.scale.linear()
            .domain([-1, 0, 1])
            .range(['navy', '#20B2AA', 'turquoise']);
            // .range(['#1C6BA0', '#78B6A4', '#E4F5E9']);

    var opacity = d3.scale.linear()
            .domain([-0.5, 0, 0.5])
            .range([0.8 ,0.2, 0.5]);

    d3.selectAll('path')
        .style('fill', function(feature){ 
            var s1 = 0;
            if ('s1' in model.vars) {
                s1 = model.vars.s1[feature.properties.index];
            } 
            return color(s1);
        })
        .style('fill-opacity', function(feature){ 
            var s1 = 0;
            if ('s1' in model.vars) {
                s1 = model.vars.s1[feature.properties.index];
            } 
            return opacity(s1);
        });

};

play.dflowfm = function(model){
    console.log('setting model update', model.update );
    model.ws.send(JSON.stringify({remote: 'play'}));
    model.intervalId = setInterval(model.update, 1000);
};
pause.dflowfm = function(model){
    clearInterval(model.intervalId);
    model.ws.send(JSON.stringify({remote: 'pause'}));
};