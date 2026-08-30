import React, { useState, useRef } from 'react';
import { predictImageFile } from '../services/api';
import { PredictionResponse, FaceDetectionResult } from '../types';
import { ProbabilityBar } from '../components/Live/ProbabilityBar';
import { GeometricFeatures } from '../components/Live/GeometricFeatures';
import { 
  FlaskConical, 
  UploadCloud, 
  Image as ImageIcon, 
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';

export const ModelTestingPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleRunInference = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const res = await predictImageFile(selectedFile);
      setResult(res);
      if (res.faces && res.faces.length > 0) {
        setSelectedFaceId(res.faces[0].face_id);
      }
    } catch (err: any) {
      console.error('[ModelTestingPage] Inference error:', err);
      setError(err.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const currentFace: FaceDetectionResult | null =
    result?.faces.find((f) => f.face_id === selectedFaceId) || result?.faces[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-1">
          <FlaskConical className="w-4 h-4" />
          <span>Offline Evaluation & Testing</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          CNN Model Image Testing Pipeline
        </h2>
        <p className="text-xs text-slate-400 max-w-xl mt-1">
          Upload custom static images to test face detection, landmark geometry, and CNN softmax classification on unseen test samples.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Upload & Image Preview Section (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Upload Test Image</h3>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-dark-600 hover:border-brand-primary rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-dark-900/40"
            >
              <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-brand-primary transition-colors mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                Click to browse or drop an image file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, WEBP</p>
            </div>

            {previewUrl && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-dark-700 bg-dark-900 aspect-video flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <button
                  onClick={handleRunInference}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-brand-primary/25 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Running Detection & CNN...' : 'Run Emotion Inference'}</span>
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Inference Results Section (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {!result ? (
            <div className="p-12 rounded-3xl bg-dark-800 border border-dark-700 shadow-xl flex flex-col items-center justify-center text-center text-slate-500 text-xs h-full min-h-[300px]">
              <ImageIcon className="w-12 h-12 mb-3 text-slate-600" />
              <h4 className="font-semibold text-slate-400">No Inference Results</h4>
              <p className="mt-1">Upload an image and run inference to inspect CNN predictions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Multi-Face Picker if image has >1 faces */}
              {result.faces.length > 1 && (
                <div className="p-4 rounded-2xl bg-dark-800 border border-dark-700 shadow-lg flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs text-slate-300 font-bold">Select Detected Face:</span>
                  <div className="flex items-center space-x-2 ml-auto">
                    {result.faces.map((f) => (
                      <button
                        key={f.face_id}
                        onClick={() => setSelectedFaceId(f.face_id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          f.face_id === selectedFaceId
                            ? 'bg-brand-primary text-white'
                            : 'bg-dark-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.face_identifier} ({f.emotion})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentFace ? (
                <>
                  {/* Primary Result Banner */}
                  <div className="p-5 rounded-2xl bg-dark-800 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-dark-900 text-slate-300 border border-dark-700">
                        {currentFace.face_identifier}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">
                        Confidence: {Math.round(currentFace.confidence * 100)}%
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white">
                      Predicted: <span className="text-emerald-400">{currentFace.emotion}</span>
                    </h3>
                  </div>

                  {/* Probabilities */}
                  <ProbabilityBar
                    probabilities={currentFace.probabilities}
                    modelAvailable={result.model_available}
                  />

                  {/* Geometric Features */}
                  <GeometricFeatures
                    features={currentFace.geometric_features}
                  />
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-dark-800 border border-dark-700 text-center text-xs text-slate-400">
                  {result.status_message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
