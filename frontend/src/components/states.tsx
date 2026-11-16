import type { ReactNode } from 'react';

/**
 * The three states every data view owes the user.
 *
 * Kept as tiny shared components so "loading" and "error" look the same on every
 * screen, and so it is impossible to add a view that silently renders nothing
 * while a request is in flight.
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="state state-empty">
      <p>{children}</p>
    </div>
  );
}

/**
 * Error banner with a retry affordance.
 *
 * `onRetry` is optional because a validation error cannot be fixed by retrying;
 * only the retryable failures get the button.
 */
export function ErrorState({
  message,
  onRetry,
  showRetry = true,
}: {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {showRetry && onRetry ? (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
