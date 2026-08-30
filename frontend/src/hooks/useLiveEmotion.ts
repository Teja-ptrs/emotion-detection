import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetectionResult, PredictionResponse, Session, EmotionTrendPoint, AppSettings } from '../types';
import { startSession as apiStartSession, stopSession as apiStopSession, predictFrame } from '../services/api';
import { LiveStreamClient } from '../services/websocket';

export function useLiveEmotion(
  captureFrameBase64: () => string | null,
  isCameraActive: boolean,
  settings: AppSettings
) {
  const [session, setSession] = useState<Session | null>(null);
  const [faces, setFaces] = useState<FaceDetectionResult[]>([]);
  const [primaryFaceId, setPrimaryFaceId] = useState<number | null>(null);
  const [modelAvailable, setModelAvailable] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [liveFps, setLiveFps] = useState<number>(0);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [trendHistory, setTrendHistory] = useState<EmotionTrendPoint[]>([]);

  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const intervalIdRef = useRef<any>(null);
  const sessionTimerRef = useRef<any>(null);
  const wsClientRef = useRef<LiveStreamClient | null>(null);
  const isSendingFrameRef = useRef<boolean>(false);

  // Handle new incoming prediction response
  const handlePredictionResult = useCallback((res: PredictionResponse) => {
    setModelAvailable(res.model_available);
    setStatusMessage(res.status_message);
    setFaces(res.faces);

    // Compute FPS
    frameCountRef.current += 1;
    const now = performance.now();
    if (now - lastFpsTimeRef.current >= 1000) {
      setLiveFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
      frameCountRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    if (res.faces && res.faces.length > 0) {
      // Pick or maintain primary face
      let currentPrimary = res.faces.find((f) => f.face_id === primaryFaceId) || res.faces[0];
      if (!primaryFaceId || !res.faces.some((f) => f.face_id === primaryFaceId)) {
        setPrimaryFaceId(currentPrimary.face_id);
      }

      // Add to rolling trend history for live graph (max 60 points)
      const probs = currentPrimary.probabilities || {};
      const newPoint: EmotionTrendPoint = {
        timestamp: new Date().toLocaleTimeString(),
        face_identifier: currentPrimary.face_identifier,
        emotion: currentPrimary.emotion,
        confidence: currentPrimary.confidence,
        Happy: probs['Happy'] || 0,
        Sad: probs['Sad'] || 0,
        Angry: probs['Angry'] || 0,
        Fear: probs['Fear'] || 0,
        Surprise: probs['Surprise'] || 0,
        Neutral: probs['Neutral'] || 0,
        Disgust: probs['Disgust'] || 0,
      };

      setTrendHistory((prev) => {
        const next = [...prev, newPoint];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    } else {
      // No face detected
      if (res.model_available) {
        setStatusMessage('No face detected.');
      }
    }
  }, [primaryFaceId]);

  // WebSocket initialization
  useEffect(() => {
    const ws = new LiveStreamClient(
      (res) => {
        isSendingFrameRef.current = false;
        handlePredictionResult(res);
      },
      (err) => {
        console.warn('[useLiveEmotion] WebSocket fallback to HTTP:', err);
        isSendingFrameRef.current = false;
      }
    );
    ws.connect();
    wsClientRef.current = ws;

    return () => {
      ws.disconnect();
    };
  }, [handlePredictionResult]);

  // Frame streaming loop
  useEffect(() => {
    if (!isCameraActive) {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      setFaces([]);
      setLiveFps(0);
      return;
    }

    const intervalMs = Math.max(50, Math.floor(1000 / (settings.predictionFps || 10)));

    intervalIdRef.current = setInterval(async () => {
      if (isSendingFrameRef.current) return;

      const frameBase64 = captureFrameBase64();
      if (!frameBase64) return;

      const payload = {
        image_base64: frameBase64,
        session_uuid: session?.session_uuid,
        smoothing: settings.predictionSmoothing,
        return_landmarks: settings.showLandmarks,
        save_record: settings.enableHistory && !!session,
      };

      isSendingFrameRef.current = true;

      // Try WebSocket first
      if (wsClientRef.current && wsClientRef.current.isOpen) {
        const sent = wsClientRef.current.sendFrame(payload);
        if (sent) return;
      }

      // HTTP Fallback
      try {
        const res = await predictFrame(payload);
        handlePredictionResult(res);
      } catch (e: any) {
        console.error('[useLiveEmotion] HTTP prediction error:', e);
      } finally {
        isSendingFrameRef.current = false;
      }
    }, intervalMs);

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [
    isCameraActive,
    settings.predictionFps,
    settings.predictionSmoothing,
    settings.showLandmarks,
    settings.enableHistory,
    session,
    captureFrameBase64,
    handlePredictionResult,
  ]);

  // Session duration timer
  useEffect(() => {
    if (session && isCameraActive) {
      const startTime = new Date(session.started_at).getTime();
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionDuration(Math.max(0, elapsed));
      }, 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (!session) setSessionDuration(0);
    }

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [session, isCameraActive]);

  // Start Session
  const handleStartSession = async (notes?: string) => {
    try {
      const newSession = await apiStartSession(notes);
      setSession(newSession);
      setTrendHistory([]);
      return newSession;
    } catch (e: any) {
      console.error('[useLiveEmotion] Start session failed:', e);
      throw e;
    }
  };

  // Stop Session
  const handleStopSession = async () => {
    if (!session) return null;
    try {
      const stopped = await apiStopSession(session.session_uuid);
      setSession(null);
      return stopped;
    } catch (e: any) {
      console.error('[useLiveEmotion] Stop session failed:', e);
      setSession(null);
      return null;
    }
  };

  const primaryFace = faces.find((f) => f.face_id === primaryFaceId) || faces[0] || null;

  return {
    session,
    faces,
    primaryFace,
    primaryFaceId,
    setPrimaryFaceId,
    modelAvailable,
    statusMessage,
    liveFps,
    sessionDuration,
    trendHistory,
    startSession: handleStartSession,
    stopSession: handleStopSession,
  };
}
