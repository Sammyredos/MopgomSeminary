import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const db = prisma as any;
// Unconventional Calendar Configuration
export interface UnconventionalCalendarConfig {
  // Custom year structure - 13 months with 28 days each + 1 leap day
  monthsPerYear: number;
  daysPerMonth: number;
  leapDayFrequency: number; // Every N years
  
  // Academic year structure
  academicYearStartMonth: number; // Month number (1-13)
  academicYearStartDay: number;
  semesterStructure: {
    count: number;
    names: string[];
    durationInDays: number[];
    breaksBetween: number[]; // Days of break between semesters
  };
  
  // Custom week structure
  daysPerWeek: number;
  weekNames: string[];
  
  // Holiday patterns
  fixedHolidays: Array<{
    name: string;
    month: number;
    day: number;
  }>;
  
  // Seasonal adjustments
  seasonalAdjustments: Array<{
    name: string;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    description: string;
  }>;
}

// Default Unconventional Calendar Configuration
export const DEFAULT_UNCONVENTIONAL_CALENDAR: UnconventionalCalendarConfig = {
  monthsPerYear: 13,
  daysPerMonth: 28,
  leapDayFrequency: 4, // Every 4 years
  
  academicYearStartMonth: 8, // 8th month (roughly August equivalent)
  academicYearStartDay: 1,
  
  semesterStructure: {
    count: 3,
    names: ['Autumn Semester', 'Winter Semester', 'Spring Semester'],
    durationInDays: [112, 112, 112], // 4 months each
    breaksBetween: [14, 21, 28] // 2, 3, 4 weeks breaks
  },
  
  daysPerWeek: 8, // 8-day weeks
  weekNames: ['Primday', 'Secunday', 'Tertiday', 'Quartday', 'Quintday', 'Sextday', 'Septday', 'Octday'],
  
  fixedHolidays: [
    { name: 'New Year Celebration', month: 1, day: 1 },
    { name: 'Mid-Year Festival', month: 7, day: 14 },
    { name: 'Harvest Celebration', month: 10, day: 21 },
    { name: 'Winter Solstice', month: 13, day: 28 },
  ],
  
  seasonalAdjustments: [
    {
      name: 'Extended Learning Period',
      startMonth: 3,
      startDay: 1,
      endMonth: 5,
      endDay: 28,
      description: 'Intensive academic focus period with extended class hours'
    },
    {
      name: 'Reflection Season',
      startMonth: 11,
      startDay: 1,
      endMonth: 12,
      endDay: 28,
      description: 'Period for assessment, reflection, and preparation'
    }
  ]
};

export class UnconventionalDate {
  year: number;
  month: number; // 1-13
  day: number; // 1-28
  
  constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = Math.max(1, Math.min(13, month));
    this.day = Math.max(1, Math.min(28, day));
  }
  
  // Convert to standard Date for database storage
  toStandardDate(): Date {
    // Approximate conversion to Gregorian calendar
    const approximateMonth = Math.floor((this.month - 1) * 12 / 13) + 1;
    const approximateDay = Math.floor((this.day - 1) * 30 / 28) + 1;
    return new Date(this.year, approximateMonth - 1, approximateDay);
  }
  
  // Create from standard Date
  static fromStandardDate(date: Date): UnconventionalDate {
    const year = date.getFullYear();
    const month = Math.floor(date.getMonth() * 13 / 12) + 1;
    const day = Math.floor(date.getDate() * 28 / 30) + 1;
    return new UnconventionalDate(year, month, day);
  }
  
  // Add days
  addDays(days: number): UnconventionalDate {
    let newDay = this.day + days;
    let newMonth = this.month;
    let newYear = this.year;
    
    while (newDay > 28) {
      newDay -= 28;
      newMonth++;
      if (newMonth > 13) {
        newMonth = 1;
        newYear++;
      }
    }
    
    return new UnconventionalDate(newYear, newMonth, newDay);
  }
  
  // Format for display
  format(): string {
    const monthNames = [
      'Primarius', 'Secundus', 'Tertius', 'Quartus', 'Quintus', 'Sextus',
      'Septimus', 'Octavus', 'Nonus', 'Decimus', 'Undecimus', 'Duodecimus', 'Tredecimus'
    ];
    return `${this.day} ${monthNames[this.month - 1]} ${this.year}`;
  }
  
  // Get academic year string
  getAcademicYearString(config: UnconventionalCalendarConfig = DEFAULT_UNCONVENTIONAL_CALENDAR): string {
    if (this.month >= config.academicYearStartMonth) {
      return `${this.year}-${this.year + 1}`;
    } else {
      return `${this.year - 1}-${this.year}`;
    }
  }
}

export class AcademicYearGenerator {
  private config: UnconventionalCalendarConfig;
  
  constructor(config: UnconventionalCalendarConfig = DEFAULT_UNCONVENTIONAL_CALENDAR) {
    this.config = config;
  }
  
  // Generate academic years dynamically
  async generateAcademicYears(startYear: number, count: number = 5): Promise<void> {
    try {
      logger.info(`Generating ${count} academic years starting from ${startYear}`);
      
      for (let i = 0; i < count; i++) {
        const year = startYear + i;
        const academicYearString = `${year}-${year + 1}`;
        
        // Check if academic year already exists
        const existingYear = await db.academicYear.findFirst({
          where: { year: academicYearString }
        });
        
        if (existingYear) {
          logger.info(`Academic year ${academicYearString} already exists, skipping`);
          continue;
        }
        
        // Calculate start and end dates using unconventional calendar
        const startDate = new UnconventionalDate(
          year,
          this.config.academicYearStartMonth,
          this.config.academicYearStartDay
        );
        
        const endDate = new UnconventionalDate(
          year + 1,
          this.config.academicYearStartMonth - 1 || 13,
          28
        );
        
        // Create academic year
        const academicYear = await db.academicYear.create({
          data: {
            year: academicYearString,
            startDate: startDate.toStandardDate(),
            endDate: endDate.toStandardDate(),
            isActive: true,
            isCurrent: i === 0, // First generated year is current
          }
        });
        
        // Generate semesters
        await this.generateSemesters(academicYear.id, startDate);
      }
      
      logger.info('Academic years generation completed successfully');
    } catch (error) {
      logger.error('Error generating academic years:', error);
      throw error;
    }
  }
  
  private async generateSemesters(academicYearId: string, startDate: UnconventionalDate): Promise<void> {
    const { semesterStructure } = this.config;
    
    let currentStart = startDate;
    
    for (let i = 0; i < semesterStructure.count; i++) {
      const name = semesterStructure.names[i] || `Semester ${i + 1}`;
      const duration = semesterStructure.durationInDays[i] || 112;
      const breakDays = semesterStructure.breaksBetween[i] || 14;
      
      const semesterEnd = currentStart.addDays(duration - 1);
      
      // Create semester
      const semester = await db.semester.create({
        data: {
          academicYearId,
          name,
          order: i + 1,
          startDate: currentStart.toStandardDate(),
          endDate: semesterEnd.toStandardDate(),
        }
      });
      
      // Move to next start after break
      currentStart = semesterEnd.addDays(breakDays + 1);
    }
  }
  
  async autoGenerateFutureYears(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      await this.generateAcademicYears(currentYear, 3);
    } catch (error) {
      logger.error('Failed to auto-generate future years:', error);
    }
  }
  
  async getCurrentAcademicYear(): Promise<any> {
    try {
      const now = new Date();
      const yearString = `${now.getFullYear()}-${now.getFullYear() + 1}`;
      const academicYear = await db.academicYear.findFirst({
        where: { year: yearString }
      });
      
      if (!academicYear) {
        await this.generateAcademicYears(now.getFullYear(), 1);
        return await db.academicYear.findFirst({
          where: { year: yearString }
        });
      }
      
      return academicYear;
    } catch (error) {
      logger.error('Failed to get current academic year:', error);
      throw error;
    }
  }
  
  getUnconventionalCalendarEvents(year: number): Array<{
    date: UnconventionalDate;
    name: string;
    type: 'holiday' | 'seasonal' | 'academic';
    description?: string;
  }> {
    const events: Array<{ date: UnconventionalDate; name: string; type: 'holiday' | 'seasonal' | 'academic'; description?: string }> = [];
    
    // Holidays
    for (const holiday of this.config.fixedHolidays) {
      events.push({
        date: new UnconventionalDate(year, holiday.month, holiday.day),
        name: holiday.name,
        type: 'holiday'
      });
    }
    
    // Seasonal adjustments
    for (const season of this.config.seasonalAdjustments) {
      const start = new UnconventionalDate(year, season.startMonth, season.startDay);
      const end = new UnconventionalDate(year, season.endMonth, season.endDay);
      events.push({
        date: start,
        name: season.name + ' (Start)',
        type: 'seasonal',
        description: season.description
      });
      events.push({
        date: end,
        name: season.name + ' (End)',
        type: 'seasonal',
        description: season.description
      });
    }
    
    // Academic events
    const startDate = new UnconventionalDate(
      year,
      this.config.academicYearStartMonth,
      this.config.academicYearStartDay
    );
    events.push({
      date: startDate,
      name: 'Academic Year Start',
      type: 'academic'
    });
    
    const endDate = new UnconventionalDate(
      year + 1,
      this.config.academicYearStartMonth - 1 || 13,
      28
    );
    events.push({
      date: endDate,
      name: 'Academic Year End',
      type: 'academic'
    });
    
    return events;
  }
}

export const academicYearGenerator = new AcademicYearGenerator();