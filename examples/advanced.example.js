var mongoQueue = require('../index');

var host = "",port="",database="",username="",password="", URL ="mongodb://username:pwd@host:port/database";

//username, password are optional parameters
mongoQueue.setConnectionByURL(URL);

mongoQueue.setWorkers([{name: "Worker1", dequeDelayInSec: 5 },{name: "Worker2", dequeDelayInSec: 20 }],function(err, res){
    if(err) return console.log('setWorkers err', err);

    console.log(res);
});

// setup various workers with dequeuDelayInSec depending upon your scenario

//enqueue an item and associate to Worker2
mongoQueue.enqueue({a:'one',b:'one'},{worker: 'Worker2'},function(err,res){
    if(err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to Worker2
mongoQueue.enqueue({a:'two',b:'two'},{worker: 'Worker2'},function(err,res){
    if(err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to Worker1
mongoQueue.enqueue({a:'three',b:'three'},{worker: 'Worker1'},function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

//enqueue an item and associate to Worker1
mongoQueue.enqueue({a:'four',b:'four'},{worker: 'Worker1'},function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

//enqueue an item and associate to default worker
mongoQueue.enqueue({a:'five',b:'five'},{retry:5},function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

//enqueue an item and associate to default worker
mongoQueue.enqueue({a:'six',b:'six'},null,function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

//subscribe to worker events
mongoQueue.subscription('Worker1',function(err,msg){

    mongoQueue.ackQueue('Worker1', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

//subscribe to worker events
mongoQueue.subscription('Worker2',function(err,msg){

    mongoQueue.ackQueue('Worker2', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

//subscribe to worker events
mongoQueue.subscription('default',function(err,msg){

    mongoQueue.errQueue('default', "something wrong", function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('err success', res);

    });

});
