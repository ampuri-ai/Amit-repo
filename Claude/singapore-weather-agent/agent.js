import 'dotenv/config';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  location: {
    name: 'Singapore',
  },
  threshold: {
    minTemp: 30,          // °C — alert if temperature drops below this
  },
  forecast: {
    forecastDays: 3,      // days used by the morning briefing cron job
  },
  schedule: '*/10 * * * *',    // every 10 minutes (cron syntax)
  alertCooldownMinutes: 60,     // minimum gap between repeat low-temp alerts
  email: {
    from: process.env.EMAIL_FROM   || 'your-sender@gmail.com',
    to:   process.env.EMAIL_TO     || 'amitpuri73@gmail.com',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.EMAIL_USER,   // set in .env
    pass: process.env.EMAIL_PASS,   // set in .env (Gmail App Password)
  },
  mcpServerPath: 'C:\\Users\\amitp\\Claude\\weather-mcp\\dist\\index.js',
};
// ──────────────────────────────────────────────────────────────────────────────

// ─── CLI ARG PARSING ──────────────────────────────────────────────────────────
const command = process.argv[2];
const arg3    = process.argv[3];
const arg4    = process.argv[4];

function titleCase(str) {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function parseArgs(cmd) {
  if (cmd === 'forecast') {
    const isNum = arg3 !== undefined && !isNaN(parseInt(arg3));
    return {
      location: titleCase(isNum ? (arg4 || 'Singapore') : (arg3 || 'Singapore')),
      days: isNum ? parseInt(arg3) : 2,
    };
  }
  return { location: titleCase(arg3 || 'Singapore'), days: 2 };
}
// ──────────────────────────────────────────────────────────────────────────────

let lastAlertSent = null;

function timestamp() {
  return new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
}

async function connectMCP() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [CONFIG.mcpServerPath],
  });
  const client = new Client({ name: 'singapore-weather-agent', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

function toWeather(data) {
  return {
    source:       data.source,
    temp_c:       data.temperature,
    feels_like_c: data.feelsLike,
    humidity:     data.humidity,
    wind_kph:     data.windSpeed,
    description:  data.description,
  };
}

async function fetchAllSources(location = CONFIG.location.name) {
  let client;
  try {
    client = await connectMCP();
    const result = await client.callTool({
      name: 'compare_sources',
      arguments: { location },
    });
    return JSON.parse(result.content[0].text);
  } catch (err) {
    console.error(`[${timestamp()}] ERROR fetching weather: ${err.message}`);
    return null;
  } finally {
    if (client) await client.close();
  }
}

async function sendAlert(weather) {
  const transporter = nodemailer.createTransport({
    host:   CONFIG.email.smtpHost,
    port:   CONFIG.email.smtpPort,
    secure: false,
    auth: {
      user: CONFIG.email.user,
      pass: CONFIG.email.pass,
    },
  });

  await transporter.sendMail({
    from:    CONFIG.email.from,
    to:      CONFIG.email.to,
    subject: `[Weather Alert] Singapore temp dropped to ${weather.temp_c}°C`,
    text: [
      `Temperature alert for ${CONFIG.location.name}`,
      ``,
      `Current temperature : ${weather.temp_c}°C`,
      `Feels like          : ${weather.feels_like_c}°C`,
      `Humidity            : ${weather.humidity}%`,
      `Wind speed          : ${weather.wind_kph} km/h`,
      `Conditions          : ${weather.description}`,
      `Alert threshold     : below ${CONFIG.threshold.minTemp}°C`,
      `Checked at          : ${timestamp()}`,
    ].join('\n'),
  });
}

function cooldownElapsed() {
  if (!lastAlertSent) return true;
  const minutesSince = (Date.now() - lastAlertSent) / 60000;
  return minutesSince >= CONFIG.alertCooldownMinutes;
}

async function checkWeather() {
  const all = await fetchAllSources();
  if (!all) {
    console.log(`[${timestamp()}] Weather fetch failed, skipping this cycle`);
    return;
  }

  const ts = timestamp();

  if (!all.open_meteo.error) {
    const w = toWeather(all.open_meteo);
    console.log(`[${ts}] open-meteo  : ${w.temp_c}°C, feels ${w.feels_like_c}°C, humidity ${w.humidity}%, wind ${w.wind_kph} km/h — ${w.description}`);
  } else {
    console.log(`[${ts}] open-meteo  : ERROR — ${all.open_meteo.error}`);
  }

  if (!all.wttr_in.error) {
    const w = toWeather(all.wttr_in);
    console.log(`[${ts}] wttr.in     : ${w.temp_c}°C, feels ${w.feels_like_c}°C, humidity ${w.humidity}%, wind ${w.wind_kph} km/h — ${w.description}`);
  } else {
    console.log(`[${ts}] wttr.in     : ERROR — ${all.wttr_in.error}`);
  }

  if (!all.seven_timer_next_24h.error && all.seven_timer_next_24h.length) {
    const p = all.seven_timer_next_24h[0];
    console.log(`[${ts}] 7timer      : ${p.temp2m}°C, cloud ${p.cloudcover}/9, precip ${p.precipitation_amount}mm (${p.precipitation_type}), wind ${p.wind10m.speed} (${p.wind10m.direction})`);
  } else {
    console.log(`[${ts}] 7timer      : ERROR — ${all.seven_timer_next_24h.error}`);
  }

  const primary = !all.open_meteo.error ? toWeather(all.open_meteo)
                : !all.wttr_in.error    ? toWeather(all.wttr_in)
                : null;

  if (!primary) {
    console.log(`[${ts}] Cannot determine temperature — skipping alert check`);
    return;
  }

  const status = primary.temp_c < CONFIG.threshold.minTemp ? 'BELOW THRESHOLD' : 'OK';
  console.log(`[${ts}] Alert check : ${primary.temp_c}°C — ${status} [source: ${primary.source}]`);

  if (primary.temp_c < CONFIG.threshold.minTemp && cooldownElapsed()) {
    console.log(`[${ts}] Sending alert email to ${CONFIG.email.to}...`);
    await sendAlert(primary);
    lastAlertSent = Date.now();
    console.log(`[${ts}] Alert sent.`);
  }
}

// ─── CLI PRINT FUNCTIONS ──────────────────────────────────────────────────────

async function printCurrent(location) {
  let client;
  try {
    client = await connectMCP();
    const result = await client.callTool({
      name: 'get_current_weather',
      arguments: { location },
    });
    const d = JSON.parse(result.content[0].text);
    const sep = '='.repeat(`===== ${location} Current Weather =====`.length);
    console.log(`===== ${location} Current Weather =====`);
    console.log(`  Source      : ${d.source}`);
    console.log(`  Temperature : ${d.temperature}°C  (feels like ${d.feelsLike}°C)`);
    console.log(`  Humidity    : ${d.humidity}%`);
    console.log(`  Wind        : ${d.windSpeed} km/h`);
    console.log(`  UV Index    : ${d.uvIndex}`);
    console.log(`  Condition   : ${d.description}`);
    console.log(sep);
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
  } finally {
    if (client) await client.close();
  }
}

async function printForecast(location, days) {
  let client;
  try {
    client = await connectMCP();
    const result = await client.callTool({
      name: 'get_forecast',
      arguments: { location, days },
    });
    const dayList = JSON.parse(result.content[0].text);
    const header = `===== ${location} ${days}-Day Forecast =====`;
    console.log(header);
    dayList.forEach((day, i) => {
      const date = new Date(day.date);
      const label = date.toLocaleDateString('en-SG', { weekday: 'short', day: '2-digit', month: 'short' });
      console.log(`Day ${i + 1} — ${label}`);
      console.log(`  High: ${day.tempMax}°C  |  Low: ${day.tempMin}°C`);
      console.log(`  Rain: ${day.precipitationSum}mm  |  Wind: ${day.windSpeedMax} km/h`);
      console.log(`  Condition: ${day.description}`);
      if (i < dayList.length - 1) console.log('-'.repeat(header.length));
    });
    console.log('='.repeat(header.length));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
  } finally {
    if (client) await client.close();
  }
}

async function printRain(location) {
  let client;
  try {
    client = await connectMCP();
    const result = await client.callTool({
      name: 'get_precipitation_detail',
      arguments: { location },
    });
    const points = JSON.parse(result.content[0].text);
    const header = `===== ${location} Precipitation Next 24h (7Timer) =====`;
    console.log(header);
    points.forEach((p) => {
      const sign = p.timepoint > 0 ? `+${p.timepoint}h` : 'now';
      console.log(`  ${sign.padEnd(5)}  ${p.temp2m}°C  cloud ${p.cloudcover}/9  precip ${p.precipitation_amount}mm (${p.precipitation_type})  wind ${p.wind10m.speed} ${p.wind10m.direction}`);
    });
    console.log('='.repeat(header.length));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
  } finally {
    if (client) await client.close();
  }
}

async function printCompare(location) {
  let client;
  try {
    client = await connectMCP();
    const result = await client.callTool({
      name: 'compare_sources',
      arguments: { location },
    });
    const all = JSON.parse(result.content[0].text);
    const header = `===== ${location} — Source Comparison =====`;
    console.log(header);

    const om  = !all.open_meteo.error ? toWeather(all.open_meteo) : null;
    const wt  = !all.wttr_in.error    ? toWeather(all.wttr_in)    : null;
    const st  = !all.seven_timer_next_24h.error && all.seven_timer_next_24h.length
                ? all.seven_timer_next_24h[0] : null;

    if (om) console.log(`  open-meteo  : ${om.temp_c}°C, feels ${om.feels_like_c}°C, humidity ${om.humidity}%, wind ${om.wind_kph} km/h — ${om.description}`);
    else    console.log(`  open-meteo  : ERROR — ${all.open_meteo.error}`);

    if (wt) console.log(`  wttr.in     : ${wt.temp_c}°C, feels ${wt.feels_like_c}°C, humidity ${wt.humidity}%, wind ${wt.wind_kph} km/h — ${wt.description}`);
    else    console.log(`  wttr.in     : ERROR — ${all.wttr_in.error}`);

    if (st) console.log(`  7timer      : ${st.temp2m}°C, cloud ${st.cloudcover}/9, precip ${st.precipitation_amount}mm (${st.precipitation_type}), wind ${st.wind10m.speed} ${st.wind10m.direction}`);
    else    console.log(`  7timer      : ERROR — ${all.seven_timer_next_24h.error}`);

    if (om && wt) {
      const diff = Math.abs(om.temp_c - wt.temp_c);
      const agree = diff <= 2 ? 'Temps agree within 2°C.' : `Temps differ by ${diff.toFixed(1)}°C.`;
      const rain  = (om.description.toLowerCase().includes('rain') || wt.description.toLowerCase().includes('rain'))
                  ? 'Rain likely.' : 'Low rain risk.';
      console.log(`  Consensus for ${location}: ${agree} ${rain}`);
    }

    console.log('='.repeat(header.length));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
  } finally {
    if (client) await client.close();
  }
}

function printHelp() {
  console.log(`
Usage: node agent.js <command> [options]

Commands:
  current [location]              Current weather conditions
  forecast [days] [location]      Forecast (default: 2 days, Singapore)
  rain [location]                 Precipitation detail next 24h
  compare [location]              Compare all sources side by side
  help                            Show this help

Examples:
  node agent.js current
  node agent.js current "Kuala Lumpur"
  node agent.js forecast 5
  node agent.js forecast 5 Tokyo
  node agent.js forecast Bangkok
  node agent.js rain London
  node agent.js compare Bangkok
`.trim());
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if (command === 'current') {
  const { location } = parseArgs(command);
  await printCurrent(location);
  process.exit(0);
} else if (command === 'forecast') {
  const { location, days } = parseArgs(command);
  await printForecast(location, days);
  process.exit(0);
} else if (command === 'rain') {
  const { location } = parseArgs(command);
  await printRain(location);
  process.exit(0);
} else if (command === 'compare') {
  const { location } = parseArgs(command);
  await printCompare(location);
  process.exit(0);
} else if (command === 'help' || command === '--help') {
  printHelp();
  process.exit(0);
} else {
  console.log(`[${timestamp()}] Singapore Weather Agent started.`);
  console.log(`  Schedule  : ${CONFIG.schedule}`);
  console.log(`  Threshold : below ${CONFIG.threshold.minTemp}°C`);
  console.log(`  Alert to  : ${CONFIG.email.to}`);
  console.log('');

  checkWeather();

  cron.schedule(CONFIG.schedule, checkWeather, {
    timezone: 'Asia/Singapore',
  });
}
