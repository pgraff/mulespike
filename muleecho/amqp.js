var amqp = require('amqp')
  , bee = require("beeline")
  , argv = require('commander');

// Parse the command line arguments
argv.option('-p, --port [value]', "httpPort",parseInt, 3000)
  .option('-v, --verbose [bool]', 'verbose', Boolean.valueOf(),false )
  .parse(process.argv);

// Setup exception handler for the node dispatcher thread
process.on("uncaughtexception",function(err){
  console.log(err.stack)
})

// These names will be used for random returns
var names = [
 "Albert","Bob","Carl","Dan"
 ];

 // Generate the random return value
var getObject = function(){
  return {
    id:new Date().getTime(),
    name:names[parseInt(Math.random()*names.length)],
    data : process.memoryUsage()
  }
}
// Generate a random return value and serialize it as JSON
var getJson = function(){
  return JSON.stringify(getObject());
}

// Webservice implementation (RESTful WS)
var router = bee.route({ // Create a new router
    "/webService": function(req, res) {
      console.log("Received request for 'webService'")
      res.writeHead(200);
      res.end(getJson());
    }
});

// Used for the AMQP connection for exhange name
// arbitary name for the exchange
var xChange="fanoutEx";

// Connect to RabbitMQ
// vhost = mule-test, user = mule, pw = elum, port=5672
var connection =
  amqp.createConnection({url: "amqp://mule:elum@localhost:5672/mule-test"},
                        {defaultExchangeName: xChange});

// When ready
connection.on('ready', function () {
  console.log("connected")
  // par 1: Non named queue (server generates name)
  // par 2: Configuration of the queue
  var q = connection.queue("",{durable:false,exclusive:true,passive:false} ,function (queue) {
    console.log('Queue ' + queue.name + ' is open');
    // Bind to xchange (think of it as JMS subscribe/topic)
    queue.bind(xChange,"",function(){
      console.log("bound to " + xChange);
      queue.subscribe(function (message, headers, deliveryInfo) {
        argv.verbose && console.log(message.data.toString()+' :: ' + deliveryInfo.routingKey);
      });
    });
  });
  // create an exchange (most similar to Topic in JMS)
  var exc = connection.exchange(xChange, {type:"fanout",durable:false},function (exchange) {
    console.log('Exchange ' + exchange.name + ' is open');
    router.add({"/push":function handler (req, res) {
        res.writeHead(200);
        exchange.publish("", getJson());
        res.end("messausage scented");
      } 
    });
  });
});
connection.on("error",function(err){
  console.log(err.stack)
})
require("http").createServer(router).listen(argv.port);
console.log("server started on:" + argv.port)


