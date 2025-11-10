'use client'

import AdminLayoutNew from '@/components/admin/AdminLayoutNew'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ViewToggle } from '@/components/ui/view-toggle'
import { Pagination } from '@/components/ui/pagination'
import { useUser } from '@/contexts/UserContext'
import { useEffect, useState } from 'react'

interface AcademicYear {
  id: string
  name: string
  status: 'active' | 'archived' | 'upcoming'
  description?: string
}

export default function AcademicYearsPage() {
  const { currentUser } = useUser()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Respect persisted choice; otherwise default to grid on mobile, list otherwise
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('academic-years-view-mode') as 'grid' | 'list' | null
      if (saved) return saved
      const isMobile = window.innerWidth < 640
      return isMobile ? 'grid' : 'list'
    }
    return 'list'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('academic-years-view-mode', viewMode)
    }
  }, [viewMode])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [years, setYears] = useState<AcademicYear[]>([
    { id: 'ay-2023', name: '2023/2024', status: 'archived', description: 'Completed year' },
    { id: 'ay-2024', name: '2024/2025', status: 'active', description: 'Current academic year' },
    { id: 'ay-2025', name: '2025/2026', status: 'upcoming', description: 'Upcoming year' }
  ])
  const [page, setPage] = useState(1)
  const itemsPerPage = 5

  const pagedYears = years.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.max(1, Math.ceil(years.length / itemsPerPage))

  return (
    <AdminLayoutNew title="Academic Years" description="Manage your institution’s academic year settings">
      <div className="px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-apercu-bold text-xl">Academic Years</h2>
            <Badge variant="default">{years.length} total</Badge>
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">Add New Year</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Academic Year</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearName">Year Name</Label>
                      <Input id="yearName" placeholder="e.g., 2025/2026" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Optional notes" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => setDialogOpen(false)}>Save</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedYears.map((y) => (
                      <TableRow key={y.id}>
                        <TableCell className="font-medium">{y.name}</TableCell>
                        <TableCell>
                          <Badge variant={y.status === 'active' ? 'success' : y.status === 'upcoming' ? 'warning' : 'outline'}>
                            {y.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{y.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="destructive" size="sm">Archive</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedYears.map((y) => (
                  <Card key={y.id}>
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle>{y.name}</CardTitle>
                      <Badge variant={y.status === 'active' ? 'success' : y.status === 'upcoming' ? 'warning' : 'outline'}>
                        {y.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{y.description || 'No description provided'}</p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Archive</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={years.length}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-gray-500">
          <span>Signed in as </span>
          <Badge variant="outline">{currentUser?.email || 'guest'}</Badge>
        </div>
      </div>
    </AdminLayoutNew>
  )
}