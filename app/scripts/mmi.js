/* global config */
/* exported connect, disconnect */

'use strict';
function connect(model){
    // You can't use relative paths with websockets so we have to make an absolute path
    if (config.tracker.match(/^http/) ) {
        // absolute url
        model.websocketUrl = config.tracker.replace(/http/, 'ws');
    } else {
        var loc = window.location;
        if (loc.protocol === 'https:') {
            model.websocketUrl = 'wss:';
        } else {
            model.websocketUrl = 'ws:';
        }
        model.websocketUrl += '//' + loc.host;
        model.websocketUrl += config.tracker;
    }
    // add model websocket
    model.websocketUrl += '/mmi/' + model.uuid;

    model.vars = {};
    console.log('connecting to', model.websocketUrl);
    model.ws = new WebSocket(model.websocketUrl);
    model.ws.binaryType = 'arraybuffer';
    model.ws.metadata = false;

    model.ws.onmessage = function(message){
        var newkey = false;
        console.log('Got message', message, 'for model', model);
        if (typeof(message.data) === 'string') {
            model.ws.metadata = JSON.parse(message.data);
        }
        else {
            if (model.ws.metadata !== false){
                var arr;
                if (model.ws.metadata.dtype === 'float64') {
                    arr = new Float64Array(message.data);
                }
                else if (model.ws.metadata.dtype === 'int32') {
                    arr = new Int32Array(message.data);
                } else {
                    console.log('Could not recognize variable', model.ws.metadata);
                }
                if (!(model.ws.metadata.name in model.vars)) {
                    model.vars[model.ws.metadata.name + "0"] = arr;
                    newkey = true;
                }
                model.vars[model.ws.metadata.name] = arr;
                model.ws.metadata = false;
            } else{
                console.log('data without metadata....');
            }
        }
        if (newkey) {
            model.callback();
        }
    };


}

// Call rendering function in the contemessaget

function disconnect(model) {
    console.log('disconnecting from', model.websocketUrl);

    if (model.ws) {
        model.ws.close();
    }
    delete model.ws.onmessage;
    delete model.ws.metadata;
    delete model.ws;
    delete model.vars;

}
