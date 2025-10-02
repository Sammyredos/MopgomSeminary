const fetch = require('node-fetch');

async function updateStudent() {
  const studentId = 'cmfv75o1a000fe1gsajri80mg';
  const apiUrl = `http://localhost:3001/api/students/${studentId}`;
  
  // First, let's get the current student data
  try {
    console.log('Fetching current student data...');
    const getResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!getResponse.ok) {
      console.error('Failed to fetch student:', getResponse.status, await getResponse.text());
      return;
    }
    
    const currentStudent = await getResponse.json();
    console.log('Current student data:', JSON.stringify(currentStudent, null, 2));
    
    // Update the student data with new information
    const updatedData = {
      ...currentStudent,
      emailAddress: 'ejikorj@gmail.com',
      enrollmentDate: '2025-09-30T00:00:00.000Z', // Sep 30, 2025
      // Keep all other existing fields
      studentId: currentStudent.studentId,
      fullName: currentStudent.fullName,
      phoneNumber: currentStudent.phoneNumber,
      dateOfBirth: currentStudent.dateOfBirth,
      gender: currentStudent.gender,
      address: currentStudent.address || '',
      grade: currentStudent.grade,
      graduationYear: currentStudent.graduationYear,
      currentClass: currentStudent.currentClass,
      academicYear: currentStudent.academicYear,
      parentGuardianName: currentStudent.parentGuardianName,
      parentGuardianPhone: currentStudent.parentGuardianPhone,
      parentGuardianEmail: currentStudent.parentGuardianEmail,
      emergencyContactName: currentStudent.emergencyContactName,
      emergencyContactRelationship: currentStudent.emergencyContactRelationship,
      emergencyContactPhone: currentStudent.emergencyContactPhone,
      isActive: currentStudent.isActive
    };
    
    console.log('Updating student with data:', JSON.stringify(updatedData, null, 2));
    
    // Update the student
    const updateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    
    if (!updateResponse.ok) {
      console.error('Failed to update student:', updateResponse.status, await updateResponse.text());
      return;
    }
    
    const updatedStudent = await updateResponse.json();
    console.log('Student updated successfully:', JSON.stringify(updatedStudent, null, 2));
    
  } catch (error) {
    console.error('Error updating student:', error);
  }
}

updateStudent();