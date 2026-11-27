import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

// Deployed on Vercel (see server/vercel.json) — works from any network, no
// LAN IP / firewall / Wi-Fi client-isolation issues like a self-hosted
// dev server would have.
export const API_ORIGIN = 'https://vanarisbackend.vercel.app';
export const API_BASE = `${API_ORIGIN}/api`;
export const MODEL_URL = `${API_ORIGIN}/models/drone_firefighter.glb`;

export function resolveImageUri(image: string | null | undefined): string | null {
  if (!image) return null;
  return image.startsWith('http') || image.startsWith('data:') ? image : `${API_ORIGIN}${image}`;
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

// Serverless functions (Vercel) cap the request body at ~4.5MB — routing
// photos through our own API would break on anything but a tiny image, so
// the client uploads straight to Vercel Blob instead and only the resulting
// URL ever reaches our API.
//
// The official `@vercel/blob/client` package can't be used here — it pulls
// in `@vercel/oidc` -> `jose`, which imports Node's `node:buffer` and fails
// to bundle under Metro. This hand-rolls the same wire protocol instead
// (reverse-engineered from the SDK's own source): get a one-time client
// token from our server, then PUT the file straight to Blob storage with it.
async function getBlobClientToken(pathname: string): Promise<string> {
  const res = await fetch(`${API_BASE}/blob-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: { pathname, clientPayload: authToken ?? '', multipart: false },
    }),
  });
  if (!res.ok) throw new Error('Could not start the upload. Check your connection and try again.');
  const { clientToken } = await res.json();
  return clientToken;
}

export async function uploadImage(uri: string, mimeType: string): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const pathname = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const clientToken = await getBlobClientToken(pathname);
  // vercel_blob_client_<storeId>_<...> — the store id Vercel's Blob API
  // expects as a header alongside the bearer token.
  const storeId = clientToken.split('_')[3] ?? '';

  const res = await expoFetch(`https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`, {
    method: 'PUT',
    body: new File(uri),
    headers: {
      Authorization: `Bearer ${clientToken}`,
      'x-vercel-blob-access': 'public',
      'x-content-type': mimeType,
      'x-vercel-blob-store-id': storeId,
      'x-api-version': '13',
    },
  });
  if (!res.ok) {
    throw new Error('Could not upload the image. Check your connection and try again.');
  }
  const data = await res.json();
  return data.url;
}

export type DroneStatus = 'patrolling' | 'charging' | 'standby' | 'returning';

export type Drone = {
  id: string;
  name: string;
  tagline: string;
  status: DroneStatus;
  image: string | null;
  badge: string | null;
  model: string;
};

export type DroneInput = {
  name: string;
  tagline: string;
  status: DroneStatus;
  badge?: string | null;
  image?: string | null;
};

export type SpecItem = { label: string; value: string };
export type Spec = { id: string; title: string; subtitle: string; items: SpecItem[] };

export type Telemetry = {
  droneId: string;
  droneName: string;
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  speed: number;
  battery: number;
  water: { current: number; max: number; unit: string };
  updatedAt: string;
};

export type FireAlert = {
  id: string;
  droneId: string | null;
  droneName: string;
  title: string;
  severity: 'low' | 'moderate' | 'high';
  lat: number;
  lng: number;
  image: string;
  detectedAt: string;
};

export type FireReport = {
  id: string;
  userId: string;
  title: string;
  image: string | null;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
};

export type FireReportInput = {
  title: string;
  lat: number;
  lng: number;
  image?: string | null;
};

export type User = { id: string; username: string; displayName: string; avatar: string | null };
export type AuthResponse = { token: string; user: User };
export type ProfileInput = {
  displayName?: string;
  password?: string;
  avatar?: string | null;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Can’t reach the server. Check your connection and try again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function jsonBody(data: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

export const api = {
  auth: {
    register: (data: { username: string; password: string; displayName: string }) =>
      request<AuthResponse>('/auth/register', { method: 'POST', ...jsonBody(data) }),
    login: (data: { username: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', ...jsonBody(data) }),
    me: () => request<User>('/auth/me'),
    updateMe: (data: ProfileInput) =>
      request<User>('/auth/me', { method: 'PUT', ...jsonBody(data) }),
  },
  getDrones: () => request<Drone[]>('/drones'),
  getDrone: (id: string) => request<Drone>(`/drones/${id}`),
  createDrone: (data: DroneInput) => request<Drone>('/drones', { method: 'POST', ...jsonBody(data) }),
  updateDrone: (id: string, data: DroneInput) =>
    request<Drone>(`/drones/${id}`, { method: 'PUT', ...jsonBody(data) }),
  deleteDrone: (id: string) => request<void>(`/drones/${id}`, { method: 'DELETE' }),
  getSpecs: () => request<Spec[]>('/specs'),
  getSpec: (id: string) => request<Spec>(`/specs/${id}`),
  getTelemetry: () => request<Telemetry[]>('/telemetry'),
  getDroneTelemetry: (droneId: string) => request<Telemetry>(`/telemetry/${droneId}`),
  getAlerts: () => request<FireAlert[]>('/alerts'),
  getAlert: (id: string) => request<FireAlert>(`/alerts/${id}`),
  getFireReports: () => request<FireReport[]>('/fire-reports'),
  getFireReport: (id: string) => request<FireReport>(`/fire-reports/${id}`),
  createFireReport: (data: FireReportInput) =>
    request<FireReport>('/fire-reports', { method: 'POST', ...jsonBody(data) }),
  updateFireReport: (id: string, data: FireReportInput) =>
    request<FireReport>(`/fire-reports/${id}`, { method: 'PUT', ...jsonBody(data) }),
  deleteFireReport: (id: string) => request<void>(`/fire-reports/${id}`, { method: 'DELETE' }),
};
