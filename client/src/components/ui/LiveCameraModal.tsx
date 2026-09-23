import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCw, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Sliders
} from 'lucide-react';

interface LiveCameraModalProps {
  title?: string;
  subtitle?: string;
  instruction?: string;
  surfaceLabel?: string;
  panelName?: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  title = 'Capture Packaging Evidence',
  subtitle,
  instruction,
  surfaceLabel,
  panelName,
  onCapture,
  onClose
}) => {
  const displaySubtitle = instruction || subtitle || 'Position the packaging inside the frame and ensure good lighting';
  const displaySurface = panelName || surfaceLabel || 'Panel';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [streamResolution, setStreamResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isShutterEffect, setIsShutterEffect] = useState(false);

  // Play realistic shutter audio
  const playShutterSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio context might be restricted
    }
  };

  // Stop current active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Start video stream with chosen or default device
  const startCamera = useCallback(async (deviceId?: string) => {
    stopStream();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: deviceId ? undefined : { ideal: 'environment' }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setStreamResolution({ width: settings.width, height: settings.height });
        }
      }

      // Enumerate available video input devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (!deviceId && videoDevices.length > 0) {
        const activeTrack = stream.getVideoTracks()[0];
        const activeSettings = activeTrack.getSettings();
        setSelectedDeviceId(activeSettings.deviceId || videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera stream error:', err);
      let msg = 'Unable to access laptop or device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission denied. Please allow camera access in your browser settings to take photos.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No video camera detected on your system. Please plug in a webcam or upload a file.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application. Please close other camera apps and retry.';
      }
      setCameraError(msg);
      setIsStreaming(false);
    }
  }, [stopStream]);

  // Initial camera startup
  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
      if (capturedBlobUrl) {
        URL.revokeObjectURL(capturedBlobUrl);
      }
    };
  }, []);

  // Handle Switch Camera
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  // Capture Snapshot from video feed
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual shutter flash & sound
    setIsShutterEffect(true);
    playShutterSound();
    setTimeout(() => setIsShutterEffect(false), 200);

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_capture_${displaySurface.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      const blobUrl = URL.createObjectURL(blob);
      setCapturedFile(file);
      setCapturedBlobUrl(blobUrl);
    }, 'image/jpeg', 0.95);
  };

  // Retake Snapshot
  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
    }
    setCapturedBlobUrl(null);
    setCapturedFile(null);
  };

  // Confirm and upload
  const handleConfirm = () => {
    if (capturedFile) {
      stopStream();
      onCapture(capturedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{title}</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60">
                  {displaySurface}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{displaySubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative bg-black flex-1 min-h-[340px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          {/* Shutter White Flash Effect */}
          {isShutterEffect && (
            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 animate-out fade-out" />
          )}

          {cameraError ? (
            <div className="p-6 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Camera Access Required</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(selectedDeviceId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera Connection</span>
                </button>
              </div>
            </div>
          ) : capturedBlobUrl ? (
            /* Freeze & Review Screen */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedBlobUrl}
                alt="Captured packaging evidence"
                className="max-h-[380px] sm:max-h-[440px] w-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Snapshot Captured ({streamResolution.width} &times; {streamResolution.height} px)</span>
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Inspection Framing Overlay */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-contain bg-black max-h-[380px] sm:max-h-[440px]"
              />

              {/* Statutory Packaging Frame Guidelines Overlay */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border border-indigo-400/40 rounded-xl flex flex-col justify-between p-3">
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-indigo-400" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-indigo-400" />
                </div>
                <div className="text-center">
                  <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-200 px-3 py-1 rounded-full border border-white/10">
                    Align {surfaceLabel} within grid &bull; RapidOCR Ready
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-indigo-400" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-indigo-400" />
                </div>
              </div>

              {/* Real-time Telemetry badge */}
              {isStreaming && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{streamResolution.width ? `${streamResolution.width}x${streamResolution.height}` : 'LIVE'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Camera Device Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {devices.length > 1 && !capturedBlobUrl && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[200px] truncate"
                >
                  {devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {capturedBlobUrl ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Use Photo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    stopStream();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={!isStreaming || Boolean(cameraError)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Picture</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
