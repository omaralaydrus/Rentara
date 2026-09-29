'use client';
import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Modal } from '@shared/components/modal';
import { api } from '@shared/services/rental.service';
import type { User } from '@shared/models/rental.model';
export function AccountDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (user: User) => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title={register ? 'Make yourself at home' : 'Welcome back'} onClose={onClose}>
      <p className="modal-intro">
        {register
          ? 'Create an account to request a rental or list your property.'
          : 'Sign in to manage your homes and rental requests.'}
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const f = new FormData(e.currentTarget);
          try {
            const r = await api<{ user: User }>('auth', 'POST', {
              action: register ? 'register' : 'login',
              name: f.get('name'),
              email: f.get('email'),
              password: f.get('password'),
            });
            onSuccess(r.user);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to sign in.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="How should we call you?"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={180}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            minLength={10}
            maxLength={128}
            placeholder="At least 10 characters"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          {busy ? 'One moment…' : register ? 'Create account' : 'Sign in'}
          <ArrowRight size={16} />
        </button>
      </form>
      <button
        className="auth-switch"
        onClick={() => {
          setRegister(!register);
          setError('');
        }}
      >
        {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
      <p className="fine-print">
        <LockKeyhole size={13} />
        Your account belongs to this Rentara installation. Email verification and password recovery
        are not yet available.
      </p>
    </Modal>
  );
}
