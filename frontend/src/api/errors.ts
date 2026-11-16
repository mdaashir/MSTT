/**
 * Error mapping.
 *
 * The API has exactly one failure shape, so the client exposes exactly one error
 * type. Components branch on `code` and render `message`; `fieldErrors` is the
 * same detail list reshaped for form display, so a component never parses prose
 * to work out which input is wrong.
 */

export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL' | 'NETWORK';

export type FieldErrors = Record<string, string>;

export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly details: { field?: string; message: string }[];

  constructor(code: ErrorCode, message: string, details: { field?: string; message: string }[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }

  /** Field-keyed messages, ready for inline form display. */
  get fieldErrors(): FieldErrors {
    const result: FieldErrors = {};
    for (const detail of this.details) {
      // Keep the first message per field; later duplicates are usually noise.
      if (detail.field && !(detail.field in result)) {
        result[detail.field] = detail.message;
      }
    }
    return result;
  }

  /**
   * True when the failure is worth offering a retry for. A 400 means the input
   * is wrong and retrying it unchanged cannot help.
   */
  get isRetryable(): boolean {
    return this.code === 'NETWORK' || this.code === 'INTERNAL';
  }
}

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: { field?: string; message: string }[];
  };
};

/** Turn any non-2xx response into one typed error. */
export async function toApiError(response: Response): Promise<ApiClientError> {
  let body: ErrorBody | undefined;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // A non-JSON body means the request never reached the API (a proxy error
    // page, say). Fall through to a generic message rather than throwing here.
    body = undefined;
  }

  const code = body?.error?.code;
  const known: ErrorCode[] =
    code === 'VALIDATION_ERROR' || code === 'NOT_FOUND' || code === 'INTERNAL' ? [code] : [];

  return new ApiClientError(
    known[0] ?? 'INTERNAL',
    body?.error?.message ?? `Request failed with status ${response.status}`,
    body?.error?.details ?? [],
  );
}
