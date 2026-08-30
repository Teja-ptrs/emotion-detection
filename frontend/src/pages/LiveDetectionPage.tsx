import React from 'react';
import { CameraFeed } from '../components/Live/CameraFeed';
import { EmotionCard } from '../components/Live/EmotionCard';
import { ProbabilityBar } from '../components/Live/ProbabilityBar';
import { MultiFaceList } from '../components/Live/MultiFaceList';
import { GeometricFeatures } from '../components/Live/GeometricFeatures';
import { SessionControls } from '../components/Live/SessionControls';
import { EmotionTrendChart } from '../components/Charts/EmotionTrendChart';
import { FaceDetectionResult, Session, EmotionTrendPoint, AppSettings } from '../types';
import { Activity, Smile, Users, Clock } from 'lucide-react';

interface LiveDetectionPageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isCameraActive: boolean;
  cameraError: string | null;
  faces: FaceDetectionResult[];
  primaryFace: FaceDetectionResult | null;
  primaryFaceId: number | null;
  onSelectPrimary: (faceId: number) => void;
  modelAvailable: boolean;
  liveFps: number;
  session: Session | null;
  sessionDuration: number;
  trendHistory: EmotionTrendPoint[];
  settings: AppSettings;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartSession: (notes?: string) => Promise<any>;
  onStopSession: () => Promise<any>;
}

export const LiveDetectionPage: React.FC<LiveDetectionPageProps> = ({
  videoRef,
  stream,
  isCameraActive,
  cameraError,
  faces,
  primaryFace,
  primaryFaceId,
  onSelectPrimary,
  modelAvailable,
  session,
  sessionDuration,
  trendHistory,
  settings,
  onStartCamera,
  onStopCamera,
  onStartSession,
  onStopSession,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Emotion</p>
            <h4 className="text-base font-extrabold text-white">
              {primaryFace ? primaryFace.emotion : '--'}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confidence</p>
            <h4 className="text-base font-extrabold text-white">
              {primaryFace ? `${Math.round(primaryFace.confidence * 100)}%` : '--'}
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faces Detected</p>
            <h4 className="text-base font-extrabold text-white">{faces.length}</h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Session Time</p>
            <h4 className="text-base font-extrabold text-white font-mono">{formatTime(sessionDuration)}</h4>
          </div>
        </div>
      </div>

      {/* Main Real-Time Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Video Stream & Session Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <CameraFeed
            videoRef={videoRef}
            stream={stream}
            isActive={isCameraActive}
            error={cameraError}
            faces={faces}
            showLandmarks={settings.showLandmarks}
            showConfidence={settings.showConfidence}
            modelAvailable={modelAvailable}
            onStartCamera={onStartCamera}
            onStopCamera={onStopCamera}
          />
          <SessionControls
            session={session}
            sessionDuration={sessionDuration}
            onStartSession={onStartSession}
            onStopSession={onStopSession}
            isCameraActive={isCameraActive}
          />
          <MultiFaceList
            faces={faces}
            primaryFaceId={primaryFaceId}
            onSelectPrimary={onSelectPrimary}
            modelAvailable={modelAvailable}
          />
        </div>

        {/* Right Inference & Geometry Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <EmotionCard
            primaryFace={primaryFace}
            modelAvailable={modelAvailable}
          />
          <ProbabilityBar
            probabilities={primaryFace?.probabilities}
            modelAvailable={modelAvailable}
          />
          <GeometricFeatures
            features={primaryFace?.geometric_features}
          />
        </div>
      </div>

      {/* Bottom Live Trend Time-Series */}
      <div className="w-full">
        <EmotionTrendChart
          data={trendHistory}
          title="Live Emotion Trend Stream"
        />
      </div>
    </div>
  );
};
