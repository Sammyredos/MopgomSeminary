'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Trash2 } from 'lucide-react'

interface DataConflict {
  type: 'duplicate_email' | 'duplicate_phone' | 'orphaned_user' | 'missing_data'
  severity: 'high' | 'medium' | 'low'
  message: string
  affectedRecords: number
  action?: string
  details?: any
}

interface DataManagementWarningProps {
  onRefresh?: () => void
}

export default function DataManagementWarning({ onRefresh }: DataManagementWarningProps) {
  const [conflicts, setConflicts] = useState<DataConflict[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const loadConflicts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/data-integrity')
      if (response.ok) {
        const data = await response.json()
        setConflicts(data.conflicts || [])
      } else {
        throw new Error('Failed to fetch data integrity')
      }
    } catch (error) {
      console.error('Failed to load data conflicts:', error)
      // Set a fallback error conflict
      setConflicts([{
        type: 'missing_data',
        severity: 'high',
        message: 'Failed to perform data integrity check',
        affectedRecords: 0,
        action: 'Retry Check'
      }])
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }

  useEffect(() => {
    loadConflicts()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-5 w-5" />
      case 'medium': return <AlertTriangle className="h-5 w-5" />
      case 'low': return <CheckCircle className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const handleResolve = async (conflictType: string, details?: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/data-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', conflictType, details })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadConflicts() // Refresh the conflicts list
          if (onRefresh) onRefresh()
        }
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/data-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadConflicts() // Refresh the conflicts list
          if (onRefresh) onRefresh()
        }
      }
    } catch (error) {
      console.error('Failed to run cleanup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadConflicts()
    if (onRefresh) onRefresh()
  }

  if (isInitialLoad && isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-gray-600 mr-3 animate-spin" />
          <div>
            <h3 className="text-sm font-medium text-gray-800">
              Checking Data Integrity...
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Scanning for potential data conflicts and issues.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (conflicts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Data Integrity Check Passed
              </h3>
              <p className="text-sm text-green-700 mt-1">
                No data conflicts detected. Your database is in good shape!
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Data Management Alerts
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleCleanup}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Run Cleanup
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {getSeverityIcon(conflict.severity)}
                  <div className="ml-3">
                    <h4 className="text-sm font-medium">
                      {conflict.message}
                    </h4>
                    <p className="text-sm mt-1">
                      Affected records: {conflict.affectedRecords}
                    </p>
                  </div>
                </div>
                {conflict.action && (
                  <button
                    onClick={() => handleResolve(conflict.type, conflict.details)}
                    disabled={isLoading}
                    className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {conflict.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Data Management Tips:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>High severity issues should be resolved immediately</li>
                <li>Medium severity issues may cause user experience problems</li>
                <li>Low severity issues are informational and can be addressed later</li>
                <li>Regular data integrity checks help maintain database health</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}