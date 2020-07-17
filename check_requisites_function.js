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

function check_requisites(braceletId, serviceRequested){

    var reqResult, resultString, updatedAccessNumber;
    const request = require('request');

    request.get('https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests/' + braceletId, { json: true }, (err, res, body) => {

        if (res.statusCode === 200){

            //Take the last request made with this bracelet
            lastRequest = body.Items[0];
            var maxTimestamp = parseInt(body.Items[0].timestamp.S);

            for(var i=1; i < body.Count; i++){
                var d = parseInt(body.Items[i].timestamp.S);
                if ( d > maxTimestamp) {
                    maxTimestamp = d;
                    lastRequest = body.Items[i];
                }
            }
        
        
            //check requisites
            if(lastRequest.role.S == "bronze"){
                //Bronze role users are allowed to access only to games room
                if(serviceRequested == "games room") reqResult =  true;
                else reqResult =  false;
            }else if(lastRequest.role.S == "silver"){
                //Silver role users are allowed to all services for a fixed number of times depending on how much they have paid
                //check if the limit is reached
                if(parseInt(lastRequest.accessesNumber.N) < parseInt(lastRequest.accessLimit.N) ) reqResult =  true; 
                else reqResult = false; //limit is reached
            }else if(lastRequest.role.S == "gold"){
                reqResult = true; // Gold users have unlimited access
            }

            if(reqResult){
                resultString = "access allowed";
                updatedAccessNumber = parseInt(lastRequest.accessesNumber.N) + 1;
            }else{
                resultString = "access not allowed";
                updatedAccessNumber = parseInt(lastRequest.accessesNumber.N);
            }

            request.post('https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests', { 
                json: {
                    timestamp: new Date().getTime(),
                    braceletId: braceletId,
                    serviceRequested: serviceRequested,
                    role: lastRequest.role.S,
                    attemptsNumber: parseInt(lastRequest.attemptsNumber.N) + 1,
                    accessesNumber: updatedAccessNumber,
                    accessLimit: parseInt(lastRequest.accessLimit.N),
                    requestResult: resultString
                }
            }, (error, response, body) => {
                if (res.statusCode === 200){
                    //Publish on topic the result of the store operation to be consumed by another serverless fucntion that shows the result
                    send_result(braceletId + "-"+ serviceRequested + "-" + resultString);
                }                    
            });

        } 
    });
}


function bin2string(array){
    var result = "";
    for(var i = 0; i < array.length; ++i){
        result+= (String.fromCharCode(array[i]));
    }
    return result;
}

exports.handler = function(context, event) {
    var _event = JSON.parse(JSON.stringify(event));
    var _data = bin2string(_event.body.data);

    context.callback("Data received: "+_data);

    var extractedStrings = _data.split("-");
    var braceletId = parseInt(extractedStrings[0]);
    var serviceRequested = extractedStrings[1];

    check_requisites(braceletId, serviceRequested);
};