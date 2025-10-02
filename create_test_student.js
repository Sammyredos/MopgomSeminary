const fetch = require('node-fetch');

async function createAndUpdateStudent() {
  const apiUrl = 'http://localhost:3001/api/students';
  
  // First, create a student with the specified ID
  const studentData = {
    studentId: 'STU001', // Using a simple student ID format
    fullName: 'Test Student',
    emailAddress: 'test@example.com', // Temporary email
    phoneNumber: '+1234567890', // Temporary phone
    dateOfBirth: '2000-01-01',
    gender: 'Male',
    address: '123 Test Street',
    grade: '10th Grade',
    enrollmentDate: '2024-09-01',
    graduationYear: 2026,
    currentClass: 'Class A',
    academicYear: '2024',
    parentGuardianName: 'Test Parent',
    parentGuardianPhone: '+1234567891',
    parentGuardianEmail: 'parent@example.com',
    emergencyContactName: 'Emergency Contact',
    emergencyContactRelationship: 'Parent',
    emergencyContactPhone: '+1234567892'
  };
  
  try {
    console.log('Creating test student...');
    const createResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    
    if (!createResponse.ok) {
      console.error('Failed to create student:', createResponse.status, await createResponse.text());
      return;
    }
    
    const createdStudent = await createResponse.json();
    console.log('Student created successfully:', JSON.stringify(createdStudent, null, 2));
    
    // Now update the student with the required information
    const updateData = {
      ...createdStudent,
      emailAddress: 'ejikorj@gmail.com',
      enrollmentDate: '2025-09-30T00:00:00.000Z', // Sep 30, 2025
    };
    
    console.log('Updating student with new information...');
    const updateResponse = await fetch(`${apiUrl}/${createdStudent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!updateResponse.ok) {
      console.error('Failed to update student:', updateResponse.status, await updateResponse.text());
      return;
    }
    
    const updatedStudent = await updateResponse.json();
    console.log('Student updated successfully:', JSON.stringify(updatedStudent, null, 2));
    console.log('Student ID for dashboard:', updatedStudent.id);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAndUpdateStudent();