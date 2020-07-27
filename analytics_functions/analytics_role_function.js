var amqp = require('amqplib');

function send_result(msg){
    var q = 'iot/sensors/analyticsResult';
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

function analytics_role(roleLevel){

    var reqResult;
    const request = require('request');

    const options_get = {
        url: ' https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/role/'+ roleLevel,
        json: 'true',
        headers: {
            'x-api-key': 'QRcV16gFGH2yjs6SnGQFC7KElMtqERBJa272JcZW'
        }
    };

    request.get(options_get, (err, res, body) => {

        if (res.statusCode === 200){

            //Handling error no request with the given role in the DB
            if(body.Count == 0){
                console.log(roleLevel +"-empty");
            }else{
                //There are requests with the given role

                //Check the number of attempts in comparison with the number of accesses
                //If the difference is > 5 then take the braceletId of the request and put it into an array
                var braceletIds = [];

                for(var i=0; i < body.Count; i++){
                    var attempts = parseInt(body.Items[i].attemptsNumber.N);
                    var accesses = parseInt(body.Items[i].accessesNumber.N);
                    if ( Math.abs(attempts - accesses) > 3) {
                        if(!braceletIds.includes(parseInt(body.Items[i].braceletId.N))){
                            //Add to array only if it is not already present
                            braceletIds.push(parseInt(body.Items[i].braceletId.N));
                        }
                    }
                }

                //For each braceletId filtered before, get the last request made to obtain the
                //most recent values of attempts and accesses

                var req = [];
                for(var i=0; i < braceletIds.length; i++){
                    const options_get = {
                        url: 'https://2mu9eygiu2.execute-api.us-east-1.amazonaws.com/hotel_service_api/requests/'+ braceletIds[i],
                        json: 'true',
                        headers: {
                            'x-api-key': 'QRcV16gFGH2yjs6SnGQFC7KElMtqERBJa272JcZW'
                        }
                    };

                    request.get(options_get, (err, res, body) => {
        
                        if (res.statusCode === 200){
                            let obj = {
                                "braceletId": parseInt(body.Items[0].braceletId.N),
                                "attemptsNumber": parseInt(body.Items[0].attemptsNumber.N),
                                "accessesNumber": parseInt(body.Items[0].accessesNumber.N)
                            }
                            //req.push(obj);
                            send_result(obj.braceletId+"-"+obj.attemptsNumber+"-"+obj.accessesNumber);
                        }
                    });
                    
                }
                //Publish on topic the result of the store operation to be consumed by another serverless fucntion that shows the result
            }
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

    var roleLevel = _data;

    analytics_role(roleLevel);

};