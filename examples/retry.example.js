var mongoQueue = require('../index');

var host = "",port="",database="",username="",password="", URL ="mongodb://username:pwd@host:port/database";

//enable debug
mongoQueue.setDebug(true);

//username, password are optional parameters
mongoQueue.setConnectionByURL(URL);

mongoQueue.setWorkers([{name: "Worker1", dequeDelayInSec: 5 },{name: "Worker2", dequeDelayInSec: 20 }],function(err, res){
    if(err) return console.log('setWorkers err', err);

    console.log(res);
});

//requeue all F records to Enqueue status again
mongoQueue.reQueueAll('default',function(err,res){
    if(err) return console.log('enqueue', err);

    console.log('requeue success', res);

});

//requeue individual item to Enqueue status again
mongoQueue.reQueueItem('default',"585c3cfe0550f34975349923",function(err,res){
    if(err) return console.log('enqueue', err);

    console.log('requeue success', res);

});

mongoQueue.subscription('default',function(err,msg){

    mongoQueue.ackQueue('default', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});