'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  grade: string;
  enrollmentDate: string;
  graduationYear?: number;
  currentClass?: string;
  academicYear: string;
  parentGuardianName?: string;
  parentGuardianPhone?: string;
  parentGuardianEmail?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  isActive: boolean;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null;
}

interface StudentFormData {
  studentId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  address: string;
  grade: string;
  enrollmentDate: string;
  graduationYear: string;
  currentClass: string;
  academicYear: string;
  parentGuardianName: string;
  parentGuardianPhone: string;
  parentGuardianEmail: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  isActive: boolean;
}

const grades = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade',
  '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade',
  '11th Grade', '12th Grade'
];

const relationships = [
  'Parent', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Sibling', 'Family Friend', 'Other'
];

export default function EditStudentModal({ isOpen, onClose, onSuccess, student }: EditStudentModalProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    studentId: '',
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    grade: '',
    enrollmentDate: '',
    graduationYear: '',
    currentClass: '',
    academicYear: '',
    parentGuardianName: '',
    parentGuardianPhone: '',
    parentGuardianEmail: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        studentId: student.studentId,
        fullName: student.fullName,
        emailAddress: student.emailAddress,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth.split('T')[0], // Format date for input
        gender: student.gender,
        address: student.address || '',
        grade: student.grade,
        enrollmentDate: student.enrollmentDate.split('T')[0], // Format date for input
        graduationYear: student.graduationYear?.toString() || '',
        currentClass: student.currentClass || '',
        academicYear: student.academicYear,
        parentGuardianName: student.parentGuardianName || '',
        parentGuardianPhone: student.parentGuardianPhone || '',
        parentGuardianEmail: student.parentGuardianEmail || '',
        emergencyContactName: student.emergencyContactName,
        emergencyContactRelationship: student.emergencyContactRelationship,
        emergencyContactPhone: student.emergencyContactPhone,
        isActive: student.isActive,
      });
      setErrors({});
    }
  }, [student, isOpen]);

  const handleInputChange = (field: keyof StudentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.enrollmentDate) newErrors.enrollmentDate = 'Enrollment date is required';
    if (!formData.academicYear.trim()) newErrors.academicYear = 'Academic year is required';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactRelationship) newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';

    // Email validation
    if (formData.emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }

    // Parent email validation (optional but must be valid if provided)
    if (formData.parentGuardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentGuardianEmail)) {
      newErrors.parentGuardianEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !student) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
      };

      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      toast.success('Student updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      onClose();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  placeholder="Enter student ID"
                  className={errors.studentId ? 'border-red-500' : ''}
                />
                {errors.studentId && <p className="text-sm text-red-500">{errors.studentId}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter full name"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address *</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="Enter email address"
                  className={errors.emailAddress ? 'border-red-500' : ''}
                />
                {errors.emailAddress && <p className="text-sm text-red-500">{errors.emailAddress}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grade && <p className="text-sm text-red-500">{errors.grade}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentClass">Current Class</Label>
                <Input
                  id="currentClass"
                  value={formData.currentClass}
                  onChange={(e) => handleInputChange('currentClass', e.target.value)}
                  placeholder="Enter current class"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="enrollmentDate">Enrollment Date *</Label>
                <Input
                  id="enrollmentDate"
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => handleInputChange('enrollmentDate', e.target.value)}
                  className={errors.enrollmentDate ? 'border-red-500' : ''}
                />
                {errors.enrollmentDate && <p className="text-sm text-red-500">{errors.enrollmentDate}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Expected Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  placeholder="Enter graduation year"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 20}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  placeholder="Enter academic year"
                  className={errors.academicYear ? 'border-red-500' : ''}
                />
                {errors.academicYear && <p className="text-sm text-red-500">{errors.academicYear}</p>}
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentGuardianName">Parent/Guardian Name</Label>
                <Input
                  id="parentGuardianName"
                  value={formData.parentGuardianName}
                  onChange={(e) => handleInputChange('parentGuardianName', e.target.value)}
                  placeholder="Enter parent/guardian name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentGuardianPhone">Parent/Guardian Phone</Label>
                <Input
                  id="parentGuardianPhone"
                  value={formData.parentGuardianPhone}
                  onChange={(e) => handleInputChange('parentGuardianPhone', e.target.value)}
                  placeholder="Enter parent/guardian phone"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="parentGuardianEmail">Parent/Guardian Email</Label>
                <Input
                  id="parentGuardianEmail"
                  type="email"
                  value={formData.parentGuardianEmail}
                  onChange={(e) => handleInputChange('parentGuardianEmail', e.target.value)}
                  placeholder="Enter parent/guardian email"
                  className={errors.parentGuardianEmail ? 'border-red-500' : ''}
                />
                {errors.parentGuardianEmail && <p className="text-sm text-red-500">{errors.parentGuardianEmail}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Enter emergency contact name"
                  className={errors.emergencyContactName ? 'border-red-500' : ''}
                />
                {errors.emergencyContactName && <p className="text-sm text-red-500">{errors.emergencyContactName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                <Select value={formData.emergencyContactRelationship} onValueChange={(value) => handleInputChange('emergencyContactRelationship', value)}>
                  <SelectTrigger className={errors.emergencyContactRelationship ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((relationship) => (
                      <SelectItem key={relationship} value={relationship}>{relationship}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.emergencyContactRelationship && <p className="text-sm text-red-500">{errors.emergencyContactRelationship}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                  className={errors.emergencyContactPhone ? 'border-red-500' : ''}
                />
                {errors.emergencyContactPhone && <p className="text-sm text-red-500">{errors.emergencyContactPhone}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active Student</Label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Student'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}