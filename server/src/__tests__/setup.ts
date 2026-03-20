// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
process.env.MONGODB_URI = 'mongodb://localhost:27017/agentforge_test';
process.env.PORT = '4001';
