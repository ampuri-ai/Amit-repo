import { TTLCache } from './cache.js';
import { geocode, getCurrentWeather, getForecast } from './sources/openmeteo.js';
import { getWttrCurrent } from './sources/wttr.js';
import { getSevenTimer } from './sources/seventimer.js';
import type { GeoResult, WeatherResult, ForecastDay } from './sources/openmeteo.js';
import type { SevenTimerPoint } from './sources/seventimer.js';

const geoCache  = new TTLCache<GeoResult>(60 * 60 * 1000);       // 1 hour
const currCache = new TTLCache<WeatherResult>(10 * 60 * 1000);    // 10 minutes
const fcstCache = new TTLCache<ForecastDay[]>(30 * 60 * 1000);    // 30 minutes

export async function resolveLocation(city: string): Promise<GeoResult> {
  const cached = geoCache.get(city);
  if (cached) return cached;
  const result = await geocode(city);
  geoCache.set(city, result);
  return result;
}

export async function fetchCurrent(city: string): Promise<WeatherResult> {
  const cached = currCache.get(city);
  if (cached) return cached;

  let result: WeatherResult;
  try {
    const geo = await resolveLocation(city);
    result = await getCurrentWeather(geo);
  } catch {
    result = await getWttrCurrent(city);
  }

  currCache.set(city, result);
  return result;
}

export async function fetchForecast(city: string, days = 7): Promise<ForecastDay[]> {
  const key = `${city}:${days}`;
  const cached = fcstCache.get(key);
  if (cached) return cached;

  const geo = await resolveLocation(city);
  const result = await getForecast(geo, days);
  fcstCache.set(key, result);
  return result;
}

export interface AllSourcesResult {
  openmeteo: PromiseSettledResult<WeatherResult>;
  wttr: PromiseSettledResult<WeatherResult>;
  seventimer: PromiseSettledResult<SevenTimerPoint[]>;
}

export async function fetchAllSources(city: string): Promise<AllSourcesResult> {
  const geo = await resolveLocation(city);
  const [openmeteo, wttr, seventimer] = await Promise.allSettled([
    getCurrentWeather(geo),
    getWttrCurrent(city),
    getSevenTimer(geo.lat, geo.lon),
  ]);
  return { openmeteo, wttr, seventimer };
}
