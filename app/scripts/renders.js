/* global tracker, overlays, vars */
/* exported renderers */

'use strict';
var renderers = {};
renderers.dflowfm = function(overlay){
    var ws = overlay.options.ws;
    var map = overlay._map;
    var grid = null;
    var url = 'http://' + tracker + '/models/' + overlay.options.id + '/grid';
    url = 'grid.json';

    var defs = '<defs>' +
            '<pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse">' +
            '<rect width="5" height="5" fill="#fff"/>' +
            '<rect width="1" height="1" fill="#ccc"/>' +
            '</pattern>' + 
            '</defs>';
    $.getJSON(url, function(data) {
        // Use overlays as a context
        console.log(data);
        grid = data;
        var svg = d3.select(map.getPanes().overlayPane).append('svg');
        svg.html(defs);
        var g = svg.append('g').attr('class', 'leaflet-zoom-hide');
        function projectPoint(x, y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        var transform = d3.geo.transform({point: projectPoint});
        var path = d3.geo.path().projection(transform);
        // Reposition the SVG to cover the features.
        function reset() {
            var bounds = path.bounds(grid),
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
                .data(grid.features)
                .enter()
                .append('path')
                .attr('id', function(feature) {return 'c' + feature.properties.index;})
                .attr('d', path);

        map.on('viewreset', reset);
        reset();
        
    });
    ws.send(JSON.stringify({'update':-1}));
    ws.send(JSON.stringify({'get_var': 'xk'}));
    ws.send(JSON.stringify({'get_var': 'yk'}));
    ws.send(JSON.stringify({'get_var': 'flowelemnode', 'copy': true}));
    ws.send(JSON.stringify({'get_var': 's1'}));
    ws.send(JSON.stringify({'get_var': 'ucx'}));
    ws.send(JSON.stringify({'get_var': 'ucy'}));
};


function update(uuid) {
    var overlay = _.filter(overlays, function(x){return x.options.uuid === uuid;})[0];
    var ws = overlay.options.ws;
    ws.send(JSON.stringify({'get_var': 's1'}));
    var color = d3.scale.linear()
            .domain([-1, 0, 1])
            .range(['#1C6BA0', '#78B6A4', '#E4F5E9']);
    d3.selectAll('path')
        .transition()
        .duration(3000)
        .ease('linear')
        .style('fill', function(feature){ 
            var s1 = vars.s1[feature.properties.index];
            return color(s1);
        });
}
//     d3.json(gridurl, function(collection) {
//         // Use Leaflet to implement a D3 geometric transformation.

//     });
// }