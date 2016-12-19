# mongoqueue: Mongoose based light weight Queueing Engine on NPM

This is a light weight queuing engine. If you are already running "mongoose" and "cron" libraries in your application this is ideal for you.

**Pre-Requisites**: Two NPM libraries are required for mongoqueue to work.

`npm install cron -D`

`npm install mongoose -D`

**Steps:**

1. Set your Connection. Either by URL or Details
2. Set Custom Workers [Optional]. If you do not set workers then default worker will be selected). **While setting the worker you need to specify the delay time in seconds (60 sec max for now)**
3. Enqueue your item. If you do not supply worker in the options params then default worker will be applied to the item. Also, you can optionally set priority and retry values. If you wish to run at your own interval create your own custom worker.

   Note: **default worker runs at a frequency of every 1 sec**.
4. Subscribe to the default worker or your custom workers. **If you did not set any worker then it is required that you subscribe to the default worker.** If you have set your own workers then make sure you subscribe to that worker to listen to the dequeue events.

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

 1. **setConnectionByURL**: If you already have a constructed URL.

    `setConnectionByURL("mongodb://username/password@host:port/database");`

 2. **setConnectionByDetails**: If you want to pass details and get connected

    `setConnectionByDetails(host, port , database, username, password)`

 3. **setWorkers**: You can setup your custom workers with a dequeueDelayInSec

      ```
      setWorkers([{name: "worker1", dequeDelayInSec: 1-60 sec }
                  ,{name: "worker2", dequeDelayInSec: 1-60 sec }]
                  ,function(err, data){

                        //process your logic
                   });
      ```

     **Note: If you did not set this API then default worker be selected. Default worker runs every 1 second.**

 4. **Subscription**: You will get your dequeued item events in this API.

    `Subscription('worker1', function(err, data){
        //process your application logic
    });`

 5. **peek**:  get the next eligible item in the queue by worker

 6. **ackQueue**: To mark a dequeued item as Success by worker

 7. **errQueue**: To mark a dequeued item as Error by worker

 8. **inProgressQueue**: get the current Dequeued items ("D") by worker

 9. **Size**: Sometime you would want to know the size of the queue by worker (either default work or custom workers you have setup)

    (a) **pendingSize**: get pending size of the queue by worker.

    (b) **inProgressSize**: get in-progress size of the queue by worker.

    (c) **failedSize**: get failed size of the queue by worker.

    (d) **successSize**: get success size of the queue by worker.
