var amqp = require('amqplib');

function send_result(msg){
    var q = 'iot/sensors/result';
    amqp.connect('amqp://guest:guest@192.168.1.11:5672').then(function(conn) {
        return conn.createChannel().then(function(ch) {
            var ok = ch.assertQueue(q, {durable: false});
            return ok.then(function(_qok) {
            ch.sendToQueue(q, Buffer.from(msg));
            console.log(" [x] Sent '%s'", msg);
            return ch.close();
            });
        }).finally(function() { 
                conn.close();
            });
    }).catch(console.warn);
}

exports.handler = function(context, event) {
    var _event = JSON.parse(JSON.stringify(event));
    var _data = bin2string(_event.body.data);

    context.callback("Data received: "+_data);

    var extractedStrings = _data.split("-");

    send_result("Request of braceletId: "+parseInt(extractedStrings[1])+" for service: "+extractedStrings[2]+" is stored into DB");


    /*const request = require('request');

    //Save to DB
    request.post('https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests', { 
        json: {
            timestamp: extractedStrings[0],
            braceletId: parseInt(extractedStrings[1]),
            serviceRequested: extractedStrings[2],
            role: extractedStrings[3],
            attemptsNumber: parseInt(extractedStrings[4]),
            accessesNumber: parseInt(extractedStrings[5]),
            accessLimit: parseInt(extractedStrings[6]),
            requestResult: extractedStrings[7]
        }
    }, (err, res, body) => {
        //Publish on topic the result of the store operation to be consumed by another serverless fucntion that shows the result
        send_result("Request of braceletId: "+parseInt(extractedStrings[1])+" for service: "+extractedStrings[2]+" is stored into DB");
    })*/
};  