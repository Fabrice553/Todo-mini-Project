const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Task = require('../models/Task');

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__ || process.env.MONGO_DB_CONNECTION_URL || 'mongodb://127.0.0.1:27017/todos-test');
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Tasks', () => {
  let agent;
  beforeEach(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    const user = new User({ username: 'bob', password: 'pass' });
    await user.save();
    agent = request.agent(app);
    await agent.post('/auth/login').send({ username: 'bob', password: 'pass' });
  });

  test('create and complete task', async () => {
    const create = await agent.post('/tasks/create').send({ title: 'Test task' });
    expect([302, 200]).toContain(create.status);
    const tasks = await Task.find({});
    expect(tasks.length).toBe(1);
    const id = tasks[0]._id;
    const complete = await agent.post(`/tasks/${id}/state`).send({ state: 'completed' });
    expect([302, 200]).toContain(complete.status);
    const updated = await Task.findById(id);
    expect(updated.state).toBe('completed');
  });
});