#Mule Spike

## Required toos
To run this example, you have to first setup the following:
* Mongo
* RabbitMQ
* Mule (stand-alone version)
* node.js

## Start 

### Mongo
Start up Mongo.

       sudo mongod

### RabbitMQ
Start up RabbitMQ
    sudo rabbitmq-server

### Mule
Start the stand-alone version of mule. 

    sudo ./mule start

If you want to see the log, you may want to go to the log directory and tail the mule-spike.log.


       tail -f mule-spike.log

##Initialize the RabbigMQ
Next let's setup the user and exchange for RabbitMQ.
In the development directory run the init script.

       ./init-script.sh

## Start Node
In the muleecho directory, start node.

	npm install
    node amqp.js

## Build the mule app
In the muleecho directory, run the maven build.

    mvn install

## Install the mule app
Copy the maven built artifact into your mule application directory.

    cp target/spike.zip $MULE_INSTALL/apps/

# Stimulate the application
There are three ways the application can be 'ticled'.

1. It will be tickled every 60 seconds (see the polling flow in mule).
2. By 'hitting' the listening mule

    curl --data '{"id": "foo", "data": {"rss": "whatever", "other": "other"}}' http://localhost:8090/message

3. By hitting the listening node application

    curl --data '{"id": "foo", "data": {"rss": "whatever", "other": "other"}}' http://localhost:3000/push 

