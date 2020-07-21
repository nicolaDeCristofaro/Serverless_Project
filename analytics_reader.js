var amqp = require('amqplib');

amqp.connect('amqp://guest:guest@192.168.1.11:5672').then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue('iot/sensors/analyticsResult', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('iot/sensors/analyticsResult', function(msg) {
        var extractedStrings = msg.content.toString().split("-");
        console.log('\n\n\x1b[33m #User with bracelet ID: \x1b[0m %s \n\x1b[33m #Number of attempts: \x1b[0m %s \n\x1b[33m #Number of accesses: \x1b[0m \x1b[0m%s\x1b[0m', extractedStrings[0], extractedStrings[1], extractedStrings[2]);
        console.log('\x1b[33m #Insight: \x1b[0m \x1b[32m The number of attempts of this user is higher than normal in comparison with number of accesses. \n This could be an insight that these user wants to obtain an higher level role to access more hotel services.\n Promotional ads should be presented to this user in order to increase the potential profit.\n\x1b[0m',);
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
      console.log('*--------------------------------------------------*');
    });
  });
}).catch(console.warn);