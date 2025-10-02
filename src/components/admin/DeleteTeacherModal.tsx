'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  isActive: boolean;
}

interface DeleteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  onTeacherDeleted: () => void;
}

export function DeleteTeacherModal({
  isOpen,
  onClose,
  teacher,
  onTeacherDeleted,
}: DeleteTeacherModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete teacher');
      }

      const result = await response.json();
      
      if (result.deactivated) {
        toast.success(
          `Teacher ${teacher.fullName} has been deactivated due to active associations.`
        );
      } else {
        toast.success(`Teacher ${teacher.fullName} has been deleted successfully.`);
      }
      
      onTeacherDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete teacher'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Delete Instructor</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this instructor?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructor Information:</strong>
              <br />
              <span className="font-medium">ID:</span> {teacher.teacherId}
              <br />
              <span className="font-medium">Name:</span> {teacher.fullName}
              <br />
              <span className="font-medium">Email:</span> {teacher.emailAddress}
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertDescription className="text-sm text-gray-600">
              <strong>Note:</strong> If this instructor has active class sessions or grades,
              they will be deactivated instead of permanently deleted to maintain data integrity.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Instructor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}