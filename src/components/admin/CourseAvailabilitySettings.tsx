'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, Save, RotateCcw } from 'lucide-react'
import { getCourseAvailabilitySettings, updateCourseAvailabilitySettings } from '@/lib/course-programs-api'

interface CourseProgram {
  id: string
  name: string
  enabled: boolean
  icon: React.ReactNode
}

interface CourseAvailabilitySettingsProps {
  isEditing: boolean
  onSave?: () => void
  onCancel?: () => void
}

export default function CourseAvailabilitySettings({ 
  isEditing, 
  onSave, 
  onCancel 
}: CourseAvailabilitySettingsProps) {
  const [programs, setPrograms] = useState<CourseProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalPrograms, setOriginalPrograms] = useState<CourseProgram[]>([])

  const programIcons: Record<string, React.ReactNode> = {
    'general-certificate': <BookOpen className="h-4 w-4 text-gray-600" />,
    'diploma-certificate': <BookOpen className="h-4 w-4 text-blue-600" />,
    'bachelor-degree': <GraduationCap className="h-4 w-4 text-green-600" />,
    'master-degree': <GraduationCap className="h-4 w-4 text-purple-600" />
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  const loadPrograms = async () => {
    try {
      setLoading(true)
      const settings = await getCourseAvailabilitySettings()
      
      const programsWithIcons = settings.map((program: any) => ({
        ...program,
        icon: programIcons[program.id] || <BookOpen className="h-4 w-4 text-gray-600" />
      }))
      
      setPrograms(programsWithIcons)
      setOriginalPrograms(JSON.parse(JSON.stringify(programsWithIcons)))
    } catch (error) {
      console.error('Failed to load course programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProgram = (programId: string) => {
    if (!isEditing) return

    setPrograms(prev => {
      const updated = prev.map(program => 
        program.id === programId 
          ? { ...program, enabled: !program.enabled }
          : program
      )
      
      // Check if there are changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalPrograms)
      setHasChanges(hasChanges)
      
      return updated
    })
  }

  const handleSave = async () => {
    if (!hasChanges) return

    try {
      setSaving(true)
      await updateCourseAvailabilitySettings(programs)
      setOriginalPrograms(JSON.parse(JSON.stringify(programs)))
      setHasChanges(false)
      onSave?.()
    } catch (error) {
      console.error('Failed to save course programs:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPrograms(JSON.parse(JSON.stringify(originalPrograms)))
    setHasChanges(false)
    onCancel?.()
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <span className="font-apercu-medium text-sm text-gray-900">Course Program Availability</span>
          </div>
          <p className="font-apercu-regular text-xs text-gray-500 mt-1">
            Manage which course programs are available for student registration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-apercu-medium text-xs">
            {programs.filter(p => p.enabled).length} of {programs.length} enabled
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {programs.map((program) => (
          <div key={program.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {program.icon}
              <span className="font-apercu-medium text-sm text-gray-900">
                {program.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-apercu-medium text-xs ${
                program.enabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {program.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={program.enabled}
                onCheckedChange={() => toggleProgram(program.id)}
                disabled={!isEditing}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
        ))}
      </div>

      {isEditing && hasChanges && (
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={saving}
            className="font-apercu-medium"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 font-apercu-medium"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}