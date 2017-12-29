const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

// Empty DB and insert test documents before each test is executed
beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
	it('should create a new todo', (done) => {
		let text = 'Test todo text';

		request(app)
			.post('/todos')
			.send({ text })
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if(err) {
					return done(err);
				}

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e));
			});
	});

	it('should not create a todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.send({})
			.expect(400)
			.end((err, res) => {
				if(err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((e) => done(e));
			});
	});
});

describe('GET /todos', () => {
	it('should get all todos', (done) => {
		request(app)
			.get('/todos')
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(2);
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {
	it('should return a todo', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(todos[0].text)
			})
			.end(done);
	});

	it('should return 404 if a todo is not found', (done) => {
		request(app)
			.get(`/todos/${new ObjectID().toHexString()}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.get('/todos/123')
			.expect(404)
			.end(done);
	});
});

describe('DELETE /todos/:id', () => {
	it('should remove a todo', (done) => {
		let hexId = todos[1]._id.toHexString();

		request(app)
			.delete(`/todos/${hexId}`)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(hexId);
			})
			.end((err, res) => {
				if(err) {
					return done(err);
				}

				Todo.findById(hexId).then((todo) => {
					expect(todo).toBeNull();
					done();
				}).catch(e => done(e));
			});
	});

	it('should return 404 if todo not found', (done) => {
		request(app)
			.delete(`/todos/${new ObjectID().toHexString()}`)
			.expect(404)
			.end(done);
	});

	it('should return 404 if object id is invalid', (done) => {
		request(app)
			.get('/todos/abc123')
			.expect(404)
			.end(done);
	});
});

describe('PATCH /todos/:id', () => {
	it('should update the todo', (done) => {
		let hexId = todos[0]._id.toHexString();
		let text = 'This is the new text';

		request(app)
			.patch(`/todos/${hexId}`)
			.send({text, completed: true})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
				expect(res.body.completed).toBe(true);
				expect(typeof res.body.completedAt).toBe('number');
			})
			.end(done);
	});

	it('should clear completedAt when todo is not completed', (done) => {
		let hexId = todos[1]._id.toHexString();
		let text = 'This is the new text!!!';

		request(app)
			.patch(`/todos/${hexId}`)
			.send({text, completed: false})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
				expect(res.body.completed).toBe(false);
				expect(res.body.completedAt).toBeNull();
			})
			.end(done);
	});
});

describe('GET /user/me', () => {
	it('should return a user if authenticated', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toHexString());
				expect(res.body.email).toBe(users[0].email);
			})
			.end(done);
	});

	it('should return 404 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({});
			})
			.end(done);
	});
});

describe('GET /user/me', () => {
	it('should create a user', (done) => {
		var email = 'example@example.com';
		var password = '123mnb!';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeDefined();
				expect(res.body._id).toBeDefined();
				expect(res.body.email).toBe(email);
			})
			.end((err) => {
				if(err) return done(err);

				User.findOne({email}).then((user) => {
					expect(user).toBeDefined();
					// expect(user.password).toNotBe(password);
					done();
				});
			});
	});

	it('should return validation errors if request is invalid', (done) => {
		request(app)
			.post('/users')
			.send({ email: 'law', password: 'qwerty' })
			.expect(400)
			.end(done);
	});

	it('should not create a user if email is in use', (done) => {
		request(app)
			.post('/users')
			.send({ email: users[0].email, password: 'Password123!' })
			.expect(400)
			.end(done);
	});
});
