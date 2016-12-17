var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);

//dequeue item from the queue. If no Items are eligible you get NULL
mongoQueue.dequeue(function(err,res){
 if(err) return console.log(err);

 console.log('res in dq',res);

});