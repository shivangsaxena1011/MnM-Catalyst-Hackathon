import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FeedbackProvider, useFeedback } from './FeedbackProvider';

afterEach(cleanup);

/** Small harness that exposes the hook through buttons. */
const Harness: React.FC<{ onResult?: (value: boolean) => void }> = ({ onResult }) => {
  const { notify, confirm } = useFeedback();
  return (
    <>
      <button onClick={() => notify('Dose saved', 'success')}>notify</button>
      <button onClick={() => notify('Save failed', 'error')}>notify-error</button>
      <button
        onClick={async () => {
          const ok = await confirm({ title: 'Delete appointment?', message: 'This cannot be undone.', destructive: true });
          onResult?.(ok);
        }}
      >
        ask
      </button>
    </>
  );
};

const renderHarness = (onResult?: (value: boolean) => void) =>
  render(
    <FeedbackProvider>
      <Harness onResult={onResult} />
    </FeedbackProvider>
  );

describe('FeedbackProvider', () => {
  it('announces success toasts in a polite status region', () => {
    renderHarness();
    fireEvent.click(screen.getByText('notify'));
    const toast = screen.getByRole('status');
    expect(toast.textContent).toContain('Dose saved');
    expect(toast.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('uses role="alert" for error toasts', () => {
    renderHarness();
    fireEvent.click(screen.getByText('notify-error'));
    expect(screen.getByRole('alert').textContent).toContain('Save failed');
  });

  it('opens an accessible confirm dialog and focuses Cancel first', async () => {
    renderHarness();
    fireEvent.click(screen.getByText('ask'));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Delete appointment?')).toBeTruthy();
    expect(document.activeElement?.textContent).toBe('Cancel');
  });

  it('resolves true when confirmed', async () => {
    let result: boolean | undefined;
    renderHarness(v => { result = v; });
    fireEvent.click(screen.getByText('ask'));
    fireEvent.click(await screen.findByText('Confirm'));
    await waitFor(() => expect(result).toBe(true));
  });

  it('resolves false when Escape is pressed', async () => {
    let result: boolean | undefined;
    renderHarness(v => { result = v; });
    fireEvent.click(screen.getByText('ask'));
    await screen.findByRole('alertdialog');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(result).toBe(false));
  });

  it('throws a helpful error when used outside the provider', () => {
    const Orphan = () => {
      useFeedback();
      return null;
    };
    expect(() => render(<Orphan />)).toThrow('useFeedback must be used within a FeedbackProvider');
  });
});
