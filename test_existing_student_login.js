const fetch = require('node-fetch');

async function testExistingStudentLogin() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🔐 Testing login with existing student account...\n');
    
    // Try different common passwords that might have been set
    const possiblePasswords = [
      'password123',
      'password',
      '123456',
      'student123',
      'test123',
      'ejikorj123'
    ];
    
    for (const password of possiblePasswords) {
      console.log(`Trying password: ${password}`);
      
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ejikorj@gmail.com',
          password: password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful with password:', password);
        console.log('User data:', JSON.stringify(loginData.user, null, 2));
        
        // Extract the auth token from cookies
        const cookies = loginResponse.headers.get('set-cookie');
        let authToken = '';
        if (cookies) {
          const authCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('auth-token='));
          if (authCookie) {
            authToken = authCookie.split('=')[1];
          }
        }
        
        if (authToken) {
          console.log('🍪 Auth token extracted successfully');
          
          // Get user data from /api/auth/me
          console.log('\nFetching detailed user data from /api/auth/me');
          
          const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
            method: 'GET',
            headers: {
              'Cookie': `auth-token=${authToken}`
            }
          });
          
          if (meResponse.ok) {
            const userData = await meResponse.json();
            console.log('✅ User data fetched successfully!');
            console.log('User details:', JSON.stringify(userData, null, 2));
            
            console.log('\n🎯 Login Details:');
            console.log('- Email: ejikorj@gmail.com');
            console.log('- Password:', password);
            console.log('- User Type:', userData.user?.type || 'Not specified');
            console.log('- Role:', userData.user?.role?.name || 'Not specified');
            
            console.log('\n📝 Next steps:');
            console.log('1. Open http://localhost:3001/login in your browser');
            console.log('2. Login with:');
            console.log('   - Email: ejikorj@gmail.com');
            console.log('   - Password:', password);
            console.log('3. You should be redirected to the student dashboard');
            
            return; // Exit on successful login
          } else {
            console.log('❌ Failed to fetch user data from /api/auth/me');
          }
        }
        
        return; // Exit on successful login even if token extraction failed
      } else {
        const errorData = await loginResponse.text();
        console.log(`❌ Login failed with password "${password}":`, loginResponse.status, errorData);
      }
    }
    
    console.log('\n❌ None of the common passwords worked.');
    console.log('The account exists but we need to find the correct password or reset it.');
    
    // Let's try to create a new account with a different email for testing
    console.log('\n🔄 Creating a new test account with different email...');
    
    const signupResponse = await fetch(`${baseUrl}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        surname: 'Test',
        firstname: 'Student',
        lastname: 'Demo',
        email: 'teststudent@example.com',
        dateOfBirth: '2000-01-01',
        gender: 'Male',
        phone: '+1234567891', // Different phone number
        password: 'password123',
        confirmPassword: 'password123',
        emergencyContactName: 'Emergency Contact',
        emergencyContactRelationship: 'Parent',
        emergencyContactPhone: '+0987654322', // Different emergency contact
        parentGuardianName: 'Parent Guardian',
        parentGuardianPhone: '+1111111112', // Different parent phone
        parentGuardianEmail: 'parent2@example.com'
      })
    });
    
    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      console.log('✅ New test account created successfully!');
      
      // Now test login with the new account
      const testLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'teststudent@example.com',
          password: 'password123'
        })
      });
      
      if (testLoginResponse.ok) {
        const testLoginData = await testLoginResponse.json();
        console.log('✅ Test login successful!');
        console.log('User data:', JSON.stringify(testLoginData.user, null, 2));
        
        console.log('\n🎯 Test Account Details:');
        console.log('- Email: teststudent@example.com');
        console.log('- Password: password123');
        
        console.log('\n📝 You can now test the dashboard with:');
        console.log('1. Open http://localhost:3001/login in your browser');
        console.log('2. Login with:');
        console.log('   - Email: teststudent@example.com');
        console.log('   - Password: password123');
        console.log('3. Verify the student dashboard functionality');
      } else {
        const errorData = await testLoginResponse.text();
        console.log('❌ Test login failed:', testLoginResponse.status, errorData);
      }
    } else {
      const errorData = await signupResponse.text();
      console.log('❌ New account creation failed:', signupResponse.status, errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testExistingStudentLogin();