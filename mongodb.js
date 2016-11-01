const mongoose = require('mongoose');

mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

module.exports = { Schema };

mongoose.connect('mongodb://localhost:27017/Commando', err => {
	if (err) console.error('Unable to connect to Mongo Server!');
	return;
});
