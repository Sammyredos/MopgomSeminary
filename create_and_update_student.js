const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function createAndUpdateStudent() {
  try {
    console.log('Creating student...');
    
    // First, create a student
    const createResponse = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: 'STU001',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01T00:00:00.000Z',
        age: 24,
        gender: 'Male',
        address: '123 Test Street',
        grade: '12',
        phoneNumber: '+1234567890',
        emailAddress: 'test@example.com',
        emergencyContactName: 'Emergency Contact',
        emergencyContactRelationship: 'Parent',
        emergencyContactPhone: '+0987654321',
        parentGuardianName: 'Parent Guardian',
        parentGuardianPhone: '+1111111111',
        parentGuardianEmail: 'parent@example.com',
        enrollmentDate: '2024-01-01T00:00:00.000Z',
        graduationYear: 2025,
        currentClass: 'Class A',
        academicYear: '2024-2025',
        isActive: true
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Create failed:', createResponse.status, errorText);
      return;
    }

    const createdStudent = await createResponse.json();
    console.log('Student created:', createdStudent);
    
    const studentId = createdStudent.id;
    
    // Now update the student with the required information
    console.log('Updating student with new information...');
    
    const updateResponse = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: 'STU001',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01T00:00:00.000Z',
        age: 24,
        gender: 'Male',
        address: '123 Test Street',
        grade: '12',
        phoneNumber: '+1234567890',
        emailAddress: 'ejikorj@gmail.com', // Updated email
        emergencyContactName: 'Emergency Contact',
        emergencyContactRelationship: 'Parent',
        emergencyContactPhone: '+0987654321',
        parentGuardianName: 'Parent Guardian',
        parentGuardianPhone: '+1111111111',
        parentGuardianEmail: 'parent@example.com',
        enrollmentDate: '2025-09-30T00:00:00.000Z', // Updated enrollment date
        graduationYear: 2025,
        currentClass: 'Class A',
        academicYear: '2024-2025',
        isActive: true
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Update failed:', updateResponse.status, errorText);
      return;
    }

    const updatedStudent = await updateResponse.json();
    console.log('Student updated successfully:', updatedStudent);
    console.log('Student ID:', studentId);
    console.log('Email:', updatedStudent.emailAddress);
    console.log('Enrollment Date:', updatedStudent.enrollmentDate);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAndUpdateStudent();