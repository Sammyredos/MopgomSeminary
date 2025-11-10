'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, User, Mail, Phone } from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  grade: string;
  academicYear: string;
  isActive: boolean;
}

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onStudentDeleted?: () => void;
  student: Student | null;
}

export default function DeleteStudentModal({ isOpen, onClose, onSuccess, onStudentDeleted, student }: DeleteStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    deactivated?: boolean;
    deleted?: boolean;
    message?: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!student) return;

    setIsLoading(true);
    setDeleteResult(null);

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      setDeleteResult(data);

      if (data.deactivated) {
        toast.success('Student has been deactivated due to existing academic records');
      } else if (data.deleted) {
        toast.success('Student has been permanently deleted');
      }

      onSuccess?.();
      onStudentDeleted?.();
      
      // Close modal after a short delay to show the result
      setTimeout(() => {
        onClose();
        setDeleteResult(null);
      }, 2000);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDeleteResult(null);
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setDeleteResult(null);
      onClose();
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Student</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!deleteResult ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. If the student has academic records (grades, attendance, or class enrollments), 
                  they will be deactivated instead of permanently deleted.
                </AlertDescription>
              </Alert>

              {/* Student Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Student Details</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{student.emailAddress}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm break-all">{student.phoneNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Grade:</span>
                    <span className="font-medium">{student.grade}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Academic Year:</span>
                    <span className="font-medium">{student.academicYear}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${
                      student.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Students with academic records will be deactivated rather than deleted 
                  to preserve data integrity.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{student.fullName}</strong>?
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              {deleteResult.deactivated && (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Student Deactivated</h3>
                  <p className="text-sm text-gray-600">
                    The student has been deactivated due to existing academic records.
                  </p>
                </div>
              )}
              
              {deleteResult.deleted && (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Student Deleted</h3>
                  <p className="text-sm text-gray-600">
                    The student has been permanently deleted from the system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {!deleteResult && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}