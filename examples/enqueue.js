var mongoQueue = require('../index.js');

var host = "",port="",database="",username="",password="";

//username, password are optional parameters
mongoQueue.setConnection(host,port,database,username,password);

// Enqueue : No Options
mongoQueue.enqueue({a:'two',b:'two'},null,function(err,res){
    if(err) return console.log('enqueue', err);

    console.log('enqueue',res);

});

//Enqueue with Options: only two options are supported - priority, retry
mongoQueue.enqueue({a:'one',b:'one'},{priority:3, retry: 3},function(err,res){
    if(err) console.log('enqueue', err);

    console.log('enqueue',res);

});