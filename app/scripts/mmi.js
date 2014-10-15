/* global tracker */
/* exported connect, disconnect */

'use strict';
function connect(model){
    model.websocketUrl = 'ws://' + tracker + '/mmi/' + model.uuid;
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
