import React, { useRef, useEffect } from 'react';
import { Camera, CameraOff, AlertTriangle, Cpu } from 'lucide-react';
import { FaceDetectionResult } from '../../types';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  faces: FaceDetectionResult[];
  showLandmarks: boolean;
  showConfidence: boolean;
  modelAvailable: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

const EMOTION_COLOR_MAP: Record<string, string> = {
  Happy: '#10B981',
  Neutral: '#9CA3AF',
  Surprise: '#F59E0B',
  Sad: '#3B82F6',
  Fear: '#8B5CF6',
  Angry: '#EF4444',
  Disgust: '#EC4899',
  MODEL_UNAVAILABLE: '#F59E0B',
};

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  stream,
  isActive,
  error,
  faces,
  showLandmarks,
  showConfidence,
  modelAvailable,
  onStartCamera,
  onStopCamera,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-attach active MediaStream when component mounts or tab is switched back
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && isActive) {
      video.srcObject = stream;
      const handleLoadedMetadata = () => {
        video.play().catch((e) => console.warn('[CameraFeed] Video play on metadata:', e));
      };
      video.onloadedmetadata = handleLoadedMetadata;
      video.play().catch((e) => console.warn('[CameraFeed] Immediate video play:', e));
      return () => {
        if (video) video.onloadedmetadata = null;
      };
    }
  }, [stream, isActive, videoRef]);

  // Render canvas overlays (Bounding Boxes, Face IDs, Emotions, Landmarks)
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const renderOverlay = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding boxes and landmarks for each detected face
        faces.forEach((face) => {
          const { x, y, width, height } = face.bounding_box;
          const color = EMOTION_COLOR_MAP[face.emotion] || '#6366F1';

          // 1. Draw Bounding Box with glow
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;

          // Rounded rectangle box
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 8);
          ctx.stroke();
          ctx.restore();

          // 2. Face Tag Header (Face ID + Emotion)
          ctx.save();
          const tagHeight = 26;
          const labelText = modelAvailable
            ? `${face.face_identifier} • ${face.emotion}${showConfidence ? ` ${Math.round(face.confidence * 100)}%` : ''}`
            : `${face.face_identifier} • Tracking Active`;

          ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const tagWidth = Math.max(110, textMetrics.width + 20);

          // Tag background
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, Math.max(0, y - tagHeight - 4), tagWidth, tagHeight, 6);
          ctx.fill();

          // Tag text
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, x + 10, Math.max(tagHeight - 8, y - 10));
          ctx.restore();

          // 3. Draw MediaPipe 468 Landmarks if enabled
          if (showLandmarks && face.landmarks_2d && face.landmarks_2d.length > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.75)'; // Neon Cyan
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
            ctx.lineWidth = 1;

            const pts = face.landmarks_2d;
            for (let i = 0; i < pts.length; i++) {
              const px = pts[i][0] * canvas.width;
              const py = pts[i][1] * canvas.height;

              // Draw point
              ctx.beginPath();
              ctx.arc(px, py, 1.2, 0, 2 * Math.PI);
              ctx.fill();
            }
            ctx.restore();
          }
        });
      }

      animFrameId = requestAnimationFrame(renderOverlay);
    };

    renderOverlay();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [faces, isActive, showLandmarks, showConfidence, modelAvailable]);

  return (
    <div className="relative w-full aspect-[4/3] bg-dark-900 rounded-2xl overflow-hidden border border-dark-700 shadow-2xl flex items-center justify-center group">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Canvas Drawing Overlay */}
      {isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />
      )}

      {/* Model Missing Alert Overlay */}
      {!modelAvailable && isActive && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-amber-950/90 border border-amber-500/50 backdrop-blur-md px-4 py-3 rounded-xl flex items-center space-x-3 shadow-xl">
          <Cpu className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-200 uppercase tracking-wide">Emotion Model Not Available</h4>
            <p className="text-amber-300/80">Face tracking and landmark detection remain active. Train the model to enable emotion recognition.</p>
          </div>
        </div>
      )}

      {/* Inactive State / Camera Off CTA */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-20 h-20 rounded-3xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-4 shadow-xl text-slate-400 group-hover:text-brand-primary transition-colors">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Live Camera Feed</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            Activate your webcam to enable real-time face detection, 468-point landmark geometry extraction, and CNN emotion recognition.
          </p>
          <button
            onClick={onStartCamera}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-brand-primary/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>Start Live Camera</span>
          </button>
        </div>
      )}

      {/* Camera Error Message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-red-950/90 border border-red-500/50 backdrop-blur-md px-4 py-3 rounded-xl flex items-center space-x-3 text-red-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Floating Controls */}
      {isActive && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onStopCamera}
            className="px-3.5 py-2 rounded-xl bg-dark-800/90 hover:bg-dark-700 text-red-400 border border-dark-600 text-xs font-semibold backdrop-blur-md flex items-center space-x-2 shadow-lg transition-all"
          >
            <CameraOff className="w-3.5 h-3.5" />
            <span>Stop Camera</span>
          </button>
        </div>
      )}
    </div>
  );
};
