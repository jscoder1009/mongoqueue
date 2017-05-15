# mongoqueue: Mongoose based light weight Queueing Engine on NPM

This is a light weight queuing engine. If you are already running "mongoose" and "cron" libraries in your application this is ideal for you.

**Pre-Requisites**: Two NPM libraries are required for mongoqueue to work.

`npm install cron -D`

`npm install mongoose -D`

**Steps:**

1. [**`Required`**] Set your Connection. Either by URL or Details
2. [**`Optional`**] Set your Custom Workers with your desired schedule. If you did not set your customer workers then a default worker will be selected). **While setting the worker you need to specify the dequeDelayCron in cron pattern**. You can optionally setup cleanup worker schedule to clear out the Successfully processed queue items as per your desired cron pattern. Look at the advanced example for more information.
3. [**`Required`**] Enqueue your item. If you do not supply worker in the options params then default worker will be applied to the item. Also, you can optionally set priority and retry values. If you wish to run at your own interval create your own custom worker.

   Note: **default worker runs at a frequency of every 1 sec**.
4. [**`Required`**] Subscribe to the default worker or your custom workers. **If you did not set any custom workers then it is required that you subscribe to the default worker.** If you have set your own workers then make sure you subscribe to that worker to listen to the dequeue events.

    Inside the callback of the subscribe method: <br><br>
         4.1. Mark as Success. Acknowledge the dequeued item <br>
         4.2. Mark as Error.

Please look at the API documentation below and example directory for further information

**Simple Example**


```
var mongoQueue = require('mongoqueue');
var host = "",port="",database="",username="",password="", URL ="mongodb://username:pwd@host:port/database";

//username, password are optional parameters
mongoQueue.setConnectionByDetails(host, port, database, null, null);
or
mongoQueue.setConnectionByURL(URL);

// enqueue(input object, options, callback function)
mongoQueue.enqueue({data: {a: 'input1', b: 'input2'}}, function (err, res) {
    if (err) return console.log('enqueue', err);

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

    or

    //mark as failure
    mongoQueue.errQueue('default',"something went wrong",function(err,res){
        if(err) return console.log('err queue failure ', err);

        console.log('marked as err', res);

    });

});


````

**Advanced Example:** Look at the example directory

**Available Methods:**

 1. **setConnectionByURL**: If you already have a constructed URL.

    ```
    setConnectionByURL("mongodb://username/password@host:port/database");
    ```

 2. **setConnectionByDetails**: If you want to pass details and get connected

    ```
    setConnectionByDetails(host, port , database, username, password)
    ```

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

    ```
    Subscription('worker1', function(err, data){
        //process your application logic
    });
    ```

 5. **peek**:  get the next eligible item in the queue by worker

 6. **ackQueue**: To mark a dequeued item as Success by worker

    ```
    mongoQueue.ackQueue('worker name', function(err,res){
            if(err) return console.log('ack failure ', err);

            console.log('ack success', res);

     });
     ```

 7. **errQueue**: To mark a dequeued item as Error by worker

    ```
    mongoQueue.errQueue('worker name', "err msg - something wrong", function(err,res){
            if(err) return console.log('ack failure ', err);

            console.log('err success', res);

     });
     ```

 8. **inProgressQueue**: get the current Dequeued items ("D") by worker

 9. **reQueueAll**: Reset all the F records to Enqueue (E) status.

    **Note:** Only those records for which attempts is equal to retry meaning they have already retried N times and the records are in the dead queue status.


    ```
    mongoQueue.reQueueAll('worker name',function(err,res){
      if(err) return console.log('enqueue', err);

      console.log('requeue success', res);

    });
    ```

 10. **Size**: Sometime you would want to know the size of the queue by worker (either default work or custom workers you have setup)

     (a) **pendingSize**: get pending size of the queue by worker.

        ```
        mongoQueue.pendingSize('worker name',function(err,res){
        );
        ```

     (b) **inProgressSize**: get in-progress size of the queue by worker.

        ```
        mongoQueue.inProgressSize('worker name',function(err,res){
        )
        ```

     (c) **failedSize**: get failed size of the queue by worker.

        ```
        mongoQueue.failedSize('worker name',function(err,res){
            )
        ```

     (d) **successSize**: get success size of the queue by worker.

        ```
        mongoQueue.successSize('worker name',function(err,res){
                )
        ```