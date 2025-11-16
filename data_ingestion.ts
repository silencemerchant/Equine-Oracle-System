/**
 * Data Ingestion Service - Fetches live racecards and populates the database
 * Uses rpscrape to get today's/tomorrow's races from Racing Post
 */

import { spawn } from 'child_process';
import { createRace, createHorses } from './db_queries';
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

/**
 * Fetch live racecards for today or tomorrow using rpscrape
 */
export async function fetchLiveRacecards(date: 'today' | 'tomorrow' = 'today'): Promise<RaceData[]> {
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
          // Parse JSON output from rpscrape
          const racecards = JSON.parse(output);
          console.log(`[Data Ingestion] Fetched ${racecards.length} races for ${date}`);
          resolve(racecards);
        } catch (parseError) {
          console.error('[Data Ingestion] Failed to parse rpscrape output:', parseError);
          reject(new Error(`Failed to parse rpscrape output: ${parseError}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[Data Ingestion] Process error:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Ingest racecards into the database
 */
export async function ingestRacecards(racecards: RaceData[]): Promise<number> {
  let ingestedCount = 0;

  for (const race of racecards) {
    try {
      // Create race record
      const raceId = `${race.course}-${race.date}-${race.race_number}`;
      const raceDate = new Date(`${race.date}T${race.time}`);

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

      // Create horse records for this race
      const horsesToCreate = race.runners.map((runner) => ({
        horseName: runner.name,
        raceId: 0, // Will be set by the database
        jockey: runner.jockey || '',
        trainer: runner.trainer || '',
        odds: runner.odds || '',
        form: runner.form || '',
      }));

      await createHorses(horsesToCreate);
      ingestedCount++;

      console.log(`[Data Ingestion] Ingested race: ${raceId} with ${race.runners.length} horses`);
    } catch (error) {
      console.error(`[Data Ingestion] Error ingesting race:`, error);
    }
  }

  return ingestedCount;
}

/**
 * Full pipeline: Fetch and ingest live racecards
 */
export async function syncLiveRacecards(date: 'today' | 'tomorrow' = 'today'): Promise<{
  success: boolean;
  racesCount: number;
  horsesCount: number;
  error?: string;
}> {
  try {
    console.log(`[Data Ingestion] Starting sync for ${date}...`);

    // Fetch racecards
    const racecards = await fetchLiveRacecards(date);

    if (!racecards || racecards.length === 0) {
      console.log(`[Data Ingestion] No racecards found for ${date}`);
      return {
        success: true,
        racesCount: 0,
        horsesCount: 0,
      };
    }

    // Ingest into database
    const racesCount = await ingestRacecards(racecards);

    // Count total horses
    const horsesCount = racecards.reduce((sum, race) => sum + (race.runners?.length || 0), 0);

    console.log(`[Data Ingestion] Sync complete: ${racesCount} races, ${horsesCount} horses`);

    return {
      success: true,
      racesCount,
      horsesCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Data Ingestion] Sync failed:', errorMessage);
    return {
      success: false,
      racesCount: 0,
      horsesCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Scheduled sync function - call this periodically (e.g., every 30 minutes)
 */
export async function scheduledSync(): Promise<void> {
  try {
    // Sync today's races
    const todayResult = await syncLiveRacecards('today');
    console.log(`[Data Ingestion] Today's sync result:`, todayResult);

    // Also sync tomorrow's races
    const tomorrowResult = await syncLiveRacecards('tomorrow');
    console.log(`[Data Ingestion] Tomorrow's sync result:`, tomorrowResult);
  } catch (error) {
    console.error('[Data Ingestion] Scheduled sync error:', error);
  }
}
