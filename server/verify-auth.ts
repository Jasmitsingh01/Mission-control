
const API_URL = 'http://localhost:4000/api';

async function testAuth() {
  console.log('--- Testing Authentication Flow (Node Fetch) ---');
  
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
  
  try {
    // 1. Register
    console.log(`\n1. Registering user: ${email}`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Testerson',
        email,
        password
      })
    });
    
    if (!regRes.ok) {
      throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
    }

    const regData = await regRes.json();
    console.log('✅ Registration successful');
    console.log('Token:', regData.token ? 'Received' : 'Missing');
    console.log('Org ID:', regData.currentOrgId);

    // 2. Login
    console.log(`\n2. Logging in user: ${email}`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    console.log('✅ Login successful');
    const token = loginData.token;

    // 3. Access Protected Route (GET /me)
    console.log('\n3. Accessing /me (protected route)...');
    const meRes = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!meRes.ok) {
        throw new Error(`/me failed: ${meRes.status} ${await meRes.text()}`);
    }

    const meData = await meRes.json();
    console.log('✅ /me access successful');
    console.log('User ID:', meData.user._id);

    console.log('\n🎉 Auth flow verified!');
    
  } catch (error: any) {
    console.error('❌ Test failed');
    console.error(error.message);
  }
}

testAuth();
