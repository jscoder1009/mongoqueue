# mongoqueue: Mongoose based light weight Queueing Engine on NPM

This is a light weight queing engine which uses mongoose and cron libraries

**Pre-Requisites**: Two NPM libraries are required for mongoqueue to work.

`npm install cron -D`

`npm install mongoose -D`

**Steps:**
1. Set Connection
2. Set Workers (Optional. If you do not set workers then default worker will be selected). **While setting the worker you need to specify the delay time in seconds (60 sec max for now)**
3. enqueue your item. If you do not supply worker in the options params then default worker will be applied to the item. Also, you can optionally set priority and retry values. **default worker runs at a frequency of every 1 sec**. If you wish to run at your own interval create your own worker.
4. subscribe to the worker. If you did not set any worker then it is required that you subscribe to the default worker. If you have set your own workers then make sure you subscribe to that worker to listen to the dequeue events.

**Simple Example**


```
var mongoQueue = require('mongoqueue');
var host = "",port="",database="",username="",password="",
    URL ="mongodb://username:pwd@host:port/database";

    //set the connection by URL or Details
    mongoQueue.setConnectionByURL(URL);
    Or
    mongoQueue.setConnectionByDetails(host, port, database, username, password);

    //enqueue(input object, options, callback function)
    mongoQueue.enqueue({a:'one',b:'one'},null,function(err,res){
        if(err) return console.log('enqueue', err);

        console.log(res);

    });

    //default listener event where you will get the dequeued item
    mongoQueue.subscription('default',function(err,msg){


        // perform your processing steps. based on the error or success perform
        // the below steps

        // mark as success
        mongoQueue.ackQueue('default', function(err,res){
            if(err) return console.log('ack failure ', err);

            console.log('ack success', res);

        });

        //or mark as failure
        mongoQueue.errQueue('default',"something went wrong",function(err,res){
            if(err) return console.log('err queue failure ', err);

            console.log('marked as err', res);

        });

    });

````

**Advanced Example:** Look at the example directory

**API Available:**

 1. setConnectionByURL(URL String)

 2. setConnectionByDetails(host, port , database, username, password)


 3. setWorkers([{name: "String", dequeDelayInSec: Number }
              ,{name: "String", dequeDelayInSec: Number }]
              ,callback)

    **Note: you this an optional step. If you do not set this then default worker be selected. Default worker runs every 1 second.**

 4. subscription ('worker name', callback(err, data))
