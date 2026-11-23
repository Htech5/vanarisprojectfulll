import { upload } from '@vercel/blob/client';

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
// photos through our own API would break on anything but a tiny image.
// Instead the client uploads straight to Vercel Blob (this JWT authorizes
// the one-time upload token) and only the resulting URL ever reaches our API.
export async function uploadImage(uri: string, mimeType: string): Promise<string> {
  const file = await (await fetch(uri)).blob();
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const result = await upload(`uploads/${Date.now()}.${ext}`, file, {
    access: 'public',
    handleUploadUrl: `${API_BASE}/blob-upload`,
    clientPayload: authToken ?? '',
    contentType: mimeType,
  });
  return result.url;
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
