import { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { LiveDetectionPage } from './pages/LiveDetectionPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelTestingPage } from './pages/ModelTestingPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SettingsPage } from './pages/SettingsPage';
import { useCamera } from './hooks/useCamera';
import { useLiveEmotion } from './hooks/useLiveEmotion';
import { ActiveTab, AppSettings, ModelStatus } from './types';
import { fetchHealth } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('live');
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>({
    selectedCameraId: '',
    showLandmarks: true,
    showConfidence: true,
    predictionFps: 10,
    predictionSmoothing: true,
    enableHistory: true,
    autoSaveSession: true,
    theme: 'dark',
  });

  // Camera Hook
  const {
    videoRef,
    stream,
    isActive: isCameraActive,
    error: cameraError,
    devices,
    startCamera,
    stopCamera,
    captureFrameBase64,
  } = useCamera(settings.selectedCameraId);

  // Live Emotion Hook
  const {
    session,
    faces,
    primaryFace,
    primaryFaceId,
    setPrimaryFaceId,
    modelAvailable,
    liveFps,
    sessionDuration,
    trendHistory,
    startSession,
    stopSession,
  } = useLiveEmotion(captureFrameBase64, isCameraActive, settings);

  // Initial Health & Model Status Check
  useEffect(() => {
    async function checkStatus() {
      try {
        const health = await fetchHealth();
        setModelStatus(health.model_status);
      } catch (err) {
        console.error('[App] Health check error:', err);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-900 font-sans text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveRecording={!!session}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          modelStatus={modelStatus}
          liveFps={liveFps}
          activeFaceCount={faces.length}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {activeTab === 'live' && (
            <LiveDetectionPage
              videoRef={videoRef}
              stream={stream}
              isCameraActive={isCameraActive}
              cameraError={cameraError}
              faces={faces}
              primaryFace={primaryFace}
              primaryFaceId={primaryFaceId}
              onSelectPrimary={setPrimaryFaceId}
              modelAvailable={modelAvailable}
              liveFps={liveFps}
              session={session}
              sessionDuration={sessionDuration}
              trendHistory={trendHistory}
              settings={settings}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onStartSession={startSession}
              onStopSession={stopSession}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'history' && (
            <HistoryPage />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'testing' && (
            <ModelTestingPage />
          )}

          {activeTab === 'insights' && (
            <AIInsightsPage />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPage
              isCameraActive={isCameraActive}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              devices={devices}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
