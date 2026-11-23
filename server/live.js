// Simulated live telemetry + fire-detection feed, keyed per drone.
// Stateless by design: every value is a pure function of (droneId, time).
// No background interval, no in-memory state — required for serverless
// (Vercel) where a function instance isn't guaranteed to stay alive, and
// simpler everywhere else too.

const prisma = require('./lib/prisma');

// Patrol area: Central Kalimantan peatland (recurring wildfire hotspot).
const KALIMANTAN_BOUNDS = { latMin: -3.2, latMax: -0.3, lngMin: 111.0, lngMax: 115.5 };

/** Deterministic PRNG seeded from a string (mulberry32). */
function rngFromString(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drone flies a slow circular patrol loop around a per-drone random center. */
function telemetryFor(drone, now = Date.now()) {
  const rng = rngFromString(drone.id);
  const { latMin, latMax, lngMin, lngMax } = KALIMANTAN_BOUNDS;
  const centerLat = latMin + rng() * (latMax - latMin);
  const centerLng = lngMin + rng() * (lngMax - lngMin);
  const radius = 0.15 + rng() * 0.25;
  const phase = rng() * Math.PI * 2;
  const periodMs = (6 + rng() * 4) * 60 * 1000;

  const createdAt = new Date(drone.createdAt).getTime();
  const elapsed = Math.max(0, now - createdAt);
  const angle = phase + (elapsed / periodMs) * Math.PI * 2;

  const lat = centerLat + Math.cos(angle) * radius;
  const lng = centerLng + Math.sin(angle) * radius;
  const heading = (((angle + Math.PI / 2) * 180) / Math.PI + 360) % 360;
  const altitude = 110 + Math.sin(elapsed / 45000 + phase) * 30;
  const speed = 35 + Math.sin(elapsed / 30000 + phase) * 15;

  const batteryCycleMs = 20 * 60 * 1000;
  const battery = 100 - ((elapsed % batteryCycleMs) / batteryCycleMs) * 100;

  const waterCycleMs = 90 * 1000;
  const t = (elapsed + rng() * waterCycleMs) % waterCycleMs;
  const dropping = t < 20000;
  const water = { max: 20, unit: 'L', current: dropping ? Math.max(0, 20 - (t / 20000) * 20) : 20 };

  return {
    droneId: drone.id,
    droneName: drone.name,
    lat,
    lng,
    altitude,
    heading,
    speed,
    battery,
    water,
    dropping,
    updatedAt: new Date(now).toISOString(),
  };
}

// No-op: kept so routes/drones.js can call it unconditionally on delete.
function dropTelemetry() {}

async function getAllTelemetry() {
  const drones = await prisma.drone.findMany();
  return drones.map((d) => telemetryFor(d));
}

async function getTelemetry(droneId) {
  const drone = await prisma.drone.findUnique({ where: { id: droneId } });
  if (!drone) return null;
  return telemetryFor(drone);
}

const SEED_ALERT = {
  id: 'ft-001',
  droneId: null,
  droneName: 'FX1',
  title: 'Peat Surface Hotspot',
  severity: 'moderate',
  lat: -2.198,
  lng: 113.934,
  image: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Marking_the_Fire.jpg',
  detectedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
};

const ALERT_TITLES = ['Canopy Flare-Up', 'Peat Surface Hotspot', 'Smoke Plume Detected', 'Ground Fire Spread'];
// Real wildfire photos (Wikimedia Commons, public domain) instead of
// generic placeholder photos.
const ALERT_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/0/05/Huge_forest_fire_and_smoke.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/00/Wildfire_in_California.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/33/Trees_torching_-_High_Park_Wildfire.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/37/Lick_Fire_on_the_Umatilla_National_Forest_burning_at_night.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a4/Marking_the_Fire.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/e/e5/Borneo_fires_and_smoke%2C_2002.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/de/Burned_Peatland_in_Indonesia.jpg',
];
const FIVE_MIN_MS = 5 * 60 * 1000;

/** A fresh synthetic alert "detected" at bucket N (one per 5-minute window),
 * near wherever the picked drone's simulated telemetry was at that moment. */
function alertForBucket(bucket, drones) {
  if (drones.length === 0) return null;
  const rng = rngFromString(`bucket-${bucket}`);
  const source = drones[Math.floor(rng() * drones.length)];
  const t = telemetryFor(source, bucket * FIVE_MIN_MS);
  const jitter = () => (rng() - 0.5) * 0.08;
  return {
    id: `ft-${bucket}`,
    droneId: source.id,
    droneName: source.name,
    title: ALERT_TITLES[bucket % ALERT_TITLES.length],
    severity: ['low', 'moderate', 'high'][bucket % 3],
    lat: t.lat + jitter(),
    lng: t.lng + jitter(),
    image: ALERT_IMAGES[bucket % ALERT_IMAGES.length],
    detectedAt: new Date(bucket * FIVE_MIN_MS).toISOString(),
  };
}

async function getAlerts() {
  const drones = await prisma.drone.findMany();
  const nowBucket = Math.floor(Date.now() / FIVE_MIN_MS);
  const generated = [];
  for (let b = nowBucket; b > nowBucket - 19; b--) {
    const alert = alertForBucket(b, drones);
    if (alert) generated.push(alert);
  }
  return [SEED_ALERT, ...generated].slice(0, 20);
}

async function getAlert(id) {
  const all = await getAlerts();
  return all.find((a) => a.id === id);
}

module.exports = {
  getAllTelemetry,
  getTelemetry,
  dropTelemetry,
  getAlerts,
  getAlert,
};
