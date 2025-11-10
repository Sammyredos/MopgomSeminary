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
import { Loader2, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  subjectArea: string;
  instructor: string;
  isActive: boolean;
  maxStudents?: number;
  duration?: number;
  platform?: string;
  description?: string;
}

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCourse?: any) => void;
  course: Course | null;
}

interface CourseFormData {
  courseCode: string;
  courseName: string;
  subjectArea: string;
  instructor: string;
  description: string;
  isActive: boolean;
}

const courseTypes = [
  'General Certificate',
  'Diploma Certificate',
  "Bachelor's Degree",
  "Master's Degree"
];

export default function EditCourseModal({ isOpen, onClose, onSuccess, course }: EditCourseModalProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    courseCode: '',
    courseName: '',
    subjectArea: '',
    instructor: '',
    description: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        courseCode: course.courseCode,
        courseName: course.courseName,
        subjectArea: course.subjectArea,
        instructor: course.instructor,
        description: course.description || '',
        isActive: course.isActive,
      });
      setErrors({});
    }
  }, [course, isOpen]);

  // Cleanup body styles when modal closes to fix pointer-events issue
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure Radix UI has finished its cleanup
      const timeoutId = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // Return empty cleanup function for the else case
    return () => {};
  }, [isOpen]);

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseCode.trim()) {
      newErrors.courseCode = 'Course code is required';
    }
    if (!formData.courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    }
    if (!formData.subjectArea.trim()) {
      newErrors.subjectArea = 'Subject area is required';
    }
    if (!formData.instructor.trim()) {
      newErrors.instructor = 'Instructor is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
    
    if (!validateForm() || !course || isLoading) return;

    setIsLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }

      const result = await response.json();
      const updatedCourse = result.course || { ...course, ...formData };
// Success
      toast.success('Course updated successfully!');
      
      // Call success and close immediately
      onSuccess(updatedCourse);
      onClose();
      
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      // Reset form data to prevent state persistence
      if (course) {
        setFormData({
          courseCode: course.courseCode,
          courseName: course.courseName,
          subjectArea: course.subjectArea,
          instructor: course.instructor,
          description: course.description || '',
          isActive: course.isActive,
        });
      }
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setErrors({});
      // Reset form data to prevent state persistence
      if (course) {
        setFormData({
          courseCode: course.courseCode,
          courseName: course.courseName,
          subjectArea: course.subjectArea,
          instructor: course.instructor,
          description: course.description || '',
          isActive: course.isActive,
        });
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Edit Course
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Code and Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Subject Area */}
          <div className="space-y-2">
            <Label htmlFor="subjectArea" className="text-sm font-medium text-gray-700">Subject Area *</Label>
            <Select value={formData.subjectArea} onValueChange={(value) => handleInputChange('subjectArea', value)}>
              <SelectTrigger className={`h-12 px-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.subjectArea ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Select subject area" />
              </SelectTrigger>
              <SelectContent>
                {courseTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subjectArea && <p className="text-sm text-red-500">{errors.subjectArea}</p>}
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

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Status</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Course...
                </>
              ) : (
                'Update Course'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}