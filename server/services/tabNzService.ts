import { getDb } from "../db";
import { InsertMeet, InsertRace, InsertHorse, meets, races, horses } from "../../drizzle/schema";

/**
 * TAB NZ Data Service
 * Fetches live racing data from TAB NZ public JSON feeds
 */

const TAB_NZ_BASE_URL = "https://json.tab.co.nz";

interface TabScheduleData {
  meetings?: Array<{
    id?: string;
    number?: number;
    name?: string;
    venue?: string;
    races?: Array<{
      id?: string;
      number?: number;
      name?: string;
      length?: number | string;
      norm_time?: string;
      stake?: number;
      entries?: Array<{
        number?: number;
        name?: string;
        jockey?: string;
        weight?: number;
        barrier?: string;
        scratched?: boolean;
      }>;
    }>;
  }>;
}

/**
 * Fetch schedule data from TAB NZ for a specific date
 */
export async function fetchTabNzSchedule(dateStr: string): Promise<TabScheduleData> {
  try {
    const url = `${TAB_NZ_BASE_URL}/schedule/${dateStr}`;
    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Equine-Oracle-MVP/1.0",
      },
    });

    if (!response.ok) {
      console.error(`TAB NZ API error: ${response.status} ${response.statusText}`);
      return {};
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching TAB NZ schedule:", error);
    return {};
  }
}

/**
 * Ingest TAB NZ schedule data into the database
 */
export async function ingestTabNzData(dateStr: string = ""): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database connection failed" };
  }

  try {
    // Use today's date if not specified
    const date = dateStr || new Date().toISOString().split("T")[0];

    console.log(`Fetching TAB NZ data for ${date}...`);

    // Fetch schedule data
    const scheduleData = await fetchTabNzSchedule(date);

    if (!scheduleData.meetings || scheduleData.meetings.length === 0) {
      console.log("No meetings found for the specified date");
      return { success: true, message: "No meetings found for the specified date" };
    }

    console.log(`Found ${scheduleData.meetings.length} meetings`);

    let meetsCreated = 0;
    let racesCreated = 0;
    let horsesCreated = 0;

    // Process each meeting
    for (const meeting of scheduleData.meetings) {
      try {
        // Skip meetings without a number
        if (!meeting.number) {
          console.log(`Skipping meeting without number: ${meeting.name}`);
          continue;
        }

        // Create meet record
        const meetId = `tab_nz_${date}_${meeting.number}`;
        const meetRecord: InsertMeet = {
          meetId,
          track: meeting.venue || meeting.name || `Meet ${meeting.number}`,
          region: "NZ",
          date,
          numRaces: meeting.races?.filter(r => r.entries && r.entries.some(e => !e.scratched)).length || 0,
        };

        // Insert or update meet
        await db.insert(meets).values(meetRecord).onDuplicateKeyUpdate({
          set: { track: meetRecord.track, numRaces: meetRecord.numRaces },
        });
        meetsCreated++;
        console.log(`Created meet: ${meetId} (${meetRecord.track})`);

        // Process each race
        if (meeting.races && meeting.races.length > 0) {
          for (const race of meeting.races) {
            try {
              // Skip races without a number
              if (!race.number) {
                console.log(`Skipping race without number in ${meetId}`);
                continue;
              }

              const race_id = `tab_nz_${date}_${meeting.number}_${race.number}`;
              const numHorses = race.entries?.filter(e => !e.scratched).length || 0;

              if (numHorses === 0) {
                console.log(`Skipping race ${race.number} with no active horses`);
                continue;
              }

              // Convert length to number if it's a string
              const distance = typeof race.length === 'string' ? parseInt(race.length, 10) : (race.length || 0);

              const raceRecord: InsertRace = {
                raceId: race_id,
                meetId,
                raceNumber: race.number,
                time: race.norm_time ? race.norm_time.split(' ')[1] : "",
                raceType: race.name || "Flat",
                distance,
                prizeMoney: race.stake ? `$${race.stake}` : null,
                numHorses,
              };

              // Insert or update race
              await db.insert(races).values(raceRecord).onDuplicateKeyUpdate({
                set: {
                  time: raceRecord.time,
                  raceType: raceRecord.raceType,
                  distance: raceRecord.distance,
                  prizeMoney: raceRecord.prizeMoney,
                  numHorses: raceRecord.numHorses,
                },
              });
              racesCreated++;
              console.log(`Created race: ${race_id} (${race.name})`);

              // Process each horse/runner (entry)
              if (race.entries && race.entries.length > 0) {
                for (const entry of race.entries) {
                  try {
                    // Skip scratched horses
                    if (entry.scratched) continue;

                    // Skip entries without a number
                    if (!entry.number) continue;

                    const horse: InsertHorse = {
                      horseId: `${race_id}_${entry.number}`,
                      raceId: race_id,
                      name: entry.name || `Runner ${entry.number}`,
                      number: entry.number,
                      jockey: entry.jockey || null,
                      trainer: null,
                      weight: entry.weight || null,
                      odds: null,
                    };

                    // Insert or update horse
                    await db.insert(horses).values(horse).onDuplicateKeyUpdate({
                      set: {
                        name: horse.name,
                        jockey: horse.jockey,
                        weight: horse.weight,
                      },
                    });
                    horsesCreated++;
                  } catch (error) {
                    console.error(`Error saving horse ${entry.number}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error(`Error processing race ${race.number}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing meeting ${meeting.number}:`, error);
      }
    }

    console.log(`Successfully ingested TAB NZ data: ${meetsCreated} meets, ${racesCreated} races, ${horsesCreated} horses`);
    return {
      success: true,
      message: `Ingested ${meetsCreated} meets, ${racesCreated} races, ${horsesCreated} horses for ${date}`,
    };
  } catch (error) {
    console.error("Error ingesting TAB NZ data:", error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get a future date in YYYY-MM-DD format
 */
export function getFutureDateStr(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
}
