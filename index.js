"use strict";
var CronJob = require('cron').CronJob;

var initializeModel = function (queueConn) {

    try {
        var Schema = queueConn.Schema,
            ObjectId = Schema.ObjectId;

        var queue = new Schema({
            queueId: ObjectId,
            worker: {type: String, required: true, default: 'default'},
            params: {type: Object, required: true},
            enqueueTime: {type: Date, default: new Date()},
            dequeueStartTime: {type: Date, default: null},
            status: {type: String, required: true, enum: ['E', 'D', 'S', 'F'], default: 'E'},
            dequeueEndTime: {type: Date, default: null},
            errorMsg: {type: String},
            retry: {type: Number, required: true, default: 2},
            attempts: {type: Number, required: true, default: 0},
            priority: {type: Number, default: 1, enum: [1, 2, 3, 4, 5]}
        });

        return queueConn.model('queue', queue);

    } catch (e) {
        throw e;
    }

}

var events = (function () {
    var topics = {};
    var hOP = topics.hasOwnProperty;

    return {
        subscribe: function (topic, listener) {
            // Create the topic's object if not yet created
            if (!hOP.call(topics, topic)) topics[topic] = [];

            // Add the listener to queue
            var index = topics[topic].push(listener) - 1;

            // Provide handle back for removal of topic
            return {
                remove: function () {
                    delete topics[topic][index];
                }
            };
        },
        publish: function (topic, info) {
            // If the topic doesn't exist, or there's no listeners in queue, just leave
            if (!hOP.call(topics, topic)) return;

            // Cycle through topics queue, fire!
            topics[topic].forEach(function (item) {
                item(info != undefined ? info : {});
            });
        }
    };
})();

/** get the next eligible item in the queue and mark it to Dequeue= D**/
var dequeue = function (_this, worker, cb) {

    try {

        // make sure there are no current process items in the Queue
        _this.inProgressSize(worker, function (err, size) {

            if (size == 0) {

                _this.peek(worker, function (err, res) {
                    if (err) return cb(err);

                    if (res != null) {

                        res.status = 'D';
                        res.dequeueStartTime = new Date();
                        res.attempts = res.attempts + 1;

                        res.save(function (err) {
                            if (err) cb(err)

                            if (_this.debug)
                                console.log('dequeing item Saved ', res._id, ' for worker ', ' attempts ', res.attempts);


                            return cb(null, res);

                        });
                    } else {
                        return cb(null);
                    }

                });

            } else {
                cb('Queue Item is currently in process');
            }
        });

    } catch (e) {
        return cb(e);
    }
}

var mongoQueue = function () {
    this.mongoQueueConn = require('mongoose');
    this.mongooseQueueModel = null;
    this.mongoQueueConn.Promise = global.Promise;
    this.debug = false;
    this.workers = [];

    this.setWorkers([{name: "default", options: {dequeDelayCron: '* * * * * *'}}], function (err, res) {
        if (err) {
            console.log('set default worker failed - ', err);
            throw err;
        }

        if (this.debug)
            console.log('success in setting worker default');
    });
    //this.startWorkers(this.workers[0]);
}

mongoQueue.prototype.setDebug = function (debug) {
    this.debug = debug;
}

/** set connection by detals **/
mongoQueue.prototype.setConnectionByDetails = function (host, port, database, username, password) {
    if (host == null || host == '')
        throw 'host is required input argument.';

    if (port == null || port == '')
        throw 'port is required input argument.';

    if (database == null || database == '')
        throw 'database is required input argument.';

    if (username == null || username == '') {
        //username is not passed. now check if password is passed or not

        if (password == null || password == '') {
            //password is not passed too. connect with simple connection

            try {

                if (!this.mongoQueueConn.connection.readyState)
                    this.mongoQueueConn.connect('mongodb://' + host + '/' + database);
            } catch (e) {
                throw e;
            }

        } else {
            throw 'username is required when password is passed';
        }

    } else {
        if (password == null || password == '') {
            throw 'password is required when username is passed';
        } else {

            try {
                this.mongoQueueConn.connect("mongodb://" + username + ":" + password + "@" + host + ":" + port + "/" + database);
            } catch (e) {
                throw e;
            }


        }
    }
    if (this.debug) console.log('mongoqueue connection success');

    this.mongooseQueueModel = initializeModel(this.mongoQueueConn);

}

/** set connection by URL **/
mongoQueue.prototype.setConnectionByURL = function (URL) {

    if (URL == null || URL == '')
        throw 'URL is required input argument.';

    try {
        if (!this.mongoQueueConn.connection.readyState)
            this.mongoQueueConn.connect('mongodb://' + URL);

        this.mongooseQueueModel = initializeModel(this.mongoQueueConn);

    } catch (e) {
        throw e;
    }
}

mongoQueue.prototype.setWorkers = function (workers, cb) {
    var _workers = this.workers;
    var _this = this;

    if (_this.debug)
        console.log('set worker invoked  ', workers, ' at ', new Date());

    try {

        if (Array.isArray(workers)) {
            workers.forEach(function (a) {

                if (_this.debug)
                console.log('setting worker  ', a.name, ' at ', new Date());

                var workerStr;

                try {
                    workerStr = a.options.dequeueDelayCron.toString();

                } catch (e) {
                    workerStr = '* * * * * *';
                }


                var job = new CronJob(
                    {
                        cronTime: workerStr,
                        onTick: function () {
                            if (_this.debug)
                                console.log('worker running now ', a.name, ' at ', new Date());

                            _this.pendingSize(a.name, function (err, size) {
                                if (size == 0) {
                                    _this.stopWorker(a.name, function (err, res) {
                                        if (err) return cb(err);

                                        if (_this.debug)
                                            console.log('worker stopped now ', a.name);
                                    });
                                } else {
                                    dequeue(_this, a.name, function (err, data) {
                                        if (err) {
                                            return cb(err);
                                        }

                                        if (data != undefined) {
                                            events.publish(a.name, {
                                                data: data
                                            });
                                        }
                                    });
                                }

                            });
                        },
                        start: false,
                        timeZone: 'GMT'
                    });

                a.job = job;

                try {

                    a.jobClearSuccess = new CronJob({
                        cronTime: a.options.deleteSuccessCron.toString(),
                        onTick: function () {
                            if (_this.debug)
                                console.log('clean job worker running now ', a.name, ' at ', new Date());

                            _this.successSize(a.name, function (err, count) {
                                if (err)  return cb(err);

                                if (count == 0) {
                                    if (_this.debug)
                                        console.log('going to stop clean worker running now ', a.name, ' at ', new Date());

                                    _this.stopCleanWorker(a.name, function (err, res) {
                                        if (err) return cb(err);

                                        if (_this.debug)
                                            console.log('stopped clean worker ', a.name, ' at ', new Date());


                                    });


                                } else {
                                    if (_this.debug)
                                        console.log('Going to Delete Success[S] by clean worker ', a.name, ' at ', new Date());

                                    _this.clearSuccessQueueItems(a.name, function (err, res) {
                                        if (err) return cb(err);

                                        if (_this.debug)
                                            console.log('Successfully to Deleted Success[S] by clean worker ', a.name, ' at ', new Date());

                                    })

                                }

                            });
                        },
                        start: false,
                        timeZone: 'GMT'
                    });

                } catch (e) {
                    if (_this.debug) {
                        console.log('Cleanup Worker Not setup for ', a.name, ' at ', new Date());
                    }


                }

                _workers.push(a);
            });
        }

    } catch (e) {
        console.log(e);
        throw e;
    }

}

mongoQueue.prototype.startWorker = function (worker, cb) {

    var _this = this;

    if (_this.debug)
        console.log('start worker job invoked ', worker);

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    try {

        if (_this.debug)
            console.log('starting job worker', worker);

        var index = _this.workers.map(function (x) {
            return x.name;
        }).indexOf(worker);

        if (!_this.workers[index].job.running)
            _this.workers[index].job.start();

    } catch (e) {
        return e;
    }

}

mongoQueue.prototype.startCleanWorker = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    var _this = this;
    try {

        if (_this.debug)
            console.log('starting job Clean worker', worker);

        var index = _this.workers.map(function (x) {
            return x.name;
        }).indexOf(worker);

        if (!_this.workers[index].jobClearSuccess.running)
            _this.workers[index].jobClearSuccess.start();

    } catch (e) {
        return e;
    }

}

mongoQueue.prototype.stopWorker = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    var _this = this;
    try {

        var index = _this.workers.map(function (x) {
            return x.name;
        }).indexOf(worker);

        if (_this.workers[index].job.running)
            _this.workers[index].job.stop();

        if (_this.debug)
            console.log('stopped worker  ', worker);

    } catch (e) {
        return e;
    }
}

mongoQueue.prototype.stopCleanWorker = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    var _this = this;
    try {

        var index = _this.workers.map(function (x) {
            return x.name;
        }).indexOf(worker);

        if (_this.workers[index].jobClearSuccess.running)
            _this.workers[index].jobClearSuccess.stop();

    } catch (e) {
        return e;
    }
}

/** enqueue method **/
mongoQueue.prototype.enqueue = function (obj, cb) {

    var _this = this;

    if (_this.debug)
        console.log('Enqueue details ', obj);

    if (_this.debug)
        console.log('worker details ', this.workers[0].name);

    if (obj.data == null)
        return cb('No Input Passed');

    try {

        var query = {params: obj.data};

        //setting default worker
        query.worker = this.workers[0].name;

        try {

            if(obj.worker){
                //if worker is passed then overriding with passed worker
                if (!this.isValidWorker(obj.worker)) {
                    return cb("Invalid Worker Provided " + obj.worker);
                }
            }

            query.worker = obj.worker;

        } catch (e) {

        }

        try {
            if (obj.options.priority) query.priority = obj.options.priority;

        } catch (e) {

        }

        try {

            if (obj.options.retry) query.retry = obj.options.retry;

        } catch (e) {

        }

        if (_this.debug)
            console.log('Enqueue details validated ', query);

        this.mongooseQueueModel.create(query, function (err, res) {
            if (err) return cb(err);

            _this.startWorker(res.worker);
            return cb(null, {enqueueId: res._id});

        });

    } catch (e) {
        return cb(e);
    }


}

/** get the next eligible item in the queue**/
mongoQueue.prototype.peek = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    try {
        this.mongooseQueueModel
        //.findOne({$or: [{status: "E"}, {status: "F", attempts: {$lte: 1}}], worker: worker})
            .findOne({worker: worker})
            .$where('(this.status == "E") || (this.status == "F" && this.attempts < this.retry)')
            //.$where('this.status == "F" && this.attempts <= this.retry')
            .sort({priority: -1, enqueueTime: 1})
            .limit(1)
            .exec(function (err, res) {
                if (err) cb(err);

                if (res != null) {
                    return cb(null, res);
                } else {
                    return cb(null, null);
                }

            });

    } catch (e) {
        return cb(e);
    }
}

/** Mark the inProgress Item in Dequeue (D) to Success (S) ***/
mongoQueue.prototype.ackQueue = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    var _this = this;
    try {
        _this.inProgressQueue(worker, function (err, res) {
            if (err) return cb(err);

            if (res != null) {
                res.dequeueEndTime = new Date;
                res.status = 'S';

                res.save(function (err) {
                    if (err) return cb(err);

                    _this.startCleanWorker(worker);
                    return cb(null, res._id);
                })


            } else {
                cb('No Queue Items in progress state aka status:"D". Cannot Acknowledge');
            }
        });
    } catch (e) {
        return cb(e);
    }
}

/** Mark the inProgress Item in Dequeue (D) to Fail (F) ***/
mongoQueue.prototype.errQueue = function (worker, errMsg, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    var _this = this;
    try {
        _this.inProgressQueue(worker, function (err, res) {
            if (err) return cb(err);

            if (res != null) {
                res.dequeueEndTime = new Date;
                res.status = 'F';
                res.errorMsg = errMsg;

                res.save(function (err) {
                    if (err) return cb(err);

                    return cb(null, res._id);
                })


            } else {
                cb('No Queue Items in progress state aka status:"D". Cannot Acknowledge');
            }
        });
    } catch (e) {
        return cb(e);
    }
}

/** Mark the inProgress Item in Dequeue (D) to Fail (F) ***/
mongoQueue.prototype.reQueueAll = function (worker, cb) {

    var _this = this;
    try {

        if (!this.isValidWorker(worker)) {
            return cb("Invalid Worker Provided " + worker);
        }

        // all the records which are retried more than twice are in dead queue status. Marking all as E again to be picked up.
        _this.mongooseQueueModel
            .where("this.status == 'F' && this.attempts == this.retry")
            .update({"worker": worker}, {
                $set: {
                    status: 'E',
                    retry: 2,
                    attempts: 0
                }
            }, {multi: true}, function (err, res) {
                if (err) return cb(err);

                _this.startWorker(worker);
                return cb(null, "queued all Failed back to Success");
            });

    } catch (e) {
        return cb(e);
    }
}

/** Mark the inProgress Item in Dequeue (D) to Fail (F) ***/
mongoQueue.prototype.reQueueItem = function (worker, Id, cb) {

    var _this = this;
    try {

        if (!this.isValidWorker(worker)) {
            return cb("Invalid Worker Provided " + worker);
        }

        // all the records which are retried more than twice are in dead queue status. Marking all as E again to be picked up.
        _this.mongooseQueueModel
            .where("this.status == 'F' && this.attempts == this.retry")
            .update({"worker": worker, _id: Id}, {
                $set: {
                    status: 'E',
                    retry: 2,
                    attempts: 0
                }
            }, {multi: true}, function (err, res) {
                if (err) return cb(err);

                _this.startWorker(worker);
                return cb(null, "queued all Failed back to Success");
            });

    } catch (e) {
        return cb(e);
    }
}

/** Number of records which are yet to be processed, including failed records with retry less than or equal to 2***/
mongoQueue.prototype.pendingSize = function (worker, cb) {
    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    this.mongooseQueueModel.count({worker: worker})
        .$where('(this.status == "E") || (this.status == "F" && this.attempts < this.retry) ')
        .exec(function (err, count) {
            if (err) return cb(err);

            return cb(null, count);
        });
}

/** Number of records which are being processing ***/
mongoQueue.prototype.inProgressSize = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    this.mongooseQueueModel.count({status: "D", worker: worker}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Number of records which are in Failed status ***/
mongoQueue.prototype.failedSize = function (worker, cb) {
    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    this.mongooseQueueModel.count({status: "F", worker: worker}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Number of records which are in Success status ***/
mongoQueue.prototype.successSize = function (worker, cb) {
    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }


    this.mongooseQueueModel.count({status: "S", worker: worker}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Get the current processing Item ***/
mongoQueue.prototype.inProgressQueue = function (worker, cb) {

    try {
        this.mongooseQueueModel
            .findOne({status: "D", worker: worker}
                //, {_id: 1},
                , function (err, res) {
                    if (err) cb(err);

                    if (res != null) {
                        return cb(null, res);
                    } else {
                        return cb(null, null);
                    }

                });

    } catch (e) {
        return cb(e);
    }

}

mongoQueue.prototype.subscription = function (worker, cb) {

    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    events.subscribe(worker, function (obj) {
        // Do something now that the event has occurred

        cb(null, obj);
    });
};

mongoQueue.prototype.isValidWorker = function (worker) {

    //check if the worker is initialized
    if (this.workers.map(function (x) {
            return x.name;
        }).indexOf(worker) < 0) {
        return false;
    } else
        return true;

}

mongoQueue.prototype.clearSuccessQueueItems = function (worker, cb) {
    if (!this.isValidWorker(worker)) {
        return cb("Invalid Worker Provided " + worker);
    }

    this.mongooseQueueModel.remove({status: "S", worker: worker}, function (err, res) {
        if (err) return cb(err);

        return cb(null, res);

    })

}

module.exports = new mongoQueue();