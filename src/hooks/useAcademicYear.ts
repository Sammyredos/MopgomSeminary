'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDynamicYears, getCurrentAcademicYearString, getAcademicYearDisplayInfo } from '@/lib/utils/dynamic-years';
import { toast } from 'sonner';

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAcademicYearReturn {
  // State
  academicYears: AcademicYear[];
  selectedAcademicYear: string;
  currentAcademicYear: AcademicYear | null;
  isLoading: boolean;
  error: string | null;
  lastUpdateTime: Date | null;
  
  // Actions
  setSelectedAcademicYear: (year: string) => void;
  refreshAcademicYears: () => Promise<void>;
  handleRefresh: () => void;
  
  // Utilities
  getDynamicYearInfo: () => ReturnType<typeof getDynamicYears>;
  getDisplayInfo: () => ReturnType<typeof getAcademicYearDisplayInfo>;
  generateDefaultAcademicYear: () => string;
}

export const useAcademicYear = (autoFetch: boolean = true): UseAcademicYearReturn => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Generate default academic year using dynamic calculation
  const generateDefaultAcademicYear = useCallback(() => {
    return getCurrentAcademicYearString();
  }, []);

  // Get dynamic year information
  const getDynamicYearInfo = useCallback(() => {
    return getDynamicYears();
  }, []);

  // Get display information
  const getDisplayInfo = useCallback(() => {
    return getAcademicYearDisplayInfo();
  }, []);

  // Fetch academic years from API
  const fetchAcademicYears = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/academic-years?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch academic years');
      }
      
      const data = await response.json();
      const years = data.academicYears || [];
      setAcademicYears(years);
      
      // Find and set current academic year
      const currentYear = years.find((year: AcademicYear) => year.isCurrent);
      setCurrentAcademicYear(currentYear || null);
      
      // Set selected academic year if not already set
      if (!selectedAcademicYear) {
        if (currentYear) {
          setSelectedAcademicYear(currentYear.year);
        } else {
          // Fallback to smart default generator
          const defaultYear = generateDefaultAcademicYear();
          setSelectedAcademicYear(defaultYear);
        }
      }
      
      setLastUpdateTime(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch academic years';
      setError(errorMessage);
      console.error('Error fetching academic years:', err);
      
      // Fallback to smart default if API fails
      if (!selectedAcademicYear) {
        const defaultYear = generateDefaultAcademicYear();
        setSelectedAcademicYear(defaultYear);
      }
      
      toast.error('Failed to load academic years');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAcademicYear, generateDefaultAcademicYear]);

  // Refresh academic years (manual refresh)
  const refreshAcademicYears = useCallback(async () => {
    await fetchAcademicYears();
    toast.success('Academic years refreshed');
  }, [fetchAcademicYears]);

  // Handle refresh with dynamic year update
  const handleRefresh = useCallback(() => {
    const newYearInfo = getDynamicYears();
    setSelectedAcademicYear(newYearInfo.display_title);
    setLastUpdateTime(new Date());
    refreshAcademicYears();
  }, [refreshAcademicYears]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAcademicYears();
    }
  }, [autoFetch, fetchAcademicYears]);

  // Auto-update every 5 minutes to keep academic year current
  useEffect(() => {
    if (!autoFetch) return;
    
    const interval = setInterval(() => {
      const currentTime = new Date();
      const timeSinceLastUpdate = lastUpdateTime 
        ? currentTime.getTime() - lastUpdateTime.getTime()
        : Infinity;
      
      // Auto-refresh if it's been more than 5 minutes
      if (timeSinceLastUpdate > 5 * 60 * 1000) {
        handleRefresh();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoFetch, lastUpdateTime, handleRefresh]);

  return {
    // State
    academicYears,
    selectedAcademicYear,
    currentAcademicYear,
    isLoading,
    error,
    lastUpdateTime,
    
    // Actions
    setSelectedAcademicYear,
    refreshAcademicYears,
    handleRefresh,
    
    // Utilities
    getDynamicYearInfo,
    getDisplayInfo,
    generateDefaultAcademicYear,
  };
};

export default useAcademicYear;