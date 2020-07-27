var amqp = require('amqplib');

function send_result(msg){
    var q = 'iot/sensors/result';
    amqp.connect('amqp://guest:guest@192.168.1.8:5672').then(function(conn) {
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

    const options_get = {
        url: 'https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests/'+ braceletId,
        json: 'true',
        headers: {
            'x-api-key': 'QRcV16gFGH2yjs6SnGQFC7KElMtqERBJa272JcZW'
        }
    };

    request.get(options_get, (err, res, body) => {

        if (res.statusCode === 200){

            //Handling error inexistent ID in the DB
            if(body.Count == 0){
                //The bracelet ID that has issued the request is not registered into DB
                send_result(braceletId + "-"+ serviceRequested + "-errorBracelet");
            }else{
                
                //bracelet ID existent

                //The get request return the last request made with that braceletId
                lastRequest = body.Items[0];
        
                //check requisites
                if(lastRequest.role.S == "bronze"){
                    //Bronze role users are allowed to access only to games room
                    if(serviceRequested == "gamesRoom") reqResult =  true;
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
                
                //Save request to DB
                var options_post;
                if(lastRequest.role.S == "silver"){
                    options_post = {
                        url: ' https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests',
                        json: {
                            timestamp: new Date().getTime(),
                            braceletId: braceletId,
                            serviceRequested: serviceRequested,
                            role: lastRequest.role.S,
                            attemptsNumber: parseInt(lastRequest.attemptsNumber.N) + 1,
                            accessesNumber: updatedAccessNumber,
                            accessLimit: parseInt(lastRequest.accessLimit.N),
                            requestResult: resultString
                        },
                        headers: {
                            'x-api-key': 'QRcV16gFGH2yjs6SnGQFC7KElMtqERBJa272JcZW'
                        }
                    };
                }else{
                    options_post = {
                        url: ' https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests/unlimited',
                        json: {
                            timestamp: new Date().getTime(),
                            braceletId: braceletId,
                            serviceRequested: serviceRequested,
                            role: lastRequest.role.S,
                            attemptsNumber: parseInt(lastRequest.attemptsNumber.N) + 1,
                            accessesNumber: updatedAccessNumber,
                            requestResult: resultString
                        },
                        headers: {
                            'x-api-key': 'QRcV16gFGH2yjs6SnGQFC7KElMtqERBJa272JcZW'
                        }
                    };
                }

                request.post(options_post, (error, response, body) => {
                    if (res.statusCode === 200){
                        //Publish on topic the result of the store operation to be consumed by another serverless fucntion that shows the result
                        send_result(braceletId + "-"+ serviceRequested + "-" + resultString);
                    }                    
                });
            }
        } 
    });
}

function check_wrong_service(serviceRequested){
    //handle service typing error
    var servicesToRequest = ["gamesRoom", "spa", "gym", "restaurant", "laundry", "massages"];

    for(var i=0; i< servicesToRequest.length; i++){
        if(servicesToRequest[i] == serviceRequested){
            return false;
        }
    }
    return true;

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

    if(check_wrong_service(serviceRequested)){
        //The requested service is wrong: it is not present in the list of services
        send_result(braceletId + "-"+ serviceRequested + "-errorService");
    }else{
        //Ther requested service is one of the avalaible services
        check_requisites(braceletId, serviceRequested);
    }

};