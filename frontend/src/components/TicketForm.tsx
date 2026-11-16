import type { FormEvent } from 'react';
import { useState } from 'react';
import { ticketsApi } from '../api/tickets.js';
import { ApiClientError } from '../api/errors.js';
import type { FieldErrors } from '../api/errors.js';
import type { CreateTicketInput, Priority, Ticket } from '../types.js';
import { DEFAULT_FORM_PRIORITY, PRIORITIES } from '../types.js';

/**
 * Create form.
 *
 * Client-side validation exists only for fast feedback; the server is the source
 * of truth and repeats every rule. When the server does reject the submission,
 * its `details` are mapped onto the matching inputs, so a rule that exists only
 * on the server still lands on the right field instead of a generic banner.
 */

type Values = { title: string; description: string; priority: Priority };

const emptyValues: Values = { title: '', description: '', priority: DEFAULT_FORM_PRIORITY };

/** Mirror of the server rules, used to short-circuit obviously invalid submissions. */
function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  if (values.title.trim().length === 0) errors.title = 'Title cannot be empty';
  if (values.description.trim().length === 0) errors.description = 'Description cannot be empty';
  if (!PRIORITIES.includes(values.priority)) errors.priority = 'Choose a priority';
  return errors;
}

export function TicketForm({
  onCreated,
  disabled = false,
}: {
  onCreated(ticket: Ticket): void;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Generic over the field so `priority` keeps its union type. DOM inputs hand us
   * plain strings, so the select is narrowed at the call site.
   */
  const update = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Clear the field's error as soon as the user edits it; re-showing a stale
    // message while they type is just noise.
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Send trimmed values: the server trims anyway, so the echo matches.
      const input: CreateTicketInput = {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
      };
      const created = await ticketsApi.create(input);
      setValues(emptyValues);
      setErrors({});
      // The list refreshes from the parent, so the new ticket appears without a
      // manual page reload.
      onCreated(created);
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.code === 'VALIDATION_ERROR') {
        setErrors(caught.fieldErrors);
        if (Object.keys(caught.fieldErrors).length === 0) setFormError(caught.message);
      } else {
        setFormError(caught instanceof ApiClientError ? caught.message : 'Could not create the ticket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="create-heading">
      <div className="panel-header">
        <h2 id="create-heading">New ticket</h2>
      </div>

      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">Title</span>
          <input
            type="text"
            value={values.title}
            maxLength={200}
            disabled={disabled || submitting}
            aria-invalid={Boolean(errors.title)}
            onChange={(event) => update('title', event.target.value)}
          />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </label>

        <label className="field">
          <span className="field-label">Description</span>
          <textarea
            rows={4}
            value={values.description}
            maxLength={5000}
            disabled={disabled || submitting}
            aria-invalid={Boolean(errors.description)}
            onChange={(event) => update('description', event.target.value)}
          />
          {errors.description ? <span className="field-error">{errors.description}</span> : null}
        </label>

        <label className="field">
          <span className="field-label">Priority</span>
          <select
            value={values.priority}
            disabled={disabled || submitting}
            aria-invalid={Boolean(errors.priority)}
            onChange={(event) => update('priority', event.target.value as Priority)}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          {errors.priority ? <span className="field-error">{errors.priority}</span> : null}
        </label>

        {formError ? (
          <p className="form-error" role="alert">
            {formError}
          </p>
        ) : null}

        <button type="submit" className="button button-primary" disabled={disabled || submitting}>
          {submitting ? 'Creating…' : 'Create ticket'}
        </button>
      </form>
    </section>
  );
}
