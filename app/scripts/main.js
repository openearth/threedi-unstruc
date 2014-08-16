/* global renderers */
/* exported tracker, overlays, vars */
'use strict';

// Nice background map
var mapbox = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'siggyf.i2m0d18j'
});
var baseLayers = {
    'SiggyF': mapbox
};

// The map
var map = L.map('map',{
    layers: _.values(baseLayers)
});

// The url of the tracker
var tracker = 'localhost:22222';
// Global list of variables
var vars = {};
// Current model
var uuid;

// Generate overlay,  (model, uuid) => marker
function overlay(value, index){
    var marker = L.marker(value.location, {title: value.engine, id: index, uuid: value.uuid });
    marker.options.metadata = value;
    marker.bindPopup(value.description);
    marker.on('click', function(){
        // lookup the render and pass along the connection
        var renderer = renderers[value.engine];
        if (renderer) {
            renderer(marker);
        }
        uuid = value.uuid;
    });
    // context
    this[value.name] = marker;
}

function register(value) {
    var url = 'ws://' + tracker + '/mmi/' + value.uuid;
    var ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    // Call rendering function in the context
    var metadata = false;
    ws.onmessage = function(x){
        console.log('Got message', x);
        if (typeof(x.data) === 'string') {
            metadata = JSON.parse(x.data);
        }
        else {
            if (metadata !== false){
                var arr;
                if (metadata.dtype === 'float64') {
                    arr = new Float64Array(x.data);
                }
                else if (metadata.dtype === 'int32') {
                    arr = new Int32Array(x.data);
                } else {
                    console.log('Could not recognize variable', metadata);
                }
                vars[metadata.name] = arr;
                metadata = false;
            } else{
                console.log('data without metadata....');
            }
        }
    };
    // Attach the websocket to the overlay
    this[value.name].options.ws = ws;
}
var overlays = {};

$.getJSON('http://' + tracker + '/models', function(data) {
    // Use overlays as a context
    _.each(data, overlay, overlays);
    _.each(data, register, overlays);

    L.control.layers(baseLayers, overlays).addTo(map);


});

function currentOverlay() {
    console.log(_.filter(overlays, function(overlay){return overlay.options.uuid === uuid;}));
    return _.filter(overlays, function(overlay){return overlay.options.uuid === uuid;})[0];
}
function play() {
    currentOverlay().options.ws.send(JSON.stringify({"remote": "play"}));
}
function pause() {
    currentOverlay().options.ws.send(JSON.stringify({"remote": "pause"}));
}

L.easyButton('fa-pause',
             function (){
                 pause();
             },
             'Pause'
            ).setPosition('bottomleft');
L.easyButton('fa-play',
             function (){
                 play();
             },
             'Play'
            ).setPosition('bottomleft');
L.easyButton('fa-refresh',
             function (){
                 update(uuid);
             },
             'Update'
            ).setPosition('bottomleft');

// control.addTo(map);

map.setView([37.9, -122.2], 10);



