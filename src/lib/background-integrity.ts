import { checkDataIntegrity, resolveDataConflict, runDataCleanup } from './data-integrity';
import { logger } from './logger';

interface BackgroundIntegrityConfig {
  intervalMinutes: number;
  autoResolve: boolean;
  logLevel: 'info' | 'warn' | 'error';
}

class BackgroundIntegrityService {
  private intervalId: NodeJS.Timeout | null = null;
  private config: BackgroundIntegrityConfig;

  constructor(config: BackgroundIntegrityConfig = {
    intervalMinutes: 30,
    autoResolve: false,
    logLevel: 'info'
  }) {
    this.config = config;
  }

  async start() {
    if (this.intervalId) {
      logger.warn('Background integrity service is already running');
      return;
    }

    logger.info(`Starting background data integrity service (interval: ${this.config.intervalMinutes} minutes)`);
    
    // Run initial check
    await this.performCheck();
    
    // Set up recurring checks
    this.intervalId = setInterval(async () => {
      await this.performCheck();
    }, this.config.intervalMinutes * 60 * 1000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Background integrity service stopped');
    }
  }

  private async performCheck() {
    try {
      const conflicts = await checkDataIntegrity();
      
      if (conflicts.length === 0) {
        if (this.config.logLevel === 'info') {
          logger.info('Data integrity check passed - no conflicts detected');
        }
        return;
      }

      // Log conflicts by severity
      const highSeverity = conflicts.filter(c => c.severity === 'high');
      const mediumSeverity = conflicts.filter(c => c.severity === 'medium');
      const lowSeverity = conflicts.filter(c => c.severity === 'low');

      if (highSeverity.length > 0) {
        logger.error(`High severity data conflicts detected: ${highSeverity.length} issues`);
        highSeverity.forEach(conflict => {
          logger.error(`- ${conflict.type}: ${conflict.message} (${conflict.affectedRecords} records)`);
        });
      }

      if (mediumSeverity.length > 0) {
        logger.warn(`Medium severity data conflicts detected: ${mediumSeverity.length} issues`);
        if (this.config.logLevel === 'info') {
          mediumSeverity.forEach(conflict => {
            logger.warn(`- ${conflict.type}: ${conflict.message} (${conflict.affectedRecords} records)`);
          });
        }
      }

      if (lowSeverity.length > 0 && this.config.logLevel === 'info') {
        logger.info(`Low severity data conflicts detected: ${lowSeverity.length} issues`);
        lowSeverity.forEach(conflict => {
          logger.info(`- ${conflict.type}: ${conflict.message} (${conflict.affectedRecords} records)`);
        });
      }

      // Auto-resolve if enabled
      if (this.config.autoResolve) {
        await this.autoResolveConflicts(conflicts);
      }

    } catch (error) {
      logger.error('Background data integrity check failed:', error);
    }
  }

  private async autoResolveConflicts(conflicts: any[]) {
    const resolvableTypes = ['duplicate_email', 'duplicate_phone', 'orphaned_user'];
    
    for (const conflict of conflicts) {
      if (resolvableTypes.includes(conflict.type) && conflict.severity !== 'high') {
        try {
          await resolveDataConflict(conflict.id, conflict.type);
          logger.info(`Auto-resolved conflict: ${conflict.type} (ID: ${conflict.id})`);
        } catch (error) {
          logger.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
        }
      }
    }
  }

  updateConfig(newConfig: Partial<BackgroundIntegrityConfig>) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Background integrity service config updated:', this.config);
  }

  getStatus() {
    return {
      running: this.intervalId !== null,
      config: this.config
    };
  }
}

// Singleton instance
export const backgroundIntegrityService = new BackgroundIntegrityService();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  backgroundIntegrityService.start();
}