const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

const app = express();
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	let todo = new Todo({
		text: req.body.text
	});

	todo.save().then(doc => {
		res.send(doc);
	}, e => {
		res.status(400).send(e);
	});
});

app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', (req, res) => {
	let todoId = req.params.id;

	if(!ObjectID.isValid(todoId)) {
		res.status(404).send();
	}

	Todo.findById(req.params.id).then((todo) => {
		if(!todo) {
			res.status(404).send();
		}
		
		res.send(todo);
	}).catch((e) => {
		res.status(400).send();
	});
});

app.delete('/todos/:id', (req, res) => {
	let todoId = req.params.id;
	
	if(!ObjectID.isValid(todoId)) {
		res.status(404).send();
	}

	Todo.findByIdAndRemove(todoId).then((todo) => {
		if(!todo) {
			res.status(404).send();
		}
		
		res.send(todo);
	}).catch((e) => {
		res.status(400).send();
	});
});

app.patch('/todos/:id', (req, res) => {
	let todoId = req.params.id;
	let body = _.pick(req.body, ['text', 'completed']);

	if(!ObjectID.isValid(todoId)) {
		res.status(404).send();
	}

	if(_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	Todo.findByIdAndUpdate(todoId, {$set: body}, {new: true}).then((todo) => {
		if(!todo) {
			res.status(404).send();
		}

		res.send(todo);
	}).catch((e) => {
		res.status(400).send();
	});
});

app.listen(3000, () => {
	console.log('Started on port 3000.');
});

module.exports = {app};