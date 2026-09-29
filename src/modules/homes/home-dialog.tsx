'use client';
import {
  BedDouble,
  Bath,
  Scan,
  MapPin,
  Check,
  Heart,
  ArrowRight,
  Info,
  Car,
  Armchair,
  PawPrint,
} from 'lucide-react';
import type { Home } from '@shared/models/rental.model';
import { estimate, money } from '@shared/services/rental.logic';
import { Modal } from '@shared/components/modal';
export function HomeDialog({
  home,
  saved,
  onClose,
  onSave,
  onRequest,
}: {
  home: Home;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
  onRequest: () => void;
}) {
  const costs = estimate(home);
  return (
    <Modal title={home.title} onClose={onClose} wide>
      <img
        className="detail-image"
        src={`/images/${home.image}.jpg`}
        alt="Illustrative property photograph"
      />
      <div className="detail-content">
        <div>
          <span className="eyebrow">
            {home.type} · {home.demo ? 'SAMPLE LISTING' : 'OWNER LISTING'}
          </span>
          <h3>
            {home.area}, {home.city}
          </h3>
          <p className="muted detail-address">
            <MapPin size={15} />
            {home.address}
          </p>
          <div className="detail-facts">
            <span>
              <BedDouble size={19} />
              {home.beds} bedrooms
            </span>
            <span>
              <Bath size={19} />
              {home.baths} bathrooms
            </span>
            <span>
              <Scan size={19} />
              {home.sqft.toLocaleString()} sqft
            </span>
          </div>
          <p className="description">{home.description}</p>
          <h4>The everyday essentials</h4>
          <div className="amenities">
            <span>
              <Armchair size={17} />
              {home.furnished ? 'Furnished' : 'Unfurnished'}
            </span>
            <span>
              <Car size={17} />
              {home.parking ? 'Parking included' : 'No parking listed'}
            </span>
            <span>
              <PawPrint size={17} />
              {home.pets ? 'Pets allowed' : 'No pets'}
            </span>
            <span>
              <Check size={17} />
              Available{' '}
              {home.available <= new Date().toISOString().slice(0, 10) ? 'now' : home.available}
            </span>
          </div>
          <div className="info-note">
            <Info size={17} />
            <p>
              {home.demo
                ? 'This is a fictional sample home. Requests demonstrate the workflow and are not sent to a real landlord.'
                : 'This listing was supplied by its owner and has not been independently verified. Confirm the property and terms directly before making any commitment.'}{' '}
              Photos are illustrative.
            </p>
          </div>
          <a
            className="text-link"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(home.demo ? `${home.area}, ${home.city}` : home.address + ', ' + home.city)}`}
          >
            {home.demo ? 'Explore the neighbourhood' : 'View address on map'}
            <ArrowRight size={15} />
          </a>
        </div>
        <aside className="cost-panel">
          <p className="detail-price">
            <strong>{money(home.rent)}</strong>
            <span> / month</span>
          </p>
          <p className="muted">An estimate for your fresh start</p>
          <dl>
            <div>
              <dt>First month’s rent</dt>
              <dd>{money(costs.firstMonth)}</dd>
            </div>
            <div>
              <dt>Security deposit ({home.depositMonths} mo.)</dt>
              <dd>{money(costs.deposit)}</dd>
            </div>
            <div className="total">
              <dt>Estimated move-in total</dt>
              <dd>{money(costs.total)}</dd>
            </div>
          </dl>
          <p className="fine-print">
            Utilities, fees and any other charges are not included. Final terms are agreed with the
            owner.
          </p>
          <button className="primary-button" onClick={onRequest}>
            Request to rent
            <ArrowRight size={16} />
          </button>
          <button className="secondary-button" onClick={onSave}>
            <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved to your homes' : 'Save this home'}
          </button>
          <p className="fine-print centered">No payment is collected on Rentara.</p>
        </aside>
      </div>
    </Modal>
  );
}
