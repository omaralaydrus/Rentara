'use client';
import { useEffect, useState } from 'react';
import { Plus, ArrowRight, Building2, RefreshCw, Inbox, Calendar, Mail } from 'lucide-react';
import type { Home, RentalRequest, User } from '@shared/models/rental.model';
import { api } from '@shared/services/rental.service';
import { money } from '@shared/services/rental.logic';
type Dashboard = { homes: Home[]; outgoing: RentalRequest[]; incoming: RentalRequest[] };
export function DashboardPage({
  user,
  revision,
  onList,
  onChanged,
}: {
  user: User;
  revision: number;
  onList: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState('outgoing');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    setError('');
    api<Dashboard>('rentals/dashboard')
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [revision, refresh, user.id]);
  async function change(path: string, value: unknown, id: string) {
    setBusy(id);
    setError('');
    try {
      await api(path, 'PATCH', value);
      setRefresh((n) => n + 1);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy('');
    }
  }
  const requests = data ? (tab === 'incoming' ? data.incoming : data.outgoing) : [];
  return (
    <section className="workspace">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR RENTARA SPACE</span>
          <h1>Good to see you, {user.name.split(' ')[0]}.</h1>
          <p>Keep your next move and your properties in one place.</p>
        </div>
        <button className="primary-button" onClick={onList}>
          <Plus size={17} />
          List a home
        </button>
      </div>
      <div className="dashboard-stats">
        <div>
          <Inbox size={23} />
          <strong>{data?.outgoing.length ?? '—'}</strong>
          <span>My rental requests</span>
        </div>
        <div>
          <Building2 size={23} />
          <strong>{data?.homes.length ?? '—'}</strong>
          <span>My properties</span>
        </div>
        <div>
          <Calendar size={23} />
          <strong>{data?.incoming.filter((r) => r.status === 'pending').length ?? '—'}</strong>
          <span>Requests to review</span>
        </div>
      </div>
      <div className="dashboard-toolbar">
        <div className="tabs">
          <button className={tab === 'outgoing' ? 'active' : ''} onClick={() => setTab('outgoing')}>
            My requests
          </button>
          <button className={tab === 'homes' ? 'active' : ''} onClick={() => setTab('homes')}>
            My properties
          </button>
          <button className={tab === 'incoming' ? 'active' : ''} onClick={() => setTab('incoming')}>
            Incoming requests
          </button>
        </div>
        <button
          className="icon-button"
          aria-label="Refresh dashboard"
          onClick={() => setRefresh((n) => n + 1)}
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!data && !error && <div className="empty-state">Loading your dashboard…</div>}
      {data &&
        (tab === 'homes' ? (
          <div className="dashboard-list">
            {data.homes.map((h) => (
              <article key={h.id} className="dashboard-item">
                <img src={`/images/${h.image}.jpg`} alt="Property illustration" />
                <div>
                  <span className={`status ${h.published ? 'accepted' : 'cancelled'}`}>
                    {h.published ? 'Published' : 'Paused'}
                  </span>
                  <h3>{h.title}</h3>
                  <p>
                    {h.area}, {h.city} · {money(h.rent)}/month
                  </p>
                </div>
                <button
                  disabled={!!busy}
                  className="secondary-button"
                  onClick={() =>
                    change('rentals/homes', { id: h.id, published: !h.published }, h.id)
                  }
                >
                  {busy === h.id ? 'Updating…' : h.published ? 'Pause listing' : 'Republish'}
                </button>
              </article>
            ))}
            {!data.homes.length && (
              <div className="empty-state">
                <Building2 size={32} />
                <h3>Good spaces deserve good company.</h3>
                <p>List your first property and manage renter requests here.</p>
                <button className="primary-button" onClick={onList}>
                  List a home
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="dashboard-list">
            {requests.map((r) => (
              <article key={r.id} className="request-item">
                <div className="request-item-top">
                  <img src={`/images/${r.homeImage}.jpg`} alt="Property illustration" />
                  <div>
                    <span className={`status ${r.status}`}>{r.status}</span>
                    {r.demo && <span className="demo-inline">Demo request</span>}
                    <h3>{r.homeTitle}</h3>
                    <p>
                      {money(r.rent)}/month · Move in {r.moveIn} · {r.months} months
                    </p>
                  </div>
                </div>
                {tab === 'incoming' && (
                  <p className="tenant-line">
                    <Mail size={15} />
                    {r.tenantName} · {r.tenantEmail}
                  </p>
                )}
                {tab === 'outgoing' && r.ownerEmail && (
                  <p className="tenant-line">
                    <Mail size={15} />
                    Contact the owner: {r.ownerName} · {r.ownerEmail}
                  </p>
                )}
                {r.message && <p className="request-message">{r.message}</p>}
                <div className="request-actions">
                  <p>
                    {r.demo
                      ? 'Demonstration only. No real landlord receives this request.'
                      : r.status === 'accepted'
                        ? 'The owner is interested. Agree details directly; this is not a reservation or lease.'
                        : 'Updates appear here. Email notifications are not sent.'}
                  </p>
                  {tab === 'outgoing' && ['pending', 'accepted'].includes(r.status) && (
                    <button
                      className="secondary-button"
                      disabled={!!busy}
                      onClick={() =>
                        change('rentals/requests', { id: r.id, status: 'cancelled' }, r.id)
                      }
                    >
                      Cancel request
                    </button>
                  )}
                  {tab === 'incoming' && r.status === 'pending' && (
                    <>
                      <button
                        className="secondary-button"
                        disabled={!!busy}
                        onClick={() =>
                          change('rentals/requests', { id: r.id, status: 'declined' }, r.id)
                        }
                      >
                        Decline
                      </button>
                      <button
                        className="primary-button"
                        disabled={!!busy}
                        onClick={() =>
                          change('rentals/requests', { id: r.id, status: 'accepted' }, r.id)
                        }
                      >
                        Accept request
                      </button>
                      <span className="fine-print">
                        Accepting shares your account name and email with this renter.
                      </span>
                    </>
                  )}
                </div>
              </article>
            ))}
            {!requests.length && (
              <div className="empty-state">
                <Inbox size={32} />
                <h3>
                  {tab === 'incoming'
                    ? 'A little quiet for now.'
                    : 'Your next move starts with a home.'}
                </h3>
                <p>
                  {tab === 'incoming'
                    ? 'New renter requests for your listings will appear here.'
                    : 'Browse the catalog and send a request when a place feels right.'}
                </p>
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
