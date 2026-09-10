import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { api } from '../../../../services/api';
import { 
  Camera, 
  X, 
  Flashlight, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Upload,
  RefreshCw,
  FileEdit,
  Plus
} from 'lucide-react';

interface LiveBarcodeScannerProps {
  onScanSuccess: (decodedBarcode: string) => void;
  onManualEntry?: () => void;
  onClose: () => void;
}

export const LiveBarcodeScanner: React.FC<LiveBarcodeScannerProps> = ({
  onScanSuccess,
  onManualEntry,
  onClose
}) => {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isFileScanning, setIsFileScanning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'packsure-live-barcode-reader';
  const hasTriggeredRef = useRef(false);

  // Sound synthesizer for realistic scanner beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted or unavailable
    }
  };

  const triggerHaptic = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {
      // Vibration not supported
    }
  };

  const handleDetected = useCallback((barcode: string) => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    setScannedCode(barcode);
    playBeep();
    triggerHaptic();

    // Stop scanner and call parent
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        setTimeout(() => {
          onScanSuccess(barcode);
        }, 500);
      });
    } else {
      setTimeout(() => {
        onScanSuccess(barcode);
      }, 500);
    }
  }, [onScanSuccess]);

  // Initialize camera list and start scanning
  useEffect(() => {
    let isMounted = true;
    hasTriggeredRef.current = false;

    const initScanner = async () => {
      try {
        setErrorMsg(null);
        const scannerInstance = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
        scannerRef.current = scannerInstance;

        // Query available video input devices
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if available
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);

          await startScanning(scannerInstance, chosenId);
        } else {
          // Fallback to facingMode constraint directly
          await startScanning(scannerInstance, { facingMode: 'environment' });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Camera initiation issue:', err);
        const msg = err?.message || String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
          setErrorMsg('No camera device found on this system. You can enter the barcode manually or upload a photo.');
        } else {
          setErrorMsg('Could not access camera feed. You can enter the barcode manually or upload an image below.');
        }
      }
    };

    const startScanning = async (scanner: Html5Qrcode, cameraTarget: any) => {
      try {
        await scanner.start(
          cameraTarget,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(minDim * 0.85),
                height: Math.floor(minDim * 0.55)
              };
            }
          },
          (decodedText) => {
            handleDetected(decodedText);
          },
          () => {
            // Frame scanned, no barcode found in this frame
          }
        );

        if (isMounted) {
          setScannerStarted(true);

          // Check if torch/flashlight is supported
          try {
            const capabilities: any = scanner.getRunningTrackCapabilities();
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          } catch {
            setTorchSupported(false);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg('Failed to start live camera feed. Please check camera permissions.');
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
          });
        } else {
          try {
            scannerRef.current.clear();
          } catch {}
        }
      }
    };
  }, [handleDetected]);

  // Switch camera
  const handleSwitchCamera = async (newId: string) => {
    if (!scannerRef.current) return;
    try {
      setSelectedCameraId(newId);
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        newId,
        {
          fps: 15,
          qrbox: (w, h) => ({
            width: Math.floor(Math.min(w, h) * 0.85),
            height: Math.floor(Math.min(w, h) * 0.55)
          })
        },
        handleDetected,
        () => {}
      );
    } catch {
      setErrorMsg('Failed to switch camera device.');
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  // Scan from photo file
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsFileScanning(true);
    setErrorMsg(null);

    try {
      // 1. First attempt in-browser scan with all formats enabled
      let clientDecoded: string | null = null;
      try {
        const fileScanner = new Html5Qrcode('packsure-file-barcode-temp', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
        const result = await fileScanner.scanFile(file, true);
        fileScanner.clear();
        if (result && result.trim()) {
          clientDecoded = result.trim();
        }
      } catch {
        // Fall through to backend multi-angle scanner
      }

      if (clientDecoded) {
        handleDetected(clientDecoded);
        return;
      }

      // 2. High-precision fallback via native C++ zxing-cpp + 4-way rotation
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.scanBarcodeImage(formData);

      if (res && res.success && res.barcode) {
        handleDetected(res.barcode);
      } else {
        setErrorMsg(res.message || 'No barcode recognized in the uploaded photo. Please ensure the barcode is clear and unblurred.');
      }
    } catch (err: any) {
      setErrorMsg('No barcode recognized in the uploaded photo. Ensure the barcode is clear and unblurred.');
    } finally {
      setIsFileScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F172A] text-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 flex-wrap">
                <span>Live Barcode Scanner</span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  EAN-13 / UPC
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Point camera at barcode or add product details manually
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onManualEntry) onManualEntry();
                else onClose();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Add details manually"
            >
              <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Add Manually</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder View */}
        <div className="relative bg-black flex-1 min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={containerId} className="w-full h-full min-h-[320px]" />

          {/* Hidden element for file scanning */}
          <div id="packsure-file-barcode-temp" className="hidden" />

          {/* Animated Futuristic Laser & Reticle Overlay */}
          {scannerStarted && !scannedCode && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Target Frame Box */}
              <div className="relative w-[75%] max-w-[280px] h-[160px] border-2 border-dashed border-cyan-400/60 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                {/* Sweeping Laser Line */}
                <div 
                  className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee]"
                  style={{
                    animation: 'scanLaser 2.2s ease-in-out infinite'
                  }}
                />

                <span className="text-[10px] font-mono tracking-widest text-cyan-300/80 uppercase bg-black/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
                  Align Barcode in Frame
                </span>
              </div>

              {/* Floating manual fallback pill */}
              <div className="mt-4 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (onManualEntry) onManualEntry();
                    else onClose();
                  }}
                  className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white rounded-full text-[11px] font-medium transition cursor-pointer backdrop-blur-sm shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Can't scan? Add details manually</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Overlay on Detected */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 z-20 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                  Barcode Scanned Successfully!
                </span>
                <div className="text-2xl font-mono font-extrabold text-white mt-1">
                  {scannedCode}
                </div>
              </div>
              <p className="text-xs text-emerald-200/80">
                Fetching verified product specifications...
              </p>
            </div>
          )}

          {/* Error / Fallback Card */}
          {errorMsg && (
            <div className="absolute inset-x-4 top-4 p-3.5 bg-red-950/95 border border-red-500/50 rounded-xl text-red-200 text-xs flex flex-col gap-2 z-20 shadow-xl">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-red-100">Cannot Scan Barcode</p>
                  <p className="text-[11px] leading-relaxed text-red-300">{errorMsg}</p>
                </div>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (onManualEntry) onManualEntry();
                    else onClose();
                  }}
                  className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>New Product — Add details manually</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Laser Animation Keyframe Style */}
        <style>{`
          @keyframes scanLaser {
            0% { top: 12%; opacity: 0.7; }
            50% { top: 86%; opacity: 1; }
            100% { top: 12%; opacity: 0.7; }
          }
        `}</style>

        {/* Footer Controls & Alternative Upload */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
            {/* Camera Switcher */}
            {cameras.length > 1 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <RotateCcw className="w-3.5 h-3.5" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-cyan-400"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Torch Toggle */}
            {torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Torch On' : 'Torch Off'}</span>
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {/* Manual Entry Button */}
              <button
                type="button"
                onClick={() => {
                  if (onManualEntry) onManualEntry();
                  else onClose();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                <FileEdit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Details Manually</span>
              </button>

              {/* Scan from Photo Option */}
              <label className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1.5">
                {isFileScanning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isFileScanning ? 'Analyzing...' : 'Scan from Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileScan}
                  disabled={isFileScanning}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <span>Supported Standards: EAN-13, EAN-8, UPC-A, Code-128, GS1 Databar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
