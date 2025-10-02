'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Mail, Phone, MapPin, GraduationCap, Briefcase, DollarSign } from 'lucide-react';

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth?: string;
  address?: string;
  qualification?: string;
  experience?: number;
  department?: string;
  position?: string;
  salary?: number;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
}

export function ViewTeacherModal({ isOpen, onClose, teacher }: ViewTeacherModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Instructor Details</span>
            <Badge variant={teacher.isActive ? 'default' : 'secondary'}>
              {teacher.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Instructor ID</p>
                  <p className="text-lg font-semibold">{teacher.teacherId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-lg font-semibold">{teacher.fullName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm">{teacher.emailAddress}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm">{teacher.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {teacher.dateOfBirth && (
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-sm">{formatDate(teacher.dateOfBirth)}</p>
                  </div>
                </div>
              )}

              {teacher.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm">{teacher.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teacher.department && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-sm">{teacher.department}</p>
                  </div>
                )}
                {teacher.position && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Position</p>
                    <p className="text-sm">{teacher.position}</p>
                  </div>
                )}
              </div>

              {teacher.qualification && (
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Qualification</p>
                    <p className="text-sm">{teacher.qualification}</p>
                  </div>
                </div>
              )}

              {teacher.experience !== undefined && teacher.experience !== null && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="text-sm">{teacher.experience} years</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Hire Date</p>
                  <p className="text-sm">{formatDate(teacher.hireDate)}</p>
                </div>
              </div>

              {teacher.salary && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Salary</p>
                    <p className="text-sm">{formatCurrency(teacher.salary)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="text-sm">{formatDate(teacher.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm">{formatDate(teacher.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}