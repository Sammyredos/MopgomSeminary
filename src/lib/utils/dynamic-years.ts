/**
 * Dynamic Academic Year Utilities
 * Provides consistent academic year calculation logic across the application
 */

export interface DynamicYearInfo {
  current_year: number;
  next_year: number;
  display_title: string;
  calendar_year: number;
}

export interface AcademicYearOption {
  id: string;
  year: string;
  isCurrent: boolean;
  isActive: boolean;
}

/**
 * Calculate dynamic academic years based on current date
 * Academic year typically starts in August/September
 */
export const getDynamicYears = (): DynamicYearInfo => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Academic year typically starts in August/September
  // If we're in Jan-July, we're in the second half of the academic year
  // If we're in Aug-Dec, we're in the first half of the academic year
  let academicCurrentYear, academicNextYear;
  
  if (currentMonth >= 7) { // August (7) to December (11)
    academicCurrentYear = currentYear;
    academicNextYear = currentYear + 1;
  } else { // January (0) to July (6)
    academicCurrentYear = currentYear - 1;
    academicNextYear = currentYear;
  }
  
  return {
    current_year: academicCurrentYear,
    next_year: academicNextYear,
    display_title: `${academicCurrentYear}-${academicNextYear}`,
    calendar_year: currentYear
  };
};

/**
 * Generate dynamic academic year options for form dropdowns
 * Creates current and next academic year options
 */
export const getDynamicAcademicYearOptions = (): AcademicYearOption[] => {
  const { current_year, next_year, display_title } = getDynamicYears();
  
  return [
    {
      id: `${current_year}-${next_year}`,
      year: display_title,
      isCurrent: true,
      isActive: true
    },
    {
      id: `${next_year}-${next_year + 1}`,
      year: `${next_year}-${next_year + 1}`,
      isCurrent: false,
      isActive: true
    }
  ];
};

/**
 * Get the current academic year string in YYYY-YYYY format
 */
export const getCurrentAcademicYearString = (): string => {
  const { display_title } = getDynamicYears();
  return display_title;
};

/**
 * Get formatted display information for the current academic year
 */
export const getAcademicYearDisplayInfo = () => {
  const { current_year, next_year, display_title } = getDynamicYears();
  const now = new Date();
  
  return {
    academicYear: display_title,
    current: current_year,
    next: next_year,
    lastUpdated: now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    })
  };
};