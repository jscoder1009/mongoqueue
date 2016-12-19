var mongoQueue = require('../index');

var host = "",port="",database="",username="",password="", URL ="mongodb://username:pwd@host:port/database";

//username, password are optional parameters
mongoQueue.setConnectionByURL(URL);

// enqueue(input object, options, callback function)
mongoQueue.enqueue({a:'one',b:'one'},{retry:1},function(err,res){
    if(err) return console.log('enqueue', err);

    console.log(res);

});

//default listener event where you will get the dequeued item
mongoQueue.subscription('default',function(err,msg){

    // perform your processing steps. based on the error or success perform
    // the below steps

    // mark as success
    /*mongoQueue.ackQueue('default', function(err,res){
        if(err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });*/

    //mark as failure
    mongoQueue.errQueue('default',"something went wrong",function(err,res){
        if(err) return console.log('err queue failure ', err);

        console.log('marked as err', res);

    });

});

