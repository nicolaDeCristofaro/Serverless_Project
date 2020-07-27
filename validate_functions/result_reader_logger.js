var amqp = require('amqplib');

amqp.connect('amqp://guest:guest@192.168.1.8:5672').then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue('iot/sensors/result', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('iot/sensors/result', function(msg) {
        var extractedStrings = msg.content.toString().split("-");
        if(extractedStrings[2] == "access allowed"){
          console.log('\n\n\x1b[33m #Request of bracelet ID: \x1b[0m %s \n\x1b[33m #Service requested: \x1b[0m %s \n\x1b[33m #Result: \x1b[0m \x1b[32m%s\x1b[0m\n', extractedStrings[0], extractedStrings[1], extractedStrings[2]);
        }else if(extractedStrings[2] == "access not allowed"){
          console.log('\n\n\x1b[33m #Request of bracelet ID: \x1b[0m %s \n\x1b[33m #Service requested: \x1b[0m %s \n\x1b[33m #Result: \x1b[0m \x1b[31m%s\x1b[0m\n', extractedStrings[0], extractedStrings[1], extractedStrings[2]);
        }else if(extractedStrings[2] == "errorService"){
          console.log('\n\n\x1b[33m #Request of bracelet ID: \x1b[0m %s \n\x1b[33m #Service requested: \x1b[0m %s \n\x1b[33m #Result: \x1b[0m \x1b[31m ERROR: WRONG SERVICE REQUESTED\x1b[0m\n', extractedStrings[0], extractedStrings[1]);
        }else if(extractedStrings[2] == "errorBracelet"){
          console.log('\n\n\x1b[33m #Request of bracelet ID: \x1b[0m %s \n\x1b[33m #Service requested: \x1b[0m %s \n\x1b[33m #Result: \x1b[0m \x1b[31m ERROR: BRACELET ID NOT REGISTERED\x1b[0m\n', extractedStrings[0], extractedStrings[1]);
        }else{
          console.log("Result doesn't match the expected: system error");
        }
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
      console.log('*--------------RESULT READER--------------*');
    });
  });
}).catch(console.warn);

