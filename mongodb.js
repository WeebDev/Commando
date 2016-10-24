const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

module.exports = { Schema };

mongoose.connect('mongodb://localhost:27017/Hamakaze');
