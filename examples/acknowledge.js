var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);

// to acknowledge there should be an item in dequeue state.
// This method will automatically mark the Dequeued item to Success
mongoQueue.ack(function(err,res){
    if(err) return console.log(err);

    console.log('res in acq',res);
});