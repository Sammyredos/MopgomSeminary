'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/ToastContext';
import { Loader2, BookOpen } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: any) => void;
}

interface CourseFormData {
  courseCode: string;
  courseName: string;
  courseType: string;
  instructor: string;
  description: string;
}

interface CourseFormErrors {
  courseCode?: string;
  courseName?: string;
  courseType?: string;
  instructor?: string;
  description?: string;
}

const initialFormData: CourseFormData = {
  courseCode: '',
  courseName: '',
  courseType: '',
  instructor: '',
  description: ''
};

const courseTypes = [
  'General Certificate',
  'Diploma Certificate',
  "Bachelor's Degree",
  "Master's Degree"
];

export default function CreateCourseModal({ isOpen, onClose, onCourseCreated }: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CourseFormErrors = {};

    if (!formData.courseCode.trim()) {
      newErrors.courseCode = 'Course code is required';
    } else if (!/^[A-Z]{2,4}\d{3,4}$/.test(formData.courseCode.trim())) {
      newErrors.courseCode = 'Course code format: 2-4 letters followed by 3-4 numbers (e.g., THEO101)';
    }

    if (!formData.courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    }

    if (!formData.courseType) {
      newErrors.courseType = 'Course type is required';
    }

    if (!formData.instructor.trim()) {
      newErrors.instructor = 'Instructor is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Course description must be at least 10 characters long';
    } else if (!/^[a-zA-Z0-9\s.,!?;:()\-'"\/\n\r]+$/.test(formData.description.trim())) {
      newErrors.description = 'Course description contains invalid characters. Please use only letters, numbers, and common punctuation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseCode: formData.courseCode.toUpperCase(),
          courseName: formData.courseName,
          subjectArea: formData.courseType, // Map courseType to subjectArea
          instructor: formData.instructor,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      const result = await response.json();
      onCourseCreated(result.course);
      success(`Course "${formData.courseName}" created successfully!`);
      handleClose();
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setErrors({});
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setFormData(initialFormData);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Create New Course
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Code */}
          <div className="space-y-2">
            <Label htmlFor="courseCode" className="text-sm font-medium text-gray-700">Course Code *</Label>
            <Input
              id="courseCode"
              value={formData.courseCode}
              onChange={(e) => handleInputChange('courseCode', e.target.value)}
              placeholder="e.g., THEO101"
              className={`h-12 px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.courseCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.courseCode && <p className="text-sm text-red-500">{errors.courseCode}</p>}
          </div>
          
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="courseName" className="text-sm font-medium text-gray-700">Course Name *</Label>
            <Input
              id="courseName"
              value={formData.courseName}
              onChange={(e) => handleInputChange('courseName', e.target.value)}
              placeholder="e.g., Introduction to Theology"
              className={`h-12 px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.courseName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.courseName && <p className="text-sm text-red-500">{errors.courseName}</p>}
          </div>

          {/* Course Type */}
          <div className="space-y-2">
            <Label htmlFor="courseType" className="text-sm font-medium text-gray-700">Course Type *</Label>
            <Select value={formData.courseType} onValueChange={(value) => handleInputChange('courseType', value)}>
              <SelectTrigger className={`h-12 px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.courseType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                {courseTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseType && <p className="text-sm text-red-500">{errors.courseType}</p>}
          </div>

          {/* Instructor */}
          <div className="space-y-2">
            <Label htmlFor="instructor" className="text-sm font-medium text-gray-700">Instructor *</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => handleInputChange('instructor', e.target.value)}
              placeholder="e.g., Dr. John Smith"
              className={`h-12 px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.instructor ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.instructor && <p className="text-sm text-red-500">{errors.instructor}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Course Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide a detailed description of the course content and objectives..."
              rows={3}
              className={`px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Course...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}