var mongoQueue = require('../index');

var host = "",port="",database="",username="",password="", URL ="mongodb://matrimonynextdev:matrimonynextdev@ds025742.mlab.com:25742/matrimonynextdev";

//username, password are optional parameters
mongoQueue.setConnectionByURL(URL);

mongoQueue.setWorkers([{name: "Worker1", dequeDelayInSec: 5 },{name: "Worker2", dequeDelayInSec: 20 }],function(err, res){
    if(err) return console.log('setWorkers err', err);

    console.log(res);
});

mongoQueue.enqueue({a:'one',b:'one'},{worker: 'Worker2'},function(err,res){
    if(err) return console.log('enqueue', err);

    console.log(res);

});

mongoQueue.enqueue({a:'two',b:'two'},{worker: 'Worker2'},function(err,res){
    if(err) return console.log('enqueue', err);

    console.log(res);

});

mongoQueue.enqueue({a:'three',b:'three'},{worker: 'Worker1'},function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

mongoQueue.enqueue({a:'four',b:'four'},{worker: 'Worker1'},function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

mongoQueue.enqueue({a:'five',b:'five'},null,function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

mongoQueue.enqueue({a:'six',b:'six'},null,function(err,res){
 if(err) return console.log('enqueue', err);

 console.log(res);

 });

mongoQueue.subscription('Worker1',function(err,msg){

    mongoQueue.ackQueue('Worker1', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

mongoQueue.subscription('Worker2',function(err,msg){

    mongoQueue.ackQueue('Worker2', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

mongoQueue.subscription('default',function(err,msg){

    mongoQueue.ackQueue('default', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});
