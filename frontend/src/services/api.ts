import {
  SystemHealth,
  ModelStatus,
  Session,
  PredictionResponse,
  EmotionRecord,
  AnalyticsOverview,
  EmotionTrendsResponse,
  AIInsightResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') + '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const res = await fetch(`${API_BASE}/model/status`);
  if (!res.ok) throw new Error(`Model status check failed: ${res.statusText}`);
  return res.json();
}

export async function startSession(notes?: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(`Failed to start session: ${res.statusText}`);
  return res.json();
}

export async function stopSession(sessionUuid: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/session/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_uuid: sessionUuid }),
  });
  if (!res.ok) throw new Error(`Failed to stop session: ${res.statusText}`);
  return res.json();
}

export async function predictFrame(payload: {
  image_base64: string;
  session_uuid?: string;
  smoothing?: boolean;
  return_landmarks?: boolean;
  save_record?: boolean;
}): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/emotion/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Prediction error: ${res.statusText}`);
  return res.json();
}

export async function predictImageFile(file: File, smoothing = false, returnLandmarks = true): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('smoothing', String(smoothing));
  formData.append('return_landmarks', String(returnLandmarks));

  const res = await fetch(`${API_BASE}/emotion/predict-file`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Image prediction failed: ${res.statusText}`);
  return res.json();
}

export async function fetchHistory(params?: {
  session_uuid?: string;
  emotion?: string;
  page?: number;
  page_size?: number;
}): Promise<{ total_records: number; page: number; page_size: number; records: EmotionRecord[] }> {
  const query = new URLSearchParams();
  if (params?.session_uuid) query.append('session_uuid', params.session_uuid);
  if (params?.emotion) query.append('emotion', params.emotion);
  if (params?.page) query.append('page', String(params.page));
  if (params?.page_size) query.append('page_size', String(params.page_size));

  const res = await fetch(`${API_BASE}/history?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.statusText}`);
  return res.json();
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/history/sessions`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
  return res.json();
}

export async function deleteSession(sessionUuid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history/session/${sessionUuid}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.statusText}`);
}

export async function deleteAllHistory(): Promise<void> {
  const res = await fetch(`${API_BASE}/history`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete history: ${res.statusText}`);
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  return res.json();
}

export async function fetchTrends(params?: { session_uuid?: string; time_window?: string }): Promise<EmotionTrendsResponse> {
  const query = new URLSearchParams();
  if (params?.session_uuid) query.append('session_uuid', params.session_uuid);
  if (params?.time_window) query.append('time_window', params.time_window);

  const res = await fetch(`${API_BASE}/analytics/trends?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch trends: ${res.statusText}`);
  return res.json();
}

export async function fetchInsights(sessionUuid?: string): Promise<AIInsightResponse> {
  const query = new URLSearchParams();
  if (sessionUuid) query.append('session_uuid', sessionUuid);

  const res = await fetch(`${API_BASE}/insights?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch insights: ${res.statusText}`);
  return res.json();
}
