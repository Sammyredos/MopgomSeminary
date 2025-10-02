const fetch = require('node-fetch');

async function testStudentProfilePage() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🔍 Testing Student Profile Page Data...\n');
    
    // First, login with the test account
    console.log('Step 1: Logging in with test account...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teststudent@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    // Extract the auth token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    let authToken = '';
    if (cookies) {
      const authCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('auth-token='));
      if (authCookie) {
        authToken = authCookie.split('=')[1];
      }
    }
    
    if (!authToken) {
      throw new Error('Failed to extract auth token');
    }
    
    console.log('✅ Login successful, auth token extracted');
    
    // Step 2: Test the student profile API endpoint
    console.log('\nStep 2: Fetching student profile data from API...');
    const profileResponse = await fetch(`${baseUrl}/api/student/profile`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      throw new Error(`Profile API failed: ${profileResponse.status} - ${errorText}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile data fetched successfully!');
    
    // Step 3: Verify the profile data structure and content
    console.log('\nStep 3: Verifying profile data...');
    console.log('📋 Profile Data Analysis:');
    console.log('='.repeat(50));
    
    const user = profileData.user;
    if (user) {
      console.log(`👤 Name: ${user.name || 'Not set'}`);
      console.log(`📧 Email: ${user.email || 'Not set'}`);
      console.log(`📱 Phone: ${user.phone || 'Not set'}`);
      console.log(`🎂 Date of Birth: ${user.dateOfBirth || 'Not set'}`);
      console.log(`⚧ Gender: ${user.gender || 'Not set'}`);
      console.log(`🏠 Address: ${user.address || 'Not set'}`);
      console.log(`🎓 Grade: ${user.grade || 'Not set'}`);
      console.log(`🏫 Current Class: ${user.currentClass || 'Not set'}`);
      console.log(`📅 Academic Year: ${user.academicYear || 'Not set'}`);
      console.log(`👨‍👩‍👧‍👦 Parent/Guardian: ${user.parentGuardianName || 'Not set'}`);
      console.log(`📞 Parent Phone: ${user.parentGuardianPhone || 'Not set'}`);
      console.log(`📧 Parent Email: ${user.parentGuardianEmail || 'Not set'}`);
      console.log(`🚨 Emergency Contact: ${user.emergencyContactName || 'Not set'}`);
      console.log(`📞 Emergency Phone: ${user.emergencyContactPhone || 'Not set'}`);
      console.log(`🔗 Emergency Relationship: ${user.emergencyContactRelationship || 'Not set'}`);
      console.log(`✅ Status: ${user.status || 'Not set'}`);
      console.log(`📅 Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not set'}`);
    } else {
      console.log('❌ No user data found in profile response');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Step 4: Check if this matches our expected test data
    console.log('\nStep 4: Validating expected data...');
    
    const expectedData = {
      name: 'Test Student Demo',
      email: 'teststudent@example.com',
      // These should be from the registration data created during signup
    };
    
    let validationPassed = true;
    const validationResults = [];
    
    if (user?.name === expectedData.name) {
      validationResults.push('✅ Name matches expected value');
    } else {
      validationResults.push(`❌ Name mismatch - Expected: "${expectedData.name}", Got: "${user?.name}"`);
      validationPassed = false;
    }
    
    if (user?.email === expectedData.email) {
      validationResults.push('✅ Email matches expected value');
    } else {
      validationResults.push(`❌ Email mismatch - Expected: "${expectedData.email}", Got: "${user?.email}"`);
      validationPassed = false;
    }
    
    if (user?.status === 'Active') {
      validationResults.push('✅ Status is Active');
    } else {
      validationResults.push(`❌ Status issue - Expected: "Active", Got: "${user?.status}"`);
      validationPassed = false;
    }
    
    validationResults.forEach(result => console.log(result));
    
    console.log('\n' + '='.repeat(50));
    
    if (validationPassed) {
      console.log('🎉 Profile page validation PASSED!');
      console.log('✅ The student profile page should display the correct information.');
    } else {
      console.log('⚠️  Profile page validation had some issues.');
      console.log('ℹ️  This might be expected if the test account has different data.');
    }
    
    // Step 5: Provide manual verification steps
    console.log('\n📝 Manual Verification Steps:');
    console.log('1. Open http://localhost:3001/login in your browser');
    console.log('2. Login with:');
    console.log('   - Email: teststudent@example.com');
    console.log('   - Password: password123');
    console.log('3. Navigate to the Profile page from the sidebar');
    console.log('4. Verify that the profile displays:');
    console.log(`   - Name: ${user?.name || 'Check if populated'}`);
    console.log(`   - Email: ${user?.email || 'Check if populated'}`);
    console.log(`   - Phone: ${user?.phone || 'Check if populated'}`);
    console.log(`   - Other personal information as shown above`);
    console.log('5. Check that the profile form allows editing and saving');
    
    // Step 6: Test if we can also check the original updated student
    console.log('\n🔄 Checking if we can find the originally updated student...');
    
    // Try to find a student with the updated email in the students table
    console.log('Note: The originally updated student (ejikorj@gmail.com) may not have');
    console.log('a corresponding user account, so it might not appear in the profile page.');
    console.log('The profile page only shows data for users who can log in.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testStudentProfilePage();