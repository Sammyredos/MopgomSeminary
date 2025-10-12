/**
 * Reusable User Card Component with consistent design
 */

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Mail,
  Phone,
  IdCard,
  Eye,
  UserCheck,
  UserX,
  Clock,
  Trash2
} from 'lucide-react'
import { capitalizeName } from '@/lib/utils'

interface UserCardProps {
  user: {
    id: string
    fullName: string
    emailAddress: string
    phoneNumber: string
    gender: string
    age?: number
    dateOfBirth?: string
    courseDesired?: string
    createdAt: string
    matricNumber?: string
    isVerified?: boolean
    verifiedAt?: string
    verifiedBy?: string
  }
  onView?: (user: any) => void
  onVerify?: (userId: string) => void
  onUnverify?: (userId: string) => void
  onDelete?: (user: any) => void
  isVerifying?: boolean
  isUnverifying?: boolean
  showVerifyButton?: boolean
  showUnverifyButton?: boolean
  showDeleteButton?: boolean
  loading?: boolean
  extraActions?: React.ReactNode
  showGender?: boolean
}

export function UserCard({
  user,
  onView,
  onVerify,
  onUnverify,
  onDelete,
  isVerifying = false,
  isUnverifying = false,
  showVerifyButton = false,
  showUnverifyButton = false,
  showDeleteButton = false,
  loading = false,
  extraActions,
  showGender = true
}: UserCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null

    try {
      const today = new Date()
      const birthDate = new Date(dateOfBirth)

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        return null
      }

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      // Return null for negative ages (invalid dates)
      return age >= 0 ? age : null
    } catch (error) {
      return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="p-4 lg:p-6 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="mb-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 lg:p-6 hover:shadow-lg transition-shadow duration-200 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center rounded-full">
          <span className="text-white font-apercu-bold text-xs lg:text-sm">
            {getInitials(capitalizeName(user.fullName))}
          </span>
        </div>
        
        {user.isVerified !== undefined && (
          <Badge 
            variant={user.isVerified ? "default" : "secondary"}
            className={`${
              user.isVerified 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}
          >
            {user.isVerified ? (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                Verified
              </>
            ) : (
              <>
                <UserX className="h-3 w-3 mr-1" />
                Unverified
              </>
            )}
          </Badge>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-apercu-bold text-sm lg:text-base text-gray-900 mb-2 line-clamp-2">
          {capitalizeName(user.fullName)}
        </h3>
        <div className="space-y-1.5 lg:space-y-2">
          <div className="flex items-center text-xs lg:text-sm">
            <GraduationCap className="h-3 w-3 lg:h-4 lg:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="font-apercu-regular text-gray-500">
              {user.courseDesired ? `Course: ${user.courseDesired}` : 'Course: N/A'}
              {showGender && user.gender ? ` • ${user.gender}` : ''}
            </span>
          </div>
          <div className="flex items-center text-xs lg:text-sm">
            <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="font-apercu-regular text-gray-500 truncate">
              {user.emailAddress}
            </span>
          </div>
          <div className="flex items-center text-xs lg:text-sm">
            <Phone className="h-3 w-3 lg:h-4 lg:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="font-apercu-regular text-gray-500">
              {user.phoneNumber}
            </span>
          </div>
          <div className="flex items-center text-xs lg:text-sm">
            <IdCard className="h-3 w-3 lg:h-4 lg:w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="font-apercu-regular text-gray-500">
              <span className="hidden sm:inline text-gray-500">Matric: </span>{user.matricNumber || 'Not assigned'}
            </span>
          </div>
          
          {user.isVerified && user.verifiedAt && (
            <div className="flex items-center text-xs lg:text-sm text-green-600">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-2 text-green-400 flex-shrink-0" />
              <span className="font-apercu-regular">
                Verified {formatDate(user.verifiedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        {onView && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-apercu-medium text-xs lg:text-sm"
            onClick={() => onView(user)}
          >
            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
          </Button>
        )}
        
        {showVerifyButton && onVerify && !user.isVerified && (
          <Button
            size="sm"
            className="flex-1 font-apercu-medium text-xs lg:text-sm bg-green-600 hover:bg-green-700"
            onClick={() => onVerify(user.id)}
            disabled={isVerifying}
          >
            <UserCheck className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        )}

        {showUnverifyButton && onUnverify && user.isVerified && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 font-apercu-medium text-xs lg:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={() => onUnverify(user.id)}
            disabled={isUnverifying}
          >
            <UserX className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            {isUnverifying ? 'Unverifying...' : 'Unverify'}
          </Button>
        )}

        {showDeleteButton && onDelete && (
          <Button
            variant="outline"
            size="sm"
            className="font-apercu-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-2 lg:px-3"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
          </Button>
        )}

        {extraActions && (
          <>
            {extraActions}
          </>
        )}
      </div>
    </Card>
  )
}
