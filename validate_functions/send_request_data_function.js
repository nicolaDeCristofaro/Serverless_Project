var mqtt = require('mqtt'), url = require('url');

var mqtt_url = url.parse(process.env.CLOUDAMQP_MQTT_URL || 'mqtt://guest:guest@192.168.1.9:1883');
var auth = (mqtt_url.auth || ':').split(':');
var url = "mqtt://" + mqtt_url.host;

var options = {
    port: mqtt_url.port,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: auth[0],
    password: auth[1],
};

exports.handler = function(context, event) {

    var client = mqtt.connect(url, options);

    var braceletIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var servicesToRequest = ["gamesRoom", "spa", "gym", "restaurant", "laundry", "massages"];
             
    var randomBraceletId = braceletIds[Math.floor(Math.random() * braceletIds.length)]; 
    var randomService = servicesToRequest[Math.floor(Math.random() * servicesToRequest.length)];

    var requestData = randomBraceletId + "-" + randomService;

    client.on('connect', function() {
            client.publish('iot/sensors/services', requestData, function() {
                        client.end(); 
                        context.callback("Request data ["+requestData+"] sent on 'iot/sensors/services' topic.");
                });                
        }); 
};