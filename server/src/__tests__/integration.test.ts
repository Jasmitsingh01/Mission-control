import request from 'supertest';
import app from '../../server/src/index'; // Assuming your Express app is exported from index.ts
import mongoose from 'mongoose';
import User from '../../server/src/models/User';
import Task from '../../server/src/models/Task';
import Organization from '../../server/src/models/Organization';
import OrgMember from '../../server/src/models/OrgMember';

// Mock JWT secret for testing
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';

beforeAll(async () => {
  // Use a separate test database
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentforge_test';
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Clear collections before each test
  await User.deleteMany({});
  await Task.deleteMany({});
  await Organization.deleteMany({});
  await OrgMember.deleteMany({});
});

describe('Integration Tests - Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.orgs).toHaveLength(1);
    expect(res.body.orgs[0]).toHaveProperty('role', 'owner');
  });

  it('should not register a user with an existing email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'existing@example.com',
        password: 'password456',
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty('error', 'Email already registered.');
  });


  it('should login an existing user', async () => {
    // First, register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'loginpassword',
      });

    // Then, log them in
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'loginpassword',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Invalid email or password.');
  });

  it('should get current user profile with valid token', async () => {
    // Register and login to get a token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Profile User',
        email: 'profile@example.com',
        password: 'profilepassword',
      });
    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('profile@example.com');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.orgs).toHaveLength(1);
  });

  it('should not get profile without a token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Authentication required. No token provided.');
  });

  it('should not get profile with an invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer invalid.token`);
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Invalid token.');
  });
});


describe('Integration Tests - Tasks API', () => {
  let authToken: string;
  let userOrgId: string;
  let createdTaskId: string;

  beforeEach(async () => {
    // Register and login a user to get token and org ID
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Task User',
        email: 'taskuser@example.com',
        password: 'taskpassword',
      });
    authToken = registerRes.body.token;
    userOrgId = registerRes.body.orgs[0]._id;


    // Create a sample task for testing
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId)
      .send({
        title: 'Integrate Stripe Payments',
        desc: 'Set up Stripe for subscription billing.',
        assignee: '/users/taskuser@example.com',
        status: 'todo',
        progress: 0,
        workspaceId: 'some-workspace-id', // Note: Workspace model not fully defined in context, assume it exists
      });
    createdTaskId = taskRes.body.task._id;
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId)
      .send({
        title: 'Update Docs',
        desc: 'Update documentation for new features.',
        assignee: '/users/another@example.com',
        status: 'todo',
        progress: 0,
        workspaceId: 'some-workspace-id',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('task');
    expect(res.body.task.title).toBe('Update Docs');
    expect(res.body.task.assignee).toBe('/users/another@example.com');
  });

  it('should get all tasks for the organization', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.tasks).toHaveLength(1); // Only the pre-created task
    expect(res.body.tasks[0].title).toBe('Integrate Stripe Payments');
  });

  it('should get a single task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.task).toHaveProperty('_id', createdTaskId);
    expect(res.body.task.title).toBe('Integrate Stripe Payments');
  });

  it('should update an existing task', async () => {
    const updatedData = {
      title: 'Integrate Stripe Payments - Completed',
      status: 'completed',
      progress: 100,
    };
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId)
      .send(updatedData);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.task).toHaveProperty('title', 'Integrate Stripe Payments - Completed');
    expect(res.body.task.status).toBe('completed');
    expect(res.body.task.progress).toBe(100);

    // Verify one more time by fetching
    const fetchRes = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId);
    expect(fetchRes.body.task.title).toBe('Integrate Stripe Payments - Completed');
  });

  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toBe('Task deleted successfully');

    // Verify it's deleted
    const fetchRes = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-org-id', userOrgId);
    expect(fetchRes.statusCode).toEqual(404);
  });

  it('should require organization context for tasks API', async () => {
    // Test creating a task without x-org-id header
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Mismatched Org Task',
        desc: 'This should fail',
        assignee: '/users/test@example.com',
        status: 'todo',
        progress: 0,
      });
    expect(createRes.statusCode).toEqual(401); // Assuming auth middleware checks for orgId implicitly or explicitly
    expect(createRes.body).toHaveProperty('error', 'Organization context missing. Please set the X-Org-Id header.');

    // Test getting tasks without x-org-id header
    const getRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    expect(getRes.statusCode).toEqual(401); // Assuming auth middleware checks for orgId implicitly or explicitly
    expect(getRes.body).toHaveProperty('error', 'Organization context missing. Please set the X-Org-Id header.');
  });
});
