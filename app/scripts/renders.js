var renderers = {};
var vars = {};
var grid = null;
var path = null;

renderers["dflowfm"] = function(overlay){
    var ws = overlay.options.ws;
    var info = overlay.options.metadata;
    var map = overlay._map;
    var grid = null;
    var url = 'http://' + tracker + '/models/' + overlay.options.id + '/grid';
    url = 'grid.json';
    $.getJSON(url, function(data) {
        // Use overlays as a context
        console.log(data);
        grid = data;
        var svg = d3.select(map.getPanes().overlayPane).append('svg');
        var g = svg.append('g').attr('class', 'leaflet-zoom-hide');
        function projectPoint(x, y) {
            var point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }

        var transform = d3.geo.transform({point: projectPoint})
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
                .attr('id', function(feature) {return "c" + feature.properties.index})
                .attr('d', path);
        ;
        map.on('viewreset', reset);
        reset();
        
    });
    ws.send(JSON.stringify({"update":-1}));
    ws.send(JSON.stringify({"get_var": "xk"}));
    ws.send(JSON.stringify({"get_var": "yk"}));
    ws.send(JSON.stringify({"get_var": "flowelemnode", "copy": true}));
    var metadata = false;
    ws.onmessage = function(x){
        console.log("Got message", x);
        if (typeof(x.data) == "string") {
            metadata = JSON.parse(x.data);
        } 
        else {
            if (metadata != false){
                var arr;
                if (metadata['dtype'] == 'float64') {
                    arr = new Float64Array(x.data);
                }
                else if (metadata['dtype'] == 'int32') {
                    arr = new Int32Array(x.data);
                } else {
                    console.log("Could not recognize variable", metadata);
                };
                vars[metadata['name']] = arr;
                metadata = false;
            } else{
                console.log("data without metadata....");
            };
        };
    };
};


//     d3.json(gridurl, function(collection) {
//         // Use Leaflet to implement a D3 geometric transformation.

//     });
// }