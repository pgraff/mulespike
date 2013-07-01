#Use Case

##Introduction

This document explains what's going on in the mule spike. I'll explain all the parties involved. Then the behavior of the individual parties and finally explain the message flow.

##The involved parties:
* Mule
   * Mule is a stand alone process running the Mule ESB
* Node
   * Node is a process that acts as one of the parties that has to be integrated
   * I'm using Node here for several reasons:
    * I want to see how much harder it is to implement an identical role to that played by Mule in Node
    * I need an external agent implemented in a different technology to show a polyglot implementation
* MongoDB
    * A database to show DB integration
* RabbitMQ
   * A message broker
   * RabbitMQ acts as the backbone for all asynchronous messages

##What's in Mule?
I've defined 3 flows in Mule. The mule flows implemented are:

* Http_Message. Implements the following flow:
   1. Receives an HTTP message on port 8090
   2. Post the HTTP payload as a message using AMQP (protocol of RabbitMQ)
   3. Logs a message
* Amqp_Message_Processor. 
Implements the following flow:
   1. Listens to a message from AMQP (or from RabbitMQ in our example)
   2. Converts the incoming message from ByteArray to String
   3. Inserts the incoming payload into MongoDB picking a subset of the information in the message
   4. Logs a message
* Polling_Message. Implements the following flow:
   1. Uses a polling connector, polls http://localhost:3000/webservice every minute
   2. Uses the response and puts it in a AMQP queue
   3. Logs the event

## What's in Node?
The node implementation can be seen in the ampq.js file. Basically, the node implementation is performing a mirror set of tasks of the mule implementation.
* When someone connects to localhost:3000/push
   1. Logs the message
   2. Push a message to AMQP
* Subscribes to an AMQP exchange called "fanoutEx", and on message:
   1. Logs the message

Message scenarios:
There are basically 3 scenarios that are supported int the simple spike:

* You may connect to mule on on port 8090 path message and provide a JSON object in the payload. 
   * You can do so by simply 'curl' as follows:
   curl --data '{"id": "foo", "data": {"rss": "whatever", "other": "other"}}' http://localhost:8090/message
   * This triggers the following flow (Note Event 2 and 3 happens in parallel):
      * Event 1:
          1. Mule posts the 'data' into a RabbitMQ exchange called 'fanoutEX'
      * Event 2:
          1. Node picks up the message from Rabbit MQ on exchange 'fanoutEX' and logs it
      * Event 3:
          1. Mule (in another flow than event 1) picks up the message from RabbitMQ on exchange 'fanoutEX' and logs it
* You may connect to port 3000 path 'push' with a JSON payload
   * You can do so by simply 'curl' as follows:
curl --data '{"id": "foo", "data": {"rss": "whatever", "other": "other"}}' http://localhost:3000/push 
   * This triggers the following flow (Noted event 2 and 3 happens in parallel)
      * Event 1:
          1. Node posts the 'data' into a RabbitMQ exchange called 'fanoutEX'
      * Event 2:
          1. Node picks up the message from Rabbit MQ on exchange 'fanoutEX' and logs it
      * Event 3:
          1. Mule (in another flow than event 1) picks up the message from RabbitMQ on exchange 'fanoutEX' and logs it
* You may simply hang back and wait for 60 seconds to pass by. Mule is instructed to hit a endpoint implemented in Node every 60 seconds
   * Every minute the following flow is executed
       1. The timeout triggers Mule to invoke localhost:3000/push
          1. Node pushes a message into the fanoutEX exchange
          2. Node responds with a message and HTTP code 200
          3. Mule pushes a message into the fanoutEX
       2. Both Node and mule will pickup the messages and log them
