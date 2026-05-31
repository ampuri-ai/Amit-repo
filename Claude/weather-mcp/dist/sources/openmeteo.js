import fetch from 'node-fetch';
export async function geocode(city) {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', city);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    const res = await fetch(url.toString());
    if (!res.ok)
        throw new Error(`Geocoding request failed: ${res.status}`);
    const data = await res.json();
    if (!data.results?.length)
        throw new Error(`City not found: ${city}`);
    const r = data.results[0];
    return { name: r.name, country: r.country, lat: r.latitude, lon: r.longitude };
}
export async function getCurrentWeather(geo) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(geo.lat));
    url.searchParams.set('longitude', String(geo.lon));
    url.searchParams.set('current', [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'wind_speed_10m',
        'weather_code',
        'uv_index',
    ].join(','));
    url.searchParams.set('timezone', 'auto');
    const res = await fetch(url.toString());
    if (!res.ok)
        throw new Error(`Open-Meteo forecast request failed: ${res.status}`);
    const data = await res.json();
    const c = data.current;
    return {
        source: 'open-meteo',
        city: geo.name,
        country: geo.country,
        lat: geo.lat,
        lon: geo.lon,
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        description: wmoToDescription(c.weather_code),
        uvIndex: c.uv_index,
    };
}
export async function getForecast(geo, days = 7) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(geo.lat));
    url.searchParams.set('longitude', String(geo.lon));
    url.searchParams.set('daily', [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'wind_speed_10m_max',
    ].join(','));
    url.searchParams.set('forecast_days', String(days));
    url.searchParams.set('timezone', 'auto');
    const res = await fetch(url.toString());
    if (!res.ok)
        throw new Error(`Open-Meteo forecast request failed: ${res.status}`);
    const data = await res.json();
    const d = data.daily;
    return d.time.map((date, i) => ({
        date,
        description: wmoToDescription(d.weather_code[i]),
        tempMax: d.temperature_2m_max[i],
        tempMin: d.temperature_2m_min[i],
        precipitationSum: d.precipitation_sum[i],
        windSpeedMax: d.wind_speed_10m_max[i],
    }));
}
export function wmoToDescription(code) {
    const map = {
        // WMO codes (0–99) — used by Open-Meteo
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Heavy freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snowfall',
        73: 'Moderate snowfall',
        75: 'Heavy snowfall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
        // wttr.in codes (100+) — BBC/Met Office scale
        113: 'Clear sky',
        116: 'Partly cloudy',
        119: 'Cloudy',
        122: 'Overcast',
        143: 'Mist',
        176: 'Patchy rain',
        179: 'Patchy snow',
        182: 'Patchy sleet',
        185: 'Patchy freezing drizzle',
        200: 'Thundery outbreaks',
        227: 'Blowing snow',
        230: 'Blizzard',
        248: 'Fog',
        260: 'Freezing fog',
        263: 'Patchy light drizzle',
        266: 'Light drizzle',
        281: 'Freezing drizzle',
        284: 'Heavy freezing drizzle',
        293: 'Patchy light rain',
        296: 'Light rain',
        299: 'Moderate rain at times',
        302: 'Moderate rain',
        305: 'Heavy rain at times',
        308: 'Heavy rain',
        311: 'Light freezing rain',
        314: 'Moderate or heavy freezing rain',
        317: 'Light sleet',
        320: 'Moderate or heavy sleet',
        323: 'Patchy light snow',
        326: 'Light snow',
        329: 'Patchy moderate snow',
        332: 'Moderate snow',
        335: 'Patchy heavy snow',
        338: 'Heavy snow',
        350: 'Ice pellets',
        353: 'Light rain shower',
        356: 'Moderate or heavy rain shower',
        359: 'Torrential rain shower',
        362: 'Light sleet showers',
        365: 'Moderate or heavy sleet showers',
        368: 'Light snow showers',
        371: 'Moderate or heavy snow showers',
        374: 'Light ice pellet showers',
        377: 'Moderate or heavy ice pellet showers',
        386: 'Patchy light rain with thunder',
        389: 'Moderate or heavy rain with thunder',
        392: 'Patchy light snow with thunder',
        395: 'Moderate or heavy snow with thunder',
    };
    return map[code] ?? `Unknown (code ${code})`;
}
