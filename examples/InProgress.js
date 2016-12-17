var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);

//Returns the queue Item with Dequeue Status = D
mongoQueue.inProgressQueue(function(err,res){
    if(err) return console.log(err);

    console.log('inProgressSize Queue: ',res);
});