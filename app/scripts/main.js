'use strict';



var mapbox1 = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'examples.map-i86knfo3'
});
var mapbox2 = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'siggyf.i2m0d18j'
});

var baseLayers = {
    "Vector Topo": mapbox1,
    "SiggyF": mapbox2
};

var tracker = 'localhost:22222';

var map = L.map('map',{
    layers: _.values(baseLayers)
}

);


// Generate overlay,  (model, uuid) => marker
function overlay(value, index){
    var overlays = {};
    var marker = L.marker([37.9, -122.2], {title: value.engine, id: index });
    marker.options.metadata = value;
    marker.bindPopup(value.description);
    marker.on("click", function(x,y){
        // lookup the render and pass along the connection
        renderers[value.engine](marker);
    });
    // context
    this[value.name] = marker;
};

var ws;
function register(value, index) {
    var url = 'ws://' + tracker + '/mmi/' + value.uuid;
    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    // Call rendering function in the context
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
    // Attach the websocket to the overlay
    this[value.name].options.ws = ws;

}
$.getJSON('http://' + tracker + '/models', function(data) {
    // Use overlays as a context
    var overlays = {};
    _.each(data, overlay, overlays);
    _.each(data, register, overlays);

    L.control.layers(baseLayers, overlays).addTo(map);


});

map.setView([37.9, -122.2], 10);



