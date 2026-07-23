import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarcodeScanner } from './barcode-scanner';

const decodeFromVideoDevice = vi.fn();
const decodeFromConstraints = vi.fn();

vi.mock('@zxing/browser', async () => {
  const actual = await vi.importActual<typeof import('@zxing/browser')>('@zxing/browser');
  class MockBrowserMultiFormatReader {
    possibleFormats = [];
    decodeFromConstraints = decodeFromConstraints;
    decodeFromVideoDevice = decodeFromVideoDevice;
  }

  return {
    ...actual,
    BrowserMultiFormatReader: MockBrowserMultiFormatReader,
  };
});

function makeMediaStream() {
  const track = { stop: vi.fn() };
  return {
    stream: {
      getTracks: () => [track],
    } as unknown as MediaStream,
    track,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  decodeFromConstraints.mockReset();
  decodeFromVideoDevice.mockReset();
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(),
    },
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

describe('BarcodeScanner', () => {
  it('does not start camera access until the user clicks start', () => {
    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);
    expect(decodeFromConstraints).not.toHaveBeenCalled();
    expect(decodeFromVideoDevice).not.toHaveBeenCalled();
  });

  it('starts scanning after explicit user action and reports the first valid barcode', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const { stream, track } = makeMediaStream();

    decodeFromConstraints.mockImplementation(async (_constraints, preview, callback) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      callback({ getText: () => '036000291452' }, undefined, { stop: vi.fn() });
      return { stop: vi.fn() };
    });

    render(<BarcodeScanner onDetected={onDetected} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);

    await waitFor(() => expect(onDetected).toHaveBeenCalledWith('0036000291452'));
    expect(track.stop).toHaveBeenCalled();
  });

  it('supports manual barcode entry fallback', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();

    render(<BarcodeScanner onDetected={onDetected} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /enter manually/i })[0]);
    await user.type(screen.getByLabelText(/^Barcode$/i), '036000291452');
    await user.click(screen.getByRole('button', { name: /use barcode/i }));

    expect(onDetected).toHaveBeenCalledWith('0036000291452');
  });

  it('shows a permission denied error and allows manual fallback', async () => {
    const user = userEvent.setup();

    decodeFromConstraints.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    decodeFromVideoDevice.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));

    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);

    expect((await screen.findAllByText(/camera access was denied/i)).length).toBeGreaterThan(0);
  });

  it('stops scanning when closed', async () => {
    const user = userEvent.setup();
    const { stream, track } = makeMediaStream();
    const controls = { stop: vi.fn() };

    decodeFromConstraints.mockImplementation(async (_constraints, preview) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      return controls;
    });

    const { rerender } = render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} isOpen />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);
    rerender(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} isOpen={false} />);

    await waitFor(() => expect(controls.stop).toHaveBeenCalled());
    expect(track.stop).toHaveBeenCalled();
  });

  it('ignores repeated detections of the same barcode during the cooldown window', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const { stream } = makeMediaStream();

    let callbackRef: ((result: { getText: () => string } | undefined) => void) | undefined;

    decodeFromConstraints.mockImplementation(async (_constraints, preview, callback) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      callbackRef = (result) => callback(result as never, undefined, { stop: vi.fn() });
      return { stop: vi.fn() };
    });

    render(<BarcodeScanner onDetected={onDetected} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);
    callbackRef?.({ getText: () => '036000291452' });
    callbackRef?.({ getText: () => '036000291452' });

    await waitFor(() => expect(onDetected).toHaveBeenCalledTimes(1));
  });

  it('falls back to generic video device selection if custom constraints fail', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const { stream } = makeMediaStream();

    decodeFromConstraints.mockRejectedValue(new DOMException('unsupported', 'OverconstrainedError'));
    decodeFromVideoDevice.mockImplementation(async (_deviceId, preview, callback) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      callback({ getText: () => '036000291452' }, undefined, { stop: vi.fn() });
      return { stop: vi.fn() };
    });

    render(<BarcodeScanner onDetected={onDetected} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);

    await waitFor(() => expect(decodeFromVideoDevice).toHaveBeenCalled());
    expect(onDetected).toHaveBeenCalledWith('0036000291452');
  });

  it('shows torch and refocus controls when the camera supports them', async () => {
    const user = userEvent.setup();
    const { stream } = makeMediaStream();
    const controls = {
      stop: vi.fn(),
      switchTorch: vi.fn(),
      streamVideoCapabilitiesGet: vi.fn(() => ({ torch: true, focusMode: ['continuous', 'single-shot'] })),
      streamVideoConstraintsApply: vi.fn(),
    };

    decodeFromConstraints.mockImplementation(async (_constraints, preview) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      return controls;
    });

    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);

    expect(await screen.findByRole('button', { name: /refocus/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /torch on/i })).not.toBeNull();
  });

  it('toggles torch when supported', async () => {
    const user = userEvent.setup();
    const { stream } = makeMediaStream();
    const controls = {
      stop: vi.fn(),
      switchTorch: vi.fn().mockResolvedValue(undefined),
      streamVideoCapabilitiesGet: vi.fn(() => ({ torch: true, focusMode: [] })),
      streamVideoConstraintsApply: vi.fn(),
    };

    decodeFromConstraints.mockImplementation(async (_constraints, preview) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      return controls;
    });

    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);
    await user.click(await screen.findByRole('button', { name: /torch on/i }));

    expect(controls.switchTorch).toHaveBeenCalledWith(true);
  });

  it('applies autofocus when refocus is requested', async () => {
    const user = userEvent.setup();
    const { stream } = makeMediaStream();
    const controls = {
      stop: vi.fn(),
      streamVideoCapabilitiesGet: vi.fn(() => ({ focusMode: ['single-shot'] })),
      streamVideoConstraintsApply: vi.fn(),
    };

    decodeFromConstraints.mockImplementation(async (_constraints, preview) => {
      if (preview instanceof HTMLVideoElement) {
        preview.srcObject = stream;
      }
      return controls;
    });

    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);
    await user.click(await screen.findByRole('button', { name: /refocus/i }));

    expect(controls.streamVideoConstraintsApply).toHaveBeenCalledWith(
      { advanced: [{ focusMode: 'single-shot' }] },
      expect.any(Function),
    );
  });
});
