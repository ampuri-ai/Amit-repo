import fetch from 'node-fetch';

export interface SevenTimerPoint {
  timepoint: number;
  cloudcover: number;
  precipitation_type: string;
  precipitation_amount: number;
  temp2m: number;
  wind10m: {
    direction: string;
    speed: number;
  };
}

interface SevenTimerResponse {
  dataseries: Array<{
    timepoint: number;
    cloudcover: number;
    prec_type: string;
    prec_amount: number;
    temp2m: number;
    wind10m: {
      direction: string;
      speed: number;
    };
  }>;
}

export async function getSevenTimer(lat: number, lon: number): Promise<SevenTimerPoint[]> {
  const url = new URL('https://www.7timer.info/bin/api.pl');
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('product', 'civil');
  url.searchParams.set('output', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`7timer request failed: ${res.status}`);

  const data = await res.json() as SevenTimerResponse;

  return data.dataseries.slice(0, 8).map((p) => ({
    timepoint: p.timepoint,
    cloudcover: p.cloudcover,
    precipitation_type: p.prec_type,
    precipitation_amount: p.prec_amount,
    temp2m: p.temp2m,
    wind10m: p.wind10m,
  }));
}
