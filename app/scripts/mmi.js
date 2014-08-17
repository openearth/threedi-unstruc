// exports connect, disconnect
'use strict';
var tracker = 'localhost:22222';

function connect(model){
    model.websocketUrl = 'ws://' + tracker + '/mmi/' + model.uuid;
    model.vars = {};
    console.log('connecting to', model.websocketUrl);
    model.ws = new WebSocket(model.websocketUrl);
    model.ws.binaryType = 'arraybuffer';
    model.ws.metadata = false;

    model.ws.onmessage = function(x){
        console.log('Got message', x);
        if (typeof(x.data) === 'string') {
            model.ws.metadata = JSON.parse(x.data);
        }
        else {
            if (model.ws.metadata !== false){
                var arr;
                if (model.ws.metadata.dtype === 'float64') {
                    arr = new Float64Array(x.data);
                }
                else if (model.ws.metadata.dtype === 'int32') {
                    arr = new Int32Array(x.data);
                } else {
                    console.log('Could not recognize variable', model.ws.metadata);
                }
                model.vars[model.ws.metadata.name] = arr;
                model.ws.metadata = false;
            } else{
                console.log('data without metadata....');
            }
        }
        model.callback();
    };


}

// Call rendering function in the context

function disconnect(model) {
    console.log('disconnecting from', model.websocketUrl);

    if (model.ws) {
        model.ws.close();
    }
    delete model.ws.onmessage;
    delete model.ws.metadata;
    delete model.ws;
    delete model.vars;

};
