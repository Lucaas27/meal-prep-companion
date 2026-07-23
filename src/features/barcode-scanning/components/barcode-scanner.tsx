import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import { Camera, CameraOff, CheckCircle2, Flashlight, Focus, Keyboard, ScanLine, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { normalizeBarcode } from '@/features/external-catalogue/barcode';
import { cn } from '@/shared/lib/utils';
import { getBarcodeScannerErrorMessage, isDuplicateBarcode } from '../barcode-scanner-utils';

const SUPPORTED_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
];

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'detected' | 'error';
type ExperimentalMediaTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  focusMode?: string[];
};
type ExperimentalMediaTrackConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean;
  focusMode?: string;
};

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
  isOpen?: boolean;
}

export function BarcodeScanner({ onDetected, onCancel, isOpen = true }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const detectedRef = useRef(false);
  const lastBarcodeRef = useRef<string | null>(null);
  const lastDetectedAtRef = useRef(0);

  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [focusSupported, setFocusSupported] = useState(false);

  const inputId = useId();
  const canStartCamera = useMemo(() => !!(globalThis.isSecureContext && navigator.mediaDevices?.getUserMedia), []);
  const previewVisible = status === 'starting' || status === 'scanning';

  const stopTracks = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    if (stream && typeof stream === 'object' && 'getTracks' in stream && typeof stream.getTracks === 'function') {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setTorchEnabled(false);
    setTorchSupported(false);
    setFocusSupported(false);
    stopTracks();
  }, [stopTracks]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setStatus('idle');
      setErrorMessage(null);
      detectedRef.current = false;
    }
  }, [isOpen, stopScanner]);

  useEffect(() => () => stopScanner(), [stopScanner]);

  useEffect(() => {
    if (!isOpen) return;
    if (manualMode) {
      manualInputRef.current?.focus();
      return;
    }
    if (!previewVisible) {
      startButtonRef.current?.focus();
    }
  }, [isOpen, manualMode, previewVisible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDetected = useCallback((barcode: string) => {
    if (detectedRef.current) return;

    const now = Date.now();
    if (isDuplicateBarcode(lastBarcodeRef.current, barcode, lastDetectedAtRef.current, now)) {
      return;
    }

    detectedRef.current = true;
    lastBarcodeRef.current = barcode;
    lastDetectedAtRef.current = now;
    setStatus('detected');
    setErrorMessage(null);
    stopScanner();
    onDetected(barcode);
  }, [onDetected, stopScanner]);

  const handleStart = useCallback(async () => {
    setErrorMessage(null);
    setManualError('');
    detectedRef.current = false;
    setStatus('starting');

    try {
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 120,
        delayBetweenScanSuccess: 400,
      });
      reader.possibleFormats = SUPPORTED_FORMATS;
      readerRef.current = reader;

      const handleResult = (result: { getText: () => string } | undefined) => {
        if (!result) return;

        const normalized = normalizeBarcode(result.getText());
        if (!normalized) return;
        handleDetected(normalized);
      };

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      try {
        // ask for the rear camera and more pixels first; fall back once if the browser rejects the constraint set.
        controlsRef.current = await reader.decodeFromConstraints(constraints, videoRef.current ?? undefined, handleResult);
      } catch {
        controlsRef.current = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, handleResult);
      }

      const capabilities = controlsRef.current?.streamVideoCapabilitiesGet?.((track) => [track]) as ExperimentalMediaTrackCapabilities | undefined;
      const focusModes = Array.isArray(capabilities?.focusMode)
        ? capabilities.focusMode
        : [];
      setTorchSupported(!!controlsRef.current?.switchTorch || !!capabilities?.torch);
      setFocusSupported(focusModes.includes('continuous') || focusModes.includes('single-shot'));

      if (focusModes.includes('continuous')) {
        // ponytail: ask for continuous autofocus when the browser advertises it; manual refocus stays as the fallback.
        controlsRef.current?.streamVideoConstraintsApply?.({ advanced: [{ focusMode: 'continuous' } as ExperimentalMediaTrackConstraintSet] }, (track) => [track]);
      }

      setStatus('scanning');
    } catch (error) {
      stopScanner();
      setStatus('error');
      setErrorMessage(getBarcodeScannerErrorMessage(error));
    }
  }, [handleDetected, stopScanner]);

  const handleManualSubmit = useCallback(() => {
    const normalized = normalizeBarcode(manualBarcode);
    if (!normalized) {
      setManualError('Enter a valid EAN or UPC barcode.');
      return;
    }

    setManualError('');
    stopScanner();
    setStatus('detected');
    onDetected(normalized);
  }, [manualBarcode, onDetected, stopScanner]);

  const handleToggleTorch = useCallback(async () => {
    if (!controlsRef.current) return;
    const nextValue = !torchEnabled;

    try {
      if (controlsRef.current.switchTorch) {
        await controlsRef.current.switchTorch(nextValue);
      } else {
        controlsRef.current.streamVideoConstraintsApply?.({ advanced: [{ torch: nextValue } as ExperimentalMediaTrackConstraintSet] }, (track) => [track]);
      }
      setTorchEnabled(nextValue);
    } catch {
      setTorchEnabled(false);
      setErrorMessage('Torch control is not available on this device.');
    }
  }, [torchEnabled]);

  const handleRefocus = useCallback(() => {
    if (!controlsRef.current?.streamVideoCapabilitiesGet || !controlsRef.current.streamVideoConstraintsApply) return;

    const capabilities = controlsRef.current.streamVideoCapabilitiesGet((track) => [track]) as ExperimentalMediaTrackCapabilities;
    const focusModes = Array.isArray(capabilities?.focusMode)
      ? capabilities.focusMode
      : [];

    if (focusModes.includes('single-shot')) {
      controlsRef.current.streamVideoConstraintsApply({ advanced: [{ focusMode: 'single-shot' } as ExperimentalMediaTrackConstraintSet] }, (track) => [track]);
      return;
    }

    if (focusModes.includes('continuous')) {
      controlsRef.current.streamVideoConstraintsApply({ advanced: [{ focusMode: 'continuous' } as ExperimentalMediaTrackConstraintSet] }, (track) => [track]);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">EAN / UPC</Badge>
          {status === 'detected' && <Badge variant="secondary" className="text-[10px]">Detected</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Scan a barcode with your camera or enter it manually.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="relative overflow-hidden rounded-lg border bg-muted/20 aspect-[4/3]">
          <video
            ref={videoRef}
            className={cn('h-full w-full object-cover', previewVisible ? 'block' : 'hidden')}
            autoPlay
            muted
            playsInline
            aria-label="Barcode scanner camera preview"
          />

          {previewVisible && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-primary/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
                <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-primary/80 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          )}

          {!previewVisible && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              {status === 'error' ? <CameraOff className="h-8 w-8 text-destructive" /> : <ScanLine className="h-8 w-8 text-muted-foreground" />}
              <p className="text-sm font-medium">
                {status === 'detected' ? 'Barcode captured.' : 'Camera preview is off.'}
              </p>
              <p className="text-xs text-muted-foreground">
                {errorMessage ?? 'Start the camera when you are ready to scan.'}
              </p>
            </div>
          )}
        </div>

        <div aria-live="polite" className="min-h-5 text-sm">
          {status === 'scanning' && <span className="text-muted-foreground">Point the barcode inside the frame.</span>}
          {status === 'detected' && (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="h-4 w-4" /> Barcode detected.
            </span>
          )}
          {status === 'error' && errorMessage && (
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <XCircle className="h-4 w-4" /> {errorMessage}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!previewVisible && !manualMode && (
            <Button ref={startButtonRef} onClick={handleStart} disabled={!canStartCamera}>
              <Camera className="mr-1.5 h-4 w-4" />
              Start camera
            </Button>
          )}

          {previewVisible && (
            <>
              <Button variant="outline" onClick={stopScanner}>
                Stop camera
              </Button>
              {focusSupported && (
                <Button variant="outline" onClick={handleRefocus}>
                  <Focus className="mr-1.5 h-4 w-4" />
                  Refocus
                </Button>
              )}
              {torchSupported && (
                <Button variant="outline" onClick={handleToggleTorch}>
                  <Flashlight className="mr-1.5 h-4 w-4" />
                  {torchEnabled ? 'Torch off' : 'Torch on'}
                </Button>
              )}
            </>
          )}

          <Button variant="outline" onClick={() => setManualMode((value) => !value)}>
            <Keyboard className="mr-1.5 h-4 w-4" />
            {manualMode ? 'Hide manual entry' : 'Enter manually'}
          </Button>

          <Button variant="ghost" onClick={() => { stopScanner(); onCancel(); }}>
            Cancel
          </Button>
        </div>
      </div>

      {manualMode && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={inputId}>Barcode</Label>
            <Input
              ref={manualInputRef}
              id={inputId}
              value={manualBarcode}
              onChange={(event) => {
                setManualBarcode(event.target.value);
                setManualError('');
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter EAN or UPC barcode"
            />
            {manualError && <p className="text-sm text-destructive">{manualError}</p>}
          </div>

          <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
            Use barcode
          </Button>
        </div>
      )}
    </div>
  );
}
