/**
 * TAB API Service
 * Fetches live race data from TAB NZ Affiliates API
 * Based on documentation from api.tab.co.nz/affiliates/v1
 */

const TAB_API_BASE = "https://api.tab.co.nz/affiliates/v1";

interface TabApiHeaders {
  From: string;
  "X-Partner": string;
  "X-Partner-ID": string;
}

// Mock headers for development - in production these would be environment variables
const DEFAULT_HEADERS: TabApiHeaders = {
  From: "equine-oracle@example.com",
  "X-Partner": "equine-oracle",
  "X-Partner-ID": "equine-oracle-001",
};

export interface TabRace {
  id: string;
  race_number: number;
  race_name: string;
  meeting_id: string;
  meeting_name: string;
  track_condition: string;
  track_surface: string;
  distance: number;
  race_date_nz: string;
  start_time_nz: string;
  type: string; // Thoroughbred, Harness, Greyhound
  status: string;
  weather?: string;
  runners?: TabRunner[];
}

export interface TabRunner {
  runner_number: number;
  runner_name: string;
  barrier: number;
  jockey?: string;
  trainer_name?: string;
  weight?: number;
  handicap?: number;
  last_starts?: string;
  form?: string;
}

export interface TabMeeting {
  id: string;
  name: string;
  location: string;
  country: string;
  date: string;
  race_count: number;
  track_condition?: string;
  weather?: string;
}

/**
 * Fetch today's race meetings from TAB API
 */
export async function getTodaysMeetings(): Promise<TabMeeting[]> {
  try {
    const url = `${TAB_API_BASE}/racing/meetings?country=NZ&date_from=today&date_to=today`;
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS as any,
    });

    if (!response.ok) {
      console.error(`TAB API error: ${response.status} ${response.statusText}`);
      return getMockMeetings();
    }

    const data = await response.json();
    return parseMeetings(data.meetings || []);
  } catch (error) {
    console.error("Error fetching TAB meetings:", error);
    return getMockMeetings();
  }
}

/**
 * Fetch today's races from TAB API
 */
export async function getTodaysRaces(): Promise<TabRace[]> {
  try {
    const url = `${TAB_API_BASE}/racing/races?countries=NZ&date_from=today&date_to=today&limit=200`;
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS as any,
    });

    if (!response.ok) {
      console.error(`TAB API error: ${response.status} ${response.statusText}`);
      return getMockRaces();
    }

    const data = await response.json();
    return parseRaces(data.races || []);
  } catch (error) {
    console.error("Error fetching TAB races:", error);
    return getMockRaces();
  }
}

/**
 * Fetch detailed race information by race ID
 */
export async function getRaceDetails(raceId: string): Promise<TabRace | null> {
  try {
    const url = `${TAB_API_BASE}/racing/events/${raceId}`;
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS as any,
    });

    if (!response.ok) {
      console.error(`TAB API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return parseRaceDetails(data);
  } catch (error) {
    console.error("Error fetching race details:", error);
    return null;
  }
}

/**
 * Parse meetings from TAB API response
 */
function parseMeetings(meetings: any[]): TabMeeting[] {
  return meetings.map((m) => ({
    id: m.id || m.meeting_id || "",
    name: m.name || m.meeting_name || "",
    location: m.location || m.venue || "",
    country: m.country || "NZ",
    date: m.date || m.meeting_date || "",
    race_count: m.race_count || m.races?.length || 0,
    track_condition: m.track_condition,
    weather: m.weather,
  }));
}

/**
 * Parse races from TAB API response
 */
function parseRaces(races: any[]): TabRace[] {
  return races.map((r) => ({
    id: r.id || r.race_id || "",
    race_number: r.race_number || 0,
    race_name: r.race_name || r.name || "",
    meeting_id: r.meeting_id || "",
    meeting_name: r.meeting_name || r.venue || "",
    track_condition: r.track_condition || "Good",
    track_surface: r.track_surface || "Turf",
    distance: r.distance || 0,
    race_date_nz: r.race_date_nz || r.date || "",
    start_time_nz: r.start_time_nz || r.time || "",
    type: r.type || "Thoroughbred",
    status: r.status || "upcoming",
    weather: r.weather,
  }));
}

/**
 * Parse detailed race information
 */
function parseRaceDetails(data: any): TabRace {
  const race = data.race || data;
  return {
    id: race.id || "",
    race_number: race.race_number || 0,
    race_name: race.race_name || "",
    meeting_id: race.meeting_id || "",
    meeting_name: race.meeting_name || "",
    track_condition: race.track_condition || "Good",
    track_surface: race.track_surface || "Turf",
    distance: race.distance || 0,
    race_date_nz: race.race_date_nz || "",
    start_time_nz: race.start_time_nz || "",
    type: race.type || "Thoroughbred",
    status: race.status || "upcoming",
    weather: race.weather,
    runners: parseRunners(race.runners || []),
  };
}

/**
 * Parse runners from race data
 */
function parseRunners(runners: any[]): TabRunner[] {
  return runners.map((r) => ({
    runner_number: r.runner_number || r.number || 0,
    runner_name: r.runner_name || r.name || "",
    barrier: r.barrier || 0,
    jockey: r.jockey || r.jockey_name,
    trainer_name: r.trainer_name || r.trainer,
    weight: r.weight,
    handicap: r.handicap,
    last_starts: r.last_starts,
    form: r.form,
  }));
}

/**
 * Mock data for development/fallback
 */
function getMockMeetings(): TabMeeting[] {
  const today = new Date().toISOString().split("T")[0];
  return [
    {
      id: "mock-ellerslie",
      name: "Ellerslie",
      location: "Auckland",
      country: "NZ",
      date: today,
      race_count: 8,
      track_condition: "Good",
      weather: "Fine",
    },
    {
      id: "mock-trentham",
      name: "Trentham",
      location: "Wellington",
      country: "NZ",
      date: today,
      race_count: 9,
      track_condition: "Soft",
      weather: "Overcast",
    },
    {
      id: "mock-riccarton",
      name: "Riccarton",
      location: "Christchurch",
      country: "NZ",
      date: today,
      race_count: 7,
      track_condition: "Good",
      weather: "Fine",
    },
  ];
}

/**
 * Mock races for development/fallback
 */
function getMockRaces(): TabRace[] {
  const today = new Date().toISOString().split("T")[0];
  const time = new Date();
  time.setHours(time.getHours() + 1);
  const startTime = time.toTimeString().slice(0, 5);

  return [
    {
      id: "mock-race-1",
      race_number: 1,
      race_name: "Maiden Stakes",
      meeting_id: "mock-ellerslie",
      meeting_name: "Ellerslie",
      track_condition: "Good",
      track_surface: "Turf",
      distance: 1200,
      race_date_nz: today,
      start_time_nz: startTime,
      type: "Thoroughbred",
      status: "upcoming",
      weather: "Fine",
    },
    {
      id: "mock-race-2",
      race_number: 2,
      race_name: "Handicap Race",
      meeting_id: "mock-ellerslie",
      meeting_name: "Ellerslie",
      track_condition: "Good",
      track_surface: "Turf",
      distance: 1600,
      race_date_nz: today,
      start_time_nz: startTime,
      type: "Thoroughbred",
      status: "upcoming",
      weather: "Fine",
    },
    {
      id: "mock-race-3",
      race_number: 1,
      race_name: "Trotting Race",
      meeting_id: "mock-trentham",
      meeting_name: "Trentham",
      track_condition: "Soft",
      track_surface: "All Weather",
      distance: 2000,
      race_date_nz: today,
      start_time_nz: startTime,
      type: "Harness",
      status: "upcoming",
      weather: "Overcast",
    },
  ];
}

/**
 * Get unique track names from races
 */
export function getUniqueTracksFromRaces(races: TabRace[]): string[] {
  const tracks = new Set(races.map((r) => r.meeting_name));
  return Array.from(tracks).sort();
}

/**
 * Get unique race types from races
 */
export function getUniqueRaceTypes(races: TabRace[]): string[] {
  const types = new Set(races.map((r) => r.type));
  return Array.from(types).sort();
}

/**
 * Get runners from a specific race
 */
export async function getRaceRunners(raceId: string): Promise<TabRunner[]> {
  const race = await getRaceDetails(raceId);
  return race?.runners || [];
}
