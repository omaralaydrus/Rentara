import { Heart, BedDouble, Bath, Scan, ArrowUpRight, MapPin } from 'lucide-react';
import type { Home } from '@shared/models/rental.model';
import { money } from '@shared/services/rental.logic';
export function HomeCard({
  home,
  saved,
  onSave,
  onOpen,
}: {
  home: Home;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="home-card">
      <div className="card-image">
        <button className="image-button" onClick={onOpen} aria-label={`View ${home.title}`}>
          <img
            src={`/images/${home.image}.jpg`}
            alt={
              home.demo
                ? 'Illustrative interior for this sample home'
                : 'Property illustration; owner photo not supplied'
            }
            loading="lazy"
          />
        </button>
        <span className="property-badge">{home.type}</span>
        <button
          onClick={onSave}
          className={`save-button ${saved ? 'saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${home.title}`}
          aria-pressed={saved}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <span className="sample-label">
          {home.demo ? 'Sample home' : 'Owner-listed · illustration'}
        </span>
      </div>
      <div className="card-body">
        <div className="card-price">
          <strong>{money(home.rent)}</strong>
          <span>/ month</span>
          <span className="furnishing">{home.furnished ? 'Furnished' : 'Unfurnished'}</span>
        </div>
        <button className="card-title" onClick={onOpen}>
          {home.title}
        </button>
        <p className="card-location">
          <MapPin size={13} />
          {home.area}, {home.city}
        </p>
        <div className="card-facts">
          <span>
            <BedDouble size={16} />
            {home.beds} beds
          </span>
          <span>
            <Bath size={16} />
            {home.baths} baths
          </span>
          <span>
            <Scan size={15} />
            {home.sqft.toLocaleString()} sqft
          </span>
          <button onClick={onOpen} aria-label={`Details for ${home.title}`}>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
