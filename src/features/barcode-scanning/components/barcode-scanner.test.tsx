import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarcodeScanner } from './barcode-scanner';

const decodeFromVideoDevice = vi.fn();

vi.mock('@zxing/browser', async () => {
  const actual = await vi.importActual<typeof import('@zxing/browser')>('@zxing/browser');
  class MockBrowserMultiFormatReader {
    possibleFormats = [];
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
    expect(decodeFromVideoDevice).not.toHaveBeenCalled();
  });

  it('starts scanning after explicit user action and reports the first valid barcode', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const { stream, track } = makeMediaStream();

    decodeFromVideoDevice.mockImplementation(async (_deviceId, preview, callback) => {
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

    decodeFromVideoDevice.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));

    render(<BarcodeScanner onDetected={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: /start camera/i })[0]);

    expect((await screen.findAllByText(/camera access was denied/i)).length).toBeGreaterThan(0);
  });

  it('stops scanning when closed', async () => {
    const user = userEvent.setup();
    const { stream, track } = makeMediaStream();
    const controls = { stop: vi.fn() };

    decodeFromVideoDevice.mockImplementation(async (_deviceId, preview) => {
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
});
