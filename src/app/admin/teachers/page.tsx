'use client';

import { useState, useEffect } from 'react';
import { AdminLayoutNew } from '@/components/admin/AdminLayoutNew';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateTeacherModal } from '@/components/admin/CreateTeacherModal';
import { EditTeacherModal } from '@/components/admin/EditTeacherModal';
import { ViewTeacherModal } from '@/components/admin/ViewTeacherModal';
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal';

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  department?: string;
  position?: string;
  qualification?: string;
  experience?: number;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function TeachersPageContent() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const filtered = teachers.filter(teacher =>
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.department && teacher.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTeachers(filtered);
  }, [teachers, searchTerm]);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      } else {
        console.error('Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeacher = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTeachers();
        setIsDeleteModalOpen(false);
        setSelectedTeacher(null);
      } else {
        console.error('Failed to delete teacher');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const onTeacherCreated = () => {
    fetchTeachers();
    setIsCreateModalOpen(false);
  };

  const onTeacherUpdated = () => {
    fetchTeachers();
    setIsEditModalOpen(false);
    setSelectedTeacher(null);
  };

  return (
    <div className="space-y-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Instructor Management</h1>
      <p className="text-gray-600 mt-2">Manage school instructors and staff</p>
        </div>
        <Button onClick={handleCreateTeacher} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Instructor
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, instructor ID, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructors ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading instructors...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No instructors found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.teacherId}</TableCell>
                    <TableCell>{teacher.fullName}</TableCell>
                    <TableCell>{teacher.emailAddress}</TableCell>
                    <TableCell>{teacher.department || 'N/A'}</TableCell>
                    <TableCell>{teacher.position || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.isActive ? 'default' : 'secondary'}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTeacher(teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTeacherCreated={onTeacherCreated}
      />

      {selectedTeacher && (
        <>
          <EditTeacherModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedTeacher(null);
            }}
            teacher={selectedTeacher}
            onTeacherUpdated={onTeacherUpdated}
          />

          <ViewTeacherModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedTeacher(null);
            }}
            teacher={selectedTeacher}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTeacher(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Instructor"
            description={`Are you sure you want to delete ${selectedTeacher.fullName}? This action cannot be undone.`}
          />
        </>
      )}</div>
  );
}

export default function TeachersPage() {
  return (
    <AdminLayoutNew 
      title="Instructors Management"
    description="Manage instructors and staff members"
    >
      <TeachersPageContent />
    </AdminLayoutNew>
  );
}