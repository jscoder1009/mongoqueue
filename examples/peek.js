var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);


//returns the next eligible item to be processed from the queue
mongoQueue.peek(function(err,res){
    if(err) return console.log('Peek Error: ', err);

    console.log('enqueue',res);

});