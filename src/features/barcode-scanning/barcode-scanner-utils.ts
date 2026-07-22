export function getBarcodeScannerErrorMessage(error: unknown) {
  if (!globalThis.isSecureContext) {
    return 'Camera scanning requires a secure HTTPS context.';
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not support camera scanning.';
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera access was denied. You can enter the barcode manually instead.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera was found on this device.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'The camera is unavailable or already in use by another app.';
    }
    if (error.name === 'AbortError') {
      return 'Camera scanning was interrupted. Try again.';
    }
  }

  return 'Unable to start barcode scanning. You can enter the barcode manually instead.';
}

export function isDuplicateBarcode(lastBarcode: string | null, nextBarcode: string, lastDetectedAt: number, now: number, debounceMs = 1000) {
  return lastBarcode === nextBarcode && now - lastDetectedAt < debounceMs;
}
