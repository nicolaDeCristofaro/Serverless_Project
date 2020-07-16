var amqp = require('amqplib');

amqp.connect('amqp://guest:guest@192.168.1.11:5672').then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue('iot/sensors/result', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('iot/sensors/result', function(msg) {
        console.log("'%s'", msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
    });
  });
}).catch(console.warn);

