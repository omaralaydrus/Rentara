'use client';
import { useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import type { Home } from '@shared/models/rental.model';
import { Modal } from '@shared/components/modal';
import { api } from '@shared/services/rental.service';
import { money } from '@shared/services/rental.logic';
export function RequestDialog({
  home,
  onClose,
  onSuccess,
}: {
  home: Home;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const min = [new Date().toISOString().slice(0, 10), home.available].sort().at(-1)!;
  return (
    <Modal title="Your next chapter starts here" onClose={onClose}>
      <div className="request-summary">
        <img src={`/images/${home.image}.jpg`} alt="Property illustration" />
        <div>
          <strong>{home.title}</strong>
          <p>
            {home.area} · {money(home.rent)}/month
          </p>
        </div>
      </div>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError('');
          try {
            await api('rentals/requests', 'POST', {
              homeId: home.id,
              moveIn: f.get('moveIn'),
              months: Number(f.get('months')),
              message: f.get('message'),
            });
            onSuccess();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Preferred move-in date
            <input name="moveIn" type="date" min={min} required />
          </label>
          <label>
            Lease length
            <select name="months" defaultValue="12">
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </select>
          </label>
        </div>
        <label>
          A little about you
          <textarea
            name="message"
            maxLength={1000}
            rows={4}
            placeholder="Introduce yourself and share anything you’d like the owner to know."
          />
        </label>
        <div className="info-note">
          <Info size={18} />
          <p>
            {home.demo
              ? 'Sample home: this request stays in the app for demonstration. There is no real landlord for this listing.'
              : 'The owner can see your name, email, move-in date and message in their Rentara dashboard.'}{' '}
            A request, including an accepted one, is not a reservation or signed tenancy agreement.
          </p>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          {busy ? 'Sending…' : home.demo ? 'Submit demo request' : 'Send rental request'}
          <ArrowRight size={16} />
        </button>
      </form>
    </Modal>
  );
}
