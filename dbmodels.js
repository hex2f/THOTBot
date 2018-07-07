const mongoose = require('mongoose');

const Queue = mongoose.model('queues', {
    server: String,
    channel: String,
    voice: String,
    requestedBy: String,
    requestedByName: String,
    video: String,
    title: String,
    added: { type: Date, default: Date.now() }
});

module.exports = { Queue }