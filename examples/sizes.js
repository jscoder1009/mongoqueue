var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);

//should only return 1 when an item is in Dequeue Status = D
mongoQueue.inProgressSize(function(err,res){
    if(err) return console.log(err);

    console.log('inProgressSize size',res);
});

//Number of items in the Queue ready to be processed.s
mongoQueue.pendingSize(function(err,size){
    console.log('pending size', size)
});

//Number of items in the Queue with failed status to be processed.s
mongoQueue.failedSize(function(err,size){
    console.log('failedSize size', size)
});

//Number of items in the Queue with Success Status to be processed.s
mongoQueue.successSize(function(err,size){
    console.log('successSize size', size)
});





