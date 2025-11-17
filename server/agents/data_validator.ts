/**
 * Data Validator - Validates scraped race data before ingestion
 * Ensures data quality and consistency
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: any;
}

interface RaceValidation {
  course: string;
  date: string;
  time: string;
  race_number: number;
  race_type: string;
  distance: number;
  runners: Array<{
    name: string;
    jockey?: string;
    trainer?: string;
    odds?: string;
    form?: string;
    weight?: number;
    age?: number;
  }>;
}

export class DataValidator {
  /**
   * Validate a single race record
   */
  static validateRace(race: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!race.course || typeof race.course !== 'string') {
      errors.push('Missing or invalid course name');
    }

    if (!race.date || !this.isValidDate(race.date)) {
      errors.push('Missing or invalid race date');
    }

    if (!race.time || !this.isValidTime(race.time)) {
      errors.push('Missing or invalid race time');
    }

    if (!Number.isInteger(race.race_number) || race.race_number < 1) {
      errors.push('Invalid race number');
    }

    if (!race.race_type || !['flat', 'jumps', 'harness'].includes(race.race_type.toLowerCase())) {
      warnings.push('Unknown race type');
    }

    if (!Number.isInteger(race.distance) || race.distance < 100) {
      errors.push('Invalid race distance');
    }

    // Validate runners
    if (!Array.isArray(race.runners) || race.runners.length === 0) {
      errors.push('No runners in race');
    } else if (race.runners.length < 2) {
      errors.push('Race has fewer than 2 runners');
    } else if (race.runners.length > 30) {
      warnings.push('Unusually high number of runners');
    }

    // Validate each runner
    race.runners?.forEach((runner: any, idx: number) => {
      if (!runner.name || typeof runner.name !== 'string') {
        errors.push(`Runner ${idx + 1}: Missing or invalid horse name`);
      }

      if (runner.weight && (runner.weight < 100 || runner.weight > 200)) {
        warnings.push(`Runner ${idx + 1}: Unusual weight value`);
      }

      if (runner.age && (runner.age < 2 || runner.age > 20)) {
        warnings.push(`Runner ${idx + 1}: Unusual age value`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData: errors.length === 0 ? this.cleanRaceData(race) : undefined,
    };
  }

  /**
   * Validate a batch of races
   */
  static validateRaceBatch(races: any[]): {
    validRaces: RaceValidation[];
    invalidRaces: Array<{ race: any; errors: string[] }>;
    totalValidated: number;
    successRate: number;
  } {
    const validRaces: RaceValidation[] = [];
    const invalidRaces: Array<{ race: any; errors: string[] }> = [];

    races.forEach(race => {
      const result = this.validateRace(race);
      if (result.isValid && result.cleanedData) {
        validRaces.push(result.cleanedData);
      } else {
        invalidRaces.push({
          race,
          errors: result.errors,
        });
      }
    });

    const successRate = races.length > 0 ? (validRaces.length / races.length) * 100 : 0;

    console.log(`[Data Validator] Batch validation: ${validRaces.length}/${races.length} races valid (${successRate.toFixed(1)}%)`);

    if (invalidRaces.length > 0) {
      console.warn(`[Data Validator] ${invalidRaces.length} invalid races detected`);
      invalidRaces.slice(0, 3).forEach(({ race, errors }) => {
        console.warn(`  - ${race.course} Race ${race.race_number}: ${errors.join(', ')}`);
      });
    }

    return {
      validRaces,
      invalidRaces,
      totalValidated: races.length,
      successRate,
    };
  }

  /**
   * Clean and normalize race data
   */
  private static cleanRaceData(race: any): RaceValidation {
    return {
      course: (race.course || '').trim(),
      date: race.date.trim(),
      time: race.time.trim(),
      race_number: parseInt(race.race_number, 10),
      race_type: (race.race_type || '').toLowerCase(),
      distance: parseInt(race.distance, 10),
      runners: (race.runners || []).map((runner: any) => ({
        name: (runner.name || '').trim(),
        jockey: (runner.jockey || '').trim() || undefined,
        trainer: (runner.trainer || '').trim() || undefined,
        odds: (runner.odds || '').trim() || undefined,
        form: (runner.form || '').trim() || undefined,
        weight: runner.weight ? parseInt(runner.weight, 10) : undefined,
        age: runner.age ? parseInt(runner.age, 10) : undefined,
      })),
    };
  }

  /**
   * Check if date string is valid (YYYY-MM-DD format)
   */
  private static isValidDate(dateStr: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if time string is valid (HH:MM format)
   */
  private static isValidTime(timeStr: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  }

  /**
   * Detect duplicate races
   */
  static detectDuplicates(races: RaceValidation[]): {
    duplicates: Array<{ raceId: string; count: number }>;
    unique: RaceValidation[];
  } {
    const raceMap = new Map<string, RaceValidation>();
    const duplicates: Array<{ raceId: string; count: number }> = [];

    races.forEach(race => {
      const raceId = `${race.course}-${race.date}-${race.race_number}`;
      if (raceMap.has(raceId)) {
        const existing = duplicates.find(d => d.raceId === raceId);
        if (existing) {
          existing.count++;
        } else {
          duplicates.push({ raceId, count: 2 });
        }
      } else {
        raceMap.set(raceId, race);
      }
    });

    if (duplicates.length > 0) {
      console.warn(`[Data Validator] Found ${duplicates.length} duplicate races`);
    }

    return {
      duplicates,
      unique: Array.from(raceMap.values()),
    };
  }

  /**
   * Validate data consistency across multiple syncs
   */
  static validateConsistency(previousRaces: RaceValidation[], newRaces: RaceValidation[]): {
    newRaces: RaceValidation[];
    changedRaces: Array<{ raceId: string; changes: string[] }>;
    removedRaces: string[];
  } {
    const previousMap = new Map<string, RaceValidation>();
    const newMap = new Map<string, RaceValidation>();
    const changedRaces: Array<{ raceId: string; changes: string[] }> = [];
    const removedRaces: string[] = [];

    previousRaces.forEach(race => {
      const raceId = `${race.course}-${race.date}-${race.race_number}`;
      previousMap.set(raceId, race);
    });

    newRaces.forEach(race => {
      const raceId = `${race.course}-${race.date}-${race.race_number}`;
      newMap.set(raceId, race);

      const previousRace = previousMap.get(raceId);
      if (previousRace) {
        const changes: string[] = [];

        if (previousRace.runners.length !== race.runners.length) {
          changes.push(`Runner count changed: ${previousRace.runners.length} → ${race.runners.length}`);
        }

        if (JSON.stringify(previousRace) !== JSON.stringify(race)) {
          changes.push('Race details changed');
        }

        if (changes.length > 0) {
          changedRaces.push({ raceId, changes });
        }
      }
    });

    previousMap.forEach((_, raceId) => {
      if (!newMap.has(raceId)) {
        removedRaces.push(raceId);
      }
    });

    if (changedRaces.length > 0 || removedRaces.length > 0) {
      console.log(`[Data Validator] Consistency check: ${changedRaces.length} changed, ${removedRaces.length} removed`);
    }

    return {
      newRaces: Array.from(newMap.values()),
      changedRaces,
      removedRaces,
    };
  }
}

export default DataValidator;
