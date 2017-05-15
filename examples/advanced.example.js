var mongoQueue = require('../index');

var host = "localhost", port = "27017", database = "local", username = "", password = "", URL = "mongodb://username:pwd@host:port/database";

//username, password are optional parameters
mongoQueue.setConnectionByDetails(host, port, database, null, null);

// or set using URL
// mongoQueue.setConnectionByURL(URL);

//setting custom worker with schedules and optional information
mongoQueue.setWorkers([{name: "Worker1", options: {dequeDelayCron: '1/5 * * * * *'}},
                        {name: "Worker2", options: {dequeDelayCron: '1/10 * * * * *', deleteSuccessCron: "1/40 * * * * *"}
}], function (err, res) {
    if (err) return console.log('setWorkers err', err);

    console.log(res);
});


//enqueue an item and associate to default worker, with a retry of 5
mongoQueue.enqueue({data: {a: 'One', b: 'One'}, options: {retry: 5}}, function (err, res) {
    if (err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to Worker1 without options
mongoQueue.enqueue({data: {a: 'Two', b: 'Two'}, worker: 'Worker1'}, function (err, res) {
    if (err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to Worker2 without options
mongoQueue.enqueue({data: {a: 'Three', b: 'Three'}, worker: 'Worker2'}, function (err, res) {
    if (err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to Worker1 without options
mongoQueue.enqueue({data: {a: 'Four', b: 'Four'}, worker: 'Worker1'}, function (err, res) {
    if (err) return console.log('enqueue', err);

    console.log(res);

});

//enqueue an item and associate to default worker
mongoQueue.enqueue({data: {a: 'Five', b: 'Five'}}, function (err, res) {
    if (err) return console.log('enqueue', err);

    console.log(res);

});

//subscribe to worker events
mongoQueue.subscription('Worker1', function (err, msg) {

    mongoQueue.ackQueue('Worker1', function (err, res) {
        if (err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

//subscribe to worker events
mongoQueue.subscription('Worker2', function (err, msg) {

    mongoQueue.ackQueue('Worker2', function (err, res) {
        if (err) return console.log('ack failure ', err);

        console.log('ack success', res);

    });

});

//subscribe to worker events
mongoQueue.subscription('default', function (err, msg) {

    mongoQueue.errQueue('default', "something wrong", function (err, res) {
        if (err) return console.log('ack failure ', err);

        console.log('err success', res);

    });

});
