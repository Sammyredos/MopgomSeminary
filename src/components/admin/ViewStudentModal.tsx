'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Users, 
  AlertTriangle,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';

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
  createdAt: string;
  updatedAt: string;
  grades?: Array<{
    id: string;
    grade: string;
    subject: {
      name: string;
      code: string;
    };
    teacher: {
      fullName: string;
    };
    createdAt: string;
  }>;
  attendance?: Array<{
    id: string;
    status: string;
    date: string;
    classSession: {
      subject: {
        name: string;
      };
      teacher: {
        fullName: string;
      };
    };
  }>;
  classSectionParticipants?: Array<{
    classSection: {
      subject: {
        name: string;
        code: string;
      };
      teacher: {
        fullName: string;
      };
    };
  }>;
}

interface ViewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const getAttendanceRate = (attendance: Student['attendance']) => {
  if (!attendance || attendance.length === 0) return 0;
  const presentCount = attendance.filter(record => record.status === 'Present').length;
  return Math.round((presentCount / attendance.length) * 100);
};

const getAverageGrade = (grades: Student['grades']) => {
  if (!grades || grades.length === 0) return 'N/A';
  const numericGrades = grades
    .map(g => parseFloat(g.grade))
    .filter(g => !isNaN(g));
  
  if (numericGrades.length === 0) return 'N/A';
  
  const average = numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;
  return average.toFixed(1);
};

export default function ViewStudentModal({ isOpen, onClose, student }: ViewStudentModalProps) {
  if (!student) return null;

  const age = calculateAge(student.dateOfBirth);
  const attendanceRate = getAttendanceRate(student.attendance);
  const averageGrade = getAverageGrade(student.grades);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{student.fullName}</DialogTitle>
            <Badge variant={student.isActive ? 'default' : 'secondary'}>
              {student.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Student ID: {student.studentId}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Grade</p>
                    <p className="text-lg font-bold">{student.grade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Age</p>
                    <p className="text-lg font-bold">{age} years</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Attendance</p>
                    <p className="text-lg font-bold">{attendanceRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Grade</p>
                    <p className="text-lg font-bold">{averageGrade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="font-medium">{student.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Student ID</p>
                    <p className="font-medium">{student.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(student.dateOfBirth)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Contact Information</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{student.emailAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{student.phoneNumber}</span>
                    </div>
                    {student.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Academic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Grade</p>
                    <p className="font-medium">{student.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Academic Year</p>
                    <p className="font-medium">{student.academicYear}</p>
                  </div>
                  {student.currentClass && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Current Class</p>
                      <p className="font-medium">{student.currentClass}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Enrollment Date</p>
                    <p className="font-medium">{formatDate(student.enrollmentDate)}</p>
                  </div>
                  {student.graduationYear && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Expected Graduation</p>
                      <p className="font-medium">{student.graduationYear}</p>
                    </div>
                  )}
                </div>
                
                {student.classSectionParticipants && student.classSectionParticipants.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Enrolled Subjects</p>
                      <div className="space-y-1">
                        {student.classSectionParticipants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{participant.classSection.subject.name}</span>
                            <span className="text-gray-500">{participant.classSection.teacher.fullName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Parent/Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Parent/Guardian Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.parentGuardianName ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="font-medium">{student.parentGuardianName}</p>
                    </div>
                    {student.parentGuardianPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{student.parentGuardianPhone}</span>
                      </div>
                    )}
                    {student.parentGuardianEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{student.parentGuardianEmail}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No parent/guardian information provided</p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="font-medium">{student.emergencyContactName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Relationship</p>
                    <p className="font-medium">{student.emergencyContactRelationship}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{student.emergencyContactPhone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Grades */}
          {student.grades && student.grades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Recent Grades</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {student.grades.slice(0, 5).map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{grade.subject.name}</p>
                        <p className="text-sm text-gray-500">{grade.teacher.fullName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{grade.grade}</p>
                        <p className="text-xs text-gray-500">{formatDate(grade.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Attendance */}
          {student.attendance && student.attendance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Attendance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {student.attendance.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{record.classSession.subject.name}</p>
                        <p className="text-sm text-gray-500">{record.classSession.teacher.fullName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={record.status === 'Present' ? 'default' : record.status === 'Absent' ? 'destructive' : 'secondary'}>
                          {record.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(record.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Created</p>
                  <p>{formatDate(student.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Last Updated</p>
                  <p>{formatDate(student.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}