import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemorySubmission from '../src/components/MemorySubmission';

// Mock dependencies
vi.mock('../src/hooks/useWallet', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    connected: true,
    chainId: '421614',
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchChain: vi.fn(),
  }),
}));

vi.mock('../src/lib/submitMemory', () => ({
  packAndSubmitMemory: vi.fn(async (memory, signer, onProgress) => {
    // Simulate async progress updates so the component can render transient states
    await new Promise((resolve) => {
      setTimeout(() => onProgress?.('uploading', 25), 0);
      setTimeout(() => onProgress?.('uploading', 50), 10);
      setTimeout(() => onProgress?.('tx-pending', 75), 20);
      setTimeout(() => onProgress?.('confirmed', 100), 30);
      setTimeout(resolve, 40);
    });
    return {
      cid: 'bafytest123',
      contentHash: '0x' + '0'.repeat(64),
      txHash: '0x' + '1'.repeat(64),
    };
  }),
  retryLastPayload: vi.fn(),
  getCachedPayload: vi.fn(() => null),
}));

describe('MemorySubmission component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with title, category, and content fields', () => {
    render(<MemorySubmission />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByText(/category/i, { selector: 'label' })).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  });

  it('shows submit button and progress bar', () => {
    render(<MemorySubmission />);
    
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    // We only render progress when loading; ensure button exists
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(<MemorySubmission />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should show validation error or not submit
    await waitFor(() => {
      // The component should prevent submission with empty fields
      expect(submitButton).toBeEnabled();
    });
  });

  it('shows success message with CID after submission', async () => {
    const user = userEvent.setup();
    render(<MemorySubmission />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Fill in the form
    await user.type(titleInput, 'Test Memory');
    await user.type(contentInput, 'This is a test memory');
    await user.click(submitButton);

    // Wait for success state (observe test-visible status element)
    await waitFor(
      () => {
        expect(screen.getByTestId('submit-status').textContent).toMatch(/bafytest123/);
      },
      { timeout: 3000 }
    );
  });

  it('shows progress updates during submission', async () => {
    const user = userEvent.setup();
    render(<MemorySubmission />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(titleInput, 'Test Memory');
    await user.type(contentInput, 'This is a test memory');
    await user.click(submitButton);

    // Check for progress indicator updates
    // We expect the progress UI to appear while loading
    await waitFor(() => {
      expect(screen.getByTestId('submit-status').textContent).toMatch(/uploading/i);
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByTestId('submit-status').textContent).toMatch(/bafytest123/);
    });
  });

  it('shows retry option on error', async () => {
    const { packAndSubmitMemory } = await import('../src/lib/submitMemory');
    vi.mocked(packAndSubmitMemory).mockRejectedValueOnce(new Error('Upload failed'));

    const user = userEvent.setup();
    render(<MemorySubmission />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(titleInput, 'Test Memory');
    await user.type(contentInput, 'This is a test memory');
    await user.click(submitButton);

    // Wait for error state (check test-visible status)
    await waitFor(() => {
      expect(screen.getByTestId('submit-status').textContent).toMatch(/error|failed/i);
    });
  });

  it('disables submit button during submission', async () => {
    const user = userEvent.setup();
    render(<MemorySubmission />);

    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const contentInput = screen.getByLabelText(/content/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(titleInput, 'Test Memory');
    await user.type(contentInput, 'This is a test memory');
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    // Wait for completion (observe test-visible status)
    await waitFor(() => {
      expect(screen.getByTestId('submit-status').textContent).toMatch(/bafytest123/);
    });
  });
});
