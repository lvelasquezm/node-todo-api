const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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

UserSchema.statics.findByCredentials = function(email, password) {
	return this.findOne({email}).then((user) => {
		if(!user) return Promise.reject();

		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if(res) resolve(user);
				else reject();
			});
		});
	});
};

UserSchema.pre('save', function(next) {
	if(this.isModified('password')) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(this.password, salt, (err, hash) => {
				this.password = hash;
				next();
			});
		});
	}else {
		next();
	}
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};