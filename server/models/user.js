const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

let UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		minLength: 1,
		trim: true,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email.'
		}
	},
	password: {
		type: String,
		require: true,
		minLength: 6
	},
	tokens: [{
		access: {
			type: String,
			require: true
		},
		token: {
			type: String,
			require: true
		}
	}]
});

UserSchema.methods.toJSON = function() {
	var userObject = this.toObject();

	return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function() {
	var access = 'auth';
	var token = jwt.sign({_id: this._id.toHexString(), access}, 'abc123').toString();

	this.tokens.push({access, token});

	return this.save().then(() => {
		return token;
	});
};

UserSchema.statics.findByToken = function(token) {
	let decoded;

	try {
		decoded = jwt.verify(token, 'abc123')	;
	} catch(e) {
		return Promise.reject();
	}

	return this.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};