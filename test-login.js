const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing login with student credentials...');
    
    // Test login with one of the student accounts
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'samuel.obadina93@gmail.com',
        password: 'password123' // Assuming this is the password
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('Login response:', loginData);
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies set:', cookies);
    
    if (loginResponse.ok && cookies) {
      // Test /api/auth/me with the cookie
      console.log('\nTesting /api/auth/me with cookie...');
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('Me response status:', meResponse.status);
      const meData = await meResponse.text();
      console.log('Me response:', meData);
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();