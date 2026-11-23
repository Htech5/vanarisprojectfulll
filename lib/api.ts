// Self-hosted API (server/index.js). Point this at your computer's LAN IP
// (run `ipconfig` on Windows, look for the Wi-Fi adapter's IPv4 address) —
// any phone or emulator on the same Wi-Fi network can then reach it. If you
// only ever test on the Android emulator, `adb reverse tcp:4000 tcp:4000`
// plus HOST = 'localhost' also works and skips the Wi-Fi/firewall step.
const HOST = '192.168.100.9';
export const API_ORIGIN = `http://${HOST}:4000`;
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
  imageUri?: string | null;
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

export type User = { id: string; username: string; displayName: string; avatar: string | null };
export type AuthResponse = { token: string; user: User };
export type ProfileInput = { displayName?: string; password?: string; avatarUri?: string | null };

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

function appendImage(form: FormData, field: string, uri: string) {
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  form.append(field, {
    uri,
    name: filename,
    type: ext === 'png' ? 'image/png' : 'image/jpeg',
  } as unknown as Blob);
}

function droneFormData({ name, tagline, status, badge, imageUri }: DroneInput): FormData {
  const form = new FormData();
  form.append('name', name);
  form.append('tagline', tagline);
  form.append('status', status);
  form.append('badge', badge ?? '');
  if (imageUri) appendImage(form, 'image', imageUri);
  return form;
}

function profileFormData({ displayName, password, avatarUri }: ProfileInput): FormData {
  const form = new FormData();
  if (displayName !== undefined) form.append('displayName', displayName);
  if (password) form.append('password', password);
  if (avatarUri) appendImage(form, 'avatar', avatarUri);
  return form;
}

export const api = {
  auth: {
    register: (data: { username: string; password: string; displayName: string }) =>
      request<AuthResponse>('/auth/register', { method: 'POST', ...jsonBody(data) }),
    login: (data: { username: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', ...jsonBody(data) }),
    me: () => request<User>('/auth/me'),
    updateMe: (data: ProfileInput) =>
      request<User>('/auth/me', { method: 'PUT', body: profileFormData(data) }),
  },
  getDrones: () => request<Drone[]>('/drones'),
  getDrone: (id: string) => request<Drone>(`/drones/${id}`),
  createDrone: (data: DroneInput) => request<Drone>('/drones', { method: 'POST', body: droneFormData(data) }),
  updateDrone: (id: string, data: DroneInput) =>
    request<Drone>(`/drones/${id}`, { method: 'PUT', body: droneFormData(data) }),
  deleteDrone: (id: string) => request<void>(`/drones/${id}`, { method: 'DELETE' }),
  getSpecs: () => request<Spec[]>('/specs'),
  getSpec: (id: string) => request<Spec>(`/specs/${id}`),
  getTelemetry: () => request<Telemetry[]>('/telemetry'),
  getDroneTelemetry: (droneId: string) => request<Telemetry>(`/telemetry/${droneId}`),
  getAlerts: () => request<FireAlert[]>('/alerts'),
  getAlert: (id: string) => request<FireAlert>(`/alerts/${id}`),
};
