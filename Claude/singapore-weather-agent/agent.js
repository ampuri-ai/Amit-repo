'use strict';

require('dotenv').config();

const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  location: {
    latitude: 1.3521,
    longitude: 103.8198,
    name: 'Singapore',
  },
  threshold: {
    minTemp: 30,          // °C — alert if temperature drops below this
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
};
// ──────────────────────────────────────────────────────────────────────────────

let lastAlertSent = null;

function timestamp() {
  return new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
}

async function fetchTemperature() {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const { data } = await axios.get(url, {
    params: {
      latitude:  CONFIG.location.latitude,
      longitude: CONFIG.location.longitude,
      current:   'temperature_2m',
      timezone:  'Asia/Singapore',
    },
    timeout: 10000,
  });
  return data.current.temperature_2m;
}

async function sendAlert(temp) {
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
    subject: `[Weather Alert] Singapore temp dropped to ${temp}°C`,
    text: [
      `Temperature alert for ${CONFIG.location.name}`,
      ``,
      `Current temperature : ${temp}°C`,
      `Alert threshold      : below ${CONFIG.threshold.minTemp}°C`,
      `Checked at           : ${timestamp()}`,
    ].join('\n'),
  });
}

function cooldownElapsed() {
  if (!lastAlertSent) return true;
  const minutesSince = (Date.now() - lastAlertSent) / 60000;
  return minutesSince >= CONFIG.alertCooldownMinutes;
}

async function checkWeather() {
  try {
    const temp = await fetchTemperature();
    const status = temp < CONFIG.threshold.minTemp ? 'BELOW THRESHOLD' : 'OK';
    console.log(`[${timestamp()}] ${CONFIG.location.name} temperature: ${temp}°C — ${status}`);

    if (temp < CONFIG.threshold.minTemp && cooldownElapsed()) {
      console.log(`[${timestamp()}] Sending alert email to ${CONFIG.email.to}...`);
      await sendAlert(temp);
      lastAlertSent = Date.now();
      console.log(`[${timestamp()}] Alert sent.`);
    }
  } catch (err) {
    console.error(`[${timestamp()}] ERROR: ${err.message}`);
  }
}

// Run immediately on startup, then on schedule
console.log(`[${timestamp()}] Singapore Weather Agent started.`);
console.log(`  Schedule  : ${CONFIG.schedule}`);
console.log(`  Threshold : below ${CONFIG.threshold.minTemp}°C`);
console.log(`  Alert to  : ${CONFIG.email.to}`);
console.log('');

checkWeather();

cron.schedule(CONFIG.schedule, checkWeather, {
  timezone: 'Asia/Singapore',
});
