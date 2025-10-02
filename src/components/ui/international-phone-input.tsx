'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Country data with flags, codes, and validation patterns
const countries = [
  {
    code: 'NG',
    name: 'Nigeria',
    dialCode: '+234',
    flag: 'NG',
    pattern: /^[789]\d{9}$/,
    placeholder: '8012345678',
    maxLength: 10
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: 'US',
    pattern: /^\d{10}$/,
    placeholder: '2025551234',
    maxLength: 10
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: 'GB',
    pattern: /^[1-9]\d{8,9}$/,
    placeholder: '7911123456',
    maxLength: 11
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: 'CA',
    pattern: /^\d{10}$/,
    placeholder: '4161234567',
    maxLength: 10
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: 'AU',
    pattern: /^[2-9]\d{8}$/,
    placeholder: '412345678',
    maxLength: 9
  },
  {
    code: 'GH',
    name: 'Ghana',
    dialCode: '+233',
    flag: 'GH',
    pattern: /^[2-9]\d{8}$/,
    placeholder: '241234567',
    maxLength: 9
  },
  {
    code: 'KE',
    name: 'Kenya',
    dialCode: '+254',
    flag: 'KE',
    pattern: /^[17]\d{8}$/,
    placeholder: '712345678',
    maxLength: 9
  },
  {
    code: 'ZA',
    name: 'South Africa',
    dialCode: '+27',
    flag: 'ZA',
    pattern: /^[1-9]\d{8}$/,
    placeholder: '821234567',
    maxLength: 9
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: 'IN',
    pattern: /^[6-9]\d{9}$/,
    placeholder: '9876543210',
    maxLength: 10
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: 'FR',
    pattern: /^[1-9]\d{8}$/,
    placeholder: '612345678',
    maxLength: 9
  }
]

interface InternationalPhoneInputProps {
  value?: string
  onChange?: (value: string, isValid: boolean) => void
  onCountryChange?: (country: typeof countries[0]) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  defaultCountry?: string
}

export function InternationalPhoneInput({
  value = '',
  onChange,
  onCountryChange,
  placeholder,
  disabled = false,
  error = false,
  className = '',
  defaultCountry = 'NG'
}: InternationalPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find(c => c.code === defaultCountry) || countries[0]
  )
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isValid, setIsValid] = useState(false)
  
  // Use ref to track if we should call onChange to prevent infinite loops
  const isInternalUpdate = useRef(false)

  // Parse initial value if provided
  useEffect(() => {
    if (value) {
      isInternalUpdate.current = true
      // Try to parse the value to extract country code and number
      const country = countries.find(c => value.startsWith(c.dialCode))
      if (country) {
        setSelectedCountry(country)
        setPhoneNumber(value.substring(country.dialCode.length))
      } else {
        setPhoneNumber(value)
      }
    } else if (value === '') {
      isInternalUpdate.current = true
      setPhoneNumber('')
    }
  }, [value])

  // Validate phone number and call onChange
  useEffect(() => {
    const valid = selectedCountry.pattern.test(phoneNumber)
    setIsValid(valid)
    
    // Only call onChange if this is not an internal update from parsing the value prop
    if (!isInternalUpdate.current) {
      const fullNumber = phoneNumber ? `${selectedCountry.dialCode}${phoneNumber}` : ''
      onChange?.(fullNumber, valid)
    }
    isInternalUpdate.current = false
  }, [phoneNumber, selectedCountry.dialCode, selectedCountry.pattern])

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (country) {
      setSelectedCountry(country)
      onCountryChange?.(country)
      // Clear phone number when country changes
      setPhoneNumber('')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '') // Remove non-digits
    
    // Limit input length based on country
    if (inputValue.length <= selectedCountry.maxLength) {
      setPhoneNumber(inputValue)
    }
  }

  const formatPhoneNumber = (number: string) => {
    if (!number) return ''
    
    // Format based on country (basic formatting)
    switch (selectedCountry.code) {
      case 'NG':
        if (number.length >= 4) {
          return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
        }
        return number
      case 'US':
      case 'CA':
        if (number.length >= 7) {
          return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
        } else if (number.length >= 4) {
          return `(${number.slice(0, 3)}) ${number.slice(3)}`
        }
        return number
      default:
        return number
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger 
            className={`w-[120px] h-12 rounded-r-none border-r border-r-gray-300 focus:z-10 focus:ring-0 focus:ring-offset-0 hover:shadow-none active:shadow-none ${
              error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
            } transition-colors`}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-4 bg-gray-100 border border-gray-300 rounded-sm flex items-center justify-center">
                <span className="text-xs font-bold text-gray-700">{selectedCountry.flag}</span>
              </div>
              <span className="text-sm font-apercu-regular text-gray-600">
                {selectedCountry.dialCode}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-4 bg-gray-100 border border-gray-300 rounded-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{country.flag}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-apercu-medium text-sm">{country.name}</span>
                    <span className="font-apercu-regular text-xs text-gray-500">
                      {country.dialCode}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Input
            type="tel"
            value={formatPhoneNumber(phoneNumber)}
            onChange={handlePhoneChange}
            placeholder={placeholder || `Enter phone number`}
            disabled={disabled}
            className={`font-apercu-regular pl-3 h-12 rounded-l-none border-l-0 focus:z-10 focus:ring-0 focus:ring-offset-0 ${
              error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
            } transition-colors`}
            maxLength={selectedCountry.maxLength + 5} // Extra space for formatting
          />
          
          {/* Validation Indicator */}
          {phoneNumber && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className={`w-2 h-2 rounded-full ${
                isValid ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          )}
        </div>
      </div>
      
      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500 font-apercu-regular">
        Example: {selectedCountry.dialCode} {selectedCountry.placeholder}
      </div>
    </div>
  )
}

export default InternationalPhoneInput