/**
 * Enhanced Data Ingestion Service
 * Includes validation, error recovery, and retry logic
 */

import { spawn } from 'child_process';
import { createRace, createHorses } from './db_queries';
import DataValidator from './data_validator';
import path from 'path';

interface RaceData {
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

interface IngestResult {
  success: boolean;
  racesCount: number;
  horsesCount: number;
  validRaces: number;
  invalidRaces: number;
  duplicatesRemoved: number;
  error?: string;
}

/**
 * Fetch live racecards with error handling
 */
export async function fetchLiveRacecardsWithRetry(
  date: 'today' | 'tomorrow' = 'today',
  maxRetries: number = 3
): Promise<RaceData[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Data Ingestion] Fetching ${date}'s racecards (attempt ${attempt}/${maxRetries})...`);

      const racecards = await fetchLiveRacecards(date);

      if (racecards && racecards.length > 0) {
        console.log(`[Data Ingestion] Successfully fetched ${racecards.length} races`);
        return racecards;
      }

      console.warn(`[Data Ingestion] No racecards returned for ${date}`);
      return [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Data Ingestion] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Data Ingestion] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to fetch racecards after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Fetch live racecards using rpscrape
 */
async function fetchLiveRacecards(date: 'today' | 'tomorrow' = 'today'): Promise<RaceData[]> {
  return new Promise((resolve, reject) => {
    try {
      const rpscrapeScript = path.join('/tmp/rpscrape/scripts/racecards.py');
      const pythonProcess = spawn('python3', [rpscrapeScript, date]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[Data Ingestion] rpscrape error:', errorOutput);
          reject(new Error(`rpscrape failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const racecards = JSON.parse(output);
          resolve(Array.isArray(racecards) ? racecards : []);
        } catch (parseError) {
          console.error('[Data Ingestion] Failed to parse rpscrape output:', parseError);
          reject(new Error(`Failed to parse rpscrape output: ${parseError}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[Data Ingestion] Process error:', error);
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('rpscrape timeout after 60 seconds'));
      }, 60000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Ingest racecards with validation and error handling
 */
export async function ingestRacecardsWithValidation(racecards: RaceData[]): Promise<IngestResult> {
  console.log(`[Data Ingestion] Starting ingestion of ${racecards.length} races...`);

  // Step 1: Validate all races
  const validationResult = DataValidator.validateRaceBatch(racecards);
  console.log(`[Data Ingestion] Validation complete: ${validationResult.successRate.toFixed(1)}% valid`);

  if (validationResult.validRaces.length === 0) {
    return {
      success: false,
      racesCount: 0,
      horsesCount: 0,
      validRaces: 0,
      invalidRaces: validationResult.invalidRaces.length,
      duplicatesRemoved: 0,
      error: 'No valid races to ingest',
    };
  }

  // Step 2: Remove duplicates
  const deduplicationResult = DataValidator.detectDuplicates(validationResult.validRaces);
  const uniqueRaces = deduplicationResult.unique;
  const duplicatesRemoved = validationResult.validRaces.length - uniqueRaces.length;

  console.log(`[Data Ingestion] Deduplication: ${uniqueRaces.length} unique races (${duplicatesRemoved} duplicates removed)`);

  // Step 3: Ingest into database
  let ingestedCount = 0;
  let horsesCount = 0;

  for (const race of uniqueRaces) {
    try {
      const raceId = `${race.course}-${race.date}-${race.race_number}`;
      const raceDate = new Date(`${race.date}T${race.time}`);

      // Create race record
      const raceResult = await createRace({
        raceId,
        date: raceDate,
        track: race.course,
        raceNumber: race.race_number,
        raceType: race.race_type,
        distance: race.distance,
      });

      if (!raceResult) {
        console.warn(`[Data Ingestion] Failed to create race: ${raceId}`);
        continue;
      }

      // Create horse records
      const horsesToCreate = race.runners.map((runner) => ({
        horseName: runner.name,
        raceId: 0,
        jockey: runner.jockey || '',
        trainer: runner.trainer || '',
        odds: runner.odds || '',
        form: runner.form || '',
      }));

      await createHorses(horsesToCreate);
      ingestedCount++;
      horsesCount += race.runners.length;

      console.log(`[Data Ingestion] Ingested: ${raceId} (${race.runners.length} horses)`);
    } catch (error) {
      console.error(`[Data Ingestion] Error ingesting race:`, error);
    }
  }

  console.log(`[Data Ingestion] Ingestion complete: ${ingestedCount} races, ${horsesCount} horses`);

  return {
    success: true,
    racesCount: ingestedCount,
    horsesCount,
    validRaces: validationResult.validRaces.length,
    invalidRaces: validationResult.invalidRaces.length,
    duplicatesRemoved,
  };
}

/**
 * Full pipeline with retry and validation
 */
export async function syncLiveRacecardsEnhanced(date: 'today' | 'tomorrow' = 'today'): Promise<IngestResult> {
  try {
    console.log(`[Data Ingestion] Starting enhanced sync for ${date}...`);

    // Fetch with retry
    const racecards = await fetchLiveRacecardsWithRetry(date, 3);

    if (!racecards || racecards.length === 0) {
      console.log(`[Data Ingestion] No racecards found for ${date}`);
      return {
        success: true,
        racesCount: 0,
        horsesCount: 0,
        validRaces: 0,
        invalidRaces: 0,
        duplicatesRemoved: 0,
      };
    }

    // Ingest with validation
    const result = await ingestRacecardsWithValidation(racecards);

    if (result.success) {
      console.log(`[Data Ingestion] Enhanced sync complete: ${result.racesCount} races, ${result.horsesCount} horses`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Data Ingestion] Enhanced sync failed:', errorMessage);
    return {
      success: false,
      racesCount: 0,
      horsesCount: 0,
      validRaces: 0,
      invalidRaces: 0,
      duplicatesRemoved: 0,
      error: errorMessage,
    };
  }
}
