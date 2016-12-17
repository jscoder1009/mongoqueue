"use strict";

var mongoQueue = function () {
    this.mongoQueueConn = require('mongoose');
    this.mongooseQueueModel = null;
    this.mongoQueueConn.Promise = global.Promise;
}

mongoQueue.prototype.setConnection = function (host, port, database, username, password) {
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
    console.log('connection success');

    try {
        var Schema = this.mongoQueueConn.Schema,
            ObjectId = Schema.ObjectId;

        var queue = new Schema({
            queueId: ObjectId,
            params: {type: Object, required: true},
            enqueueTime: {type: Date, default: new Date()},
            dequeueStartTime: {type: Date, default: null},
            status: {type: String, required: true, enum: ['E', 'D', 'S', 'F'], default: 'E'},
            dequeueEndTime: {type: Date, default: null},
            errorMsg: {type: String},
            retry: {type: Number, required: true, default: 2},
            priority: {type: Number, default: 1, enum: [1, 2, 3, 4, 5]}
        });

        this.mongooseQueueModel = this.mongoQueueConn.model('queue', queue);

    } catch (e) {
        throw e;
    }

}

mongoQueue.prototype.enqueue = function (obj, options, cb) {
    if (obj == null)
        return cb('No Input Passed');

    try {

        var query = {params: obj};

        try {
            if (options.priority) query.priority = options.priority;

            if (options.retry) query.retry = options.retry;

        } catch (e) {

        }

        this.mongooseQueueModel.create(query, function (err, res) {
            if (err) return cb(err);

            return cb(null, {enqueueId: res._id});

        });

    } catch (e) {
        return cb(e);
    }


}

/** get the next eligible item in the queue**/
mongoQueue.prototype.peek = function (cb) {

    try {
        this.mongooseQueueModel
            .findOne({$or: [{status: "E"}, {status: "F", retry: {$lte: 2}}]})
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

/** get the next eligible item in the queue and mark it to Dequeue= D**/
mongoQueue.prototype.dequeue = function (cb) {

    try {

        // make sure there are no current process items in the Queue
        this.inProgressSize(function (err, size) {

            if (size == 0) {

                this.peek(function (err, res) {
                    if (err) return cb(err);

                    if (res != null) {
                        res.status = 'D';
                        res.dequeueStartTime = new Date();

                        res.save(function (err) {
                            if (err) cb(err)

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


        this.peek(function (err, res) {
            if (err) return cb(err);

            if (res != null) {
                res.status = 'D';
                res.dequeueStartTime = new Date();

                res.save(function (err) {
                    if (err) cb(err)

                    return cb(null, res);
                });
            } else {
                return cb(null);
            }

        });

    } catch (e) {
        return cb(e);
    }
}

/** Mark the inProgress Item in Dequeue (D) to Success (S) ***/
mongoQueue.prototype.ackQueue = function (cb) {

    try {
        this.inProgressQueue(function (err, res) {
            if (err) return cb(err);

            if (res != null) {
                res.dequeueEndTime = new Date;
                res.status = 'S';

                res.save(function(err){
                    if(err) return cb(err);

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
mongoQueue.prototype.errQueue = function (err,cb) {

    try {
        this.inProgressQueue(function (err, res) {
            if (err) return cb(err);

            if (res != null) {
                res.dequeueEndTime = new Date;
                res.status = 'F';
                res.errorMsg = err;

                res.save(function(err){
                    if(err) return cb(err);

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

/** Number of records which are yet to be processed ***/
mongoQueue.prototype.pendingSize = function (cb) {
    this.mongooseQueueModel.count({status: {$in: ["F", "E"]}}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Number of records which are being processing ***/
mongoQueue.prototype.inProgressSize = function (cb) {
    this.mongooseQueueModel.count({status: "D"}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Number of records which are in Failed status ***/
mongoQueue.prototype.failedSize = function (cb) {
    this.mongooseQueueModel.count({status: "F"}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Number of records which are in Success status ***/
mongoQueue.prototype.successSize = function (cb) {
    this.mongooseQueueModel.count({status: "S"}, function (err, count) {
        if (err) return cb(err);

        return cb(null, count);
    });
}

/** Get the current processing Item ***/
mongoQueue.prototype.inProgressQueue = function (cb) {

    try {
        this.mongooseQueueModel
            .findOne({status: "D"}
                , {_id: 1},
                function (err, res) {
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

module.exports = new mongoQueue();