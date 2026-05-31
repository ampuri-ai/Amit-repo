import fetch from 'node-fetch';
import type { WeatherResult } from './openmeteo.js';
import { wmoToDescription } from './openmeteo.js';

interface WttrResponse {
  current_condition: Array<{
    temp_C: string;
    FeelsLikeC: string;
    humidity: string;
    windspeedKmph: string;
    weatherCode: string;
    uvIndex: string;
  }>;
  nearest_area: Array<{
    areaName: Array<{ value: string }>;
    country: Array<{ value: string }>;
    latitude: string;
    longitude: string;
  }>;
}

export async function getWttrCurrent(city: string): Promise<WeatherResult> {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'weather-mcp/1.0' },
  });
  if (!res.ok) throw new Error(`wttr.in request failed: ${res.status}`);

  const data = await res.json() as WttrResponse;
  const c = data.current_condition[0];
  const area = data.nearest_area[0];

  return {
    source: 'wttr.in',
    city: area.areaName[0].value,
    country: area.country[0].value,
    lat: parseFloat(area.latitude),
    lon: parseFloat(area.longitude),
    temperature: parseFloat(c.temp_C),
    feelsLike: parseFloat(c.FeelsLikeC),
    humidity: parseFloat(c.humidity),
    windSpeed: parseFloat(c.windspeedKmph),
    description: wmoToDescription(parseInt(c.weatherCode, 10)),
    uvIndex: parseFloat(c.uvIndex),
  };
}
