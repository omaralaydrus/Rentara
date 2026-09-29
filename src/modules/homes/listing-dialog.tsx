'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Modal } from '@shared/components/modal';
import { api } from '@shared/services/rental.service';
export function ListingDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title="Make room for someone’s next chapter" onClose={onClose} wide>
      <p className="modal-intro">
        Publish your home to this Rentara catalog. Prices are in Malaysian ringgit.
      </p>
      <form
        className="form-stack listing-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const f = new FormData(e.currentTarget);
          const data: Record<string, unknown> = Object.fromEntries(f);
          for (const k of ['rent', 'beds', 'baths', 'sqft', 'depositMonths'])
            data[k] = Number(f.get(k));
          for (const k of ['furnished', 'pets', 'parking']) data[k] = f.get(k) === 'on';
          try {
            await api('rentals/homes', 'POST', data);
            onSuccess();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to publish.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Listing title
          <input
            name="title"
            required
            minLength={5}
            maxLength={100}
            placeholder="A bright family home in a leafy neighbourhood"
          />
        </label>
        <div className="form-grid">
          <label>
            City
            <input name="city" required minLength={2} maxLength={80} placeholder="Kuala Lumpur" />
          </label>
          <label>
            Neighbourhood
            <input name="area" required minLength={2} maxLength={80} placeholder="Bangsar" />
          </label>
        </div>
        <label>
          Property address
          <input
            name="address"
            required
            minLength={5}
            maxLength={200}
            placeholder="Street and building address (public on the listing)"
          />
        </label>
        <div className="form-grid">
          <label>
            Property type
            <select name="type">
              <option>Apartment</option>
              <option>Condominium</option>
              <option>Terrace house</option>
              <option>Detached house</option>
            </select>
          </label>
          <label>
            Monthly rent (RM)
            <input
              name="rent"
              type="number"
              required
              min={100}
              max={100000}
              step={1}
              placeholder="2500"
            />
          </label>
          <label>
            Bedrooms
            <input name="beds" type="number" required min={1} max={20} defaultValue={2} />
          </label>
          <label>
            Bathrooms
            <input name="baths" type="number" required min={1} max={20} defaultValue={1} />
          </label>
          <label>
            Floor area (sqft)
            <input name="sqft" type="number" required min={100} max={50000} defaultValue={900} />
          </label>
          <label>
            Deposit (months of rent)
            <select name="depositMonths" defaultValue="2">
              <option value="0">No deposit</option>
              <option value="1">1 month</option>
              <option value="2">2 months</option>
              <option value="3">3 months</option>
            </select>
          </label>
        </div>
        <label>
          Available from
          <input
            name="available"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <label>
          Tell renters about the home
          <textarea
            name="description"
            required
            minLength={30}
            maxLength={2000}
            rows={4}
            placeholder="Describe the space, what is included and anything renters should know (at least 30 characters)."
          />
        </label>
        <div className="checkbox-row">
          <label>
            <input name="furnished" type="checkbox" />
            Furnished
          </label>
          <label>
            <input name="pets" type="checkbox" />
            Pets allowed
          </label>
          <label>
            <input name="parking" type="checkbox" />
            Parking
          </label>
        </div>
        <p className="fine-print">
          Your address and property details will be public. New listings use a labelled
          illustration; photo uploads are not included in this version. You can pause or republish
          your listing from your dashboard.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish home'}
          <ArrowRight size={16} />
        </button>
      </form>
    </Modal>
  );
}
