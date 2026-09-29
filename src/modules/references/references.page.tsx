'use client';
import { useState } from 'react';
import { Building2, Info, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { findAllZones } from '@shared/services/zone.service';
import { findAllLicenseTypes } from '@shared/services/license-type.service';
import { findAllBusinessActivities } from '@shared/services/business-activity.service';
import { HttpError, httpGet } from '@core/http/http.client';
export function ReferencesPage() {
  const [rows, setRows] = useState<
    { code: string; name: string; detail: string; type: string }[] | null
  >(null);
  const [tab, setTab] = useState('zones');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  async function load() {
    if (Date.now() < retry) {
      setError('The service requested a pause. Please retry after the wait interval.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await httpGet('ping');
      const zones = await findAllZones();
      const licenses = await findAllLicenseTypes();
      const activities = await findAllBusinessActivities();
      setRows([
        ...zones.map((r) => ({
          code: r.zoneCode,
          name: r.nameEn || r.nameMs,
          detail: `DUN ${r.dunCode}`,
          type: 'zones',
        })),
        ...licenses.map((r) => ({
          code: r.code,
          name: r.nameEn || r.name,
          detail: `${r.family} · ${r.riskCategory?.replaceAll('_', ' ') || 'Unclassified risk'}`,
          type: 'licenses',
        })),
        ...activities.map((r) => ({
          code: r.code,
          name: r.nameEn || r.name,
          detail: `Tier ${r.tier} · ${r.selectable ? 'Selectable' : 'Group heading'}`,
          type: 'activities',
        })),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'References unavailable.');
      if (e instanceof HttpError && e.retryAfterSeconds)
        setRetry(Date.now() + e.retryAfterSeconds * 1000);
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows?.filter(
    (r) => r.type === tab && `${r.code} ${r.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="workspace">
      <span className="eyebrow">POWERED BY REBANA</span>
      <h1>A useful reference for owners.</h1>
      <p className="page-description">
        Browse council zones, licence types and business activities.
      </p>
      <div className="info-note">
        <Info size={20} />
        <p>
          Rebana supplies Malaysian council reference data. These records do not verify a property,
          landlord, ownership, rental availability or legal compliance. Rental listings and requests
          are managed separately by Rentara.
        </p>
      </div>
      <div className="dashboard-toolbar">
        <div className="tabs">
          {[
            ['zones', 'Council zones'],
            ['licenses', 'Licence types'],
            ['activities', 'Business activities'],
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <button className="secondary-button" disabled={busy} onClick={load}>
          <RefreshCw size={15} />
          {busy ? 'Connecting…' : rows ? 'Refresh' : 'Connect to Rebana'}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {rows ? (
        <>
          <label className="reference-search">
            <Search size={17} />
            <input
              aria-label="Search reference data"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or code"
            />
          </label>
          <p className="fine-print">{filtered?.length} references · Full paginated catalog</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((r) => (
                  <tr key={`${r.type}-${r.code}`}>
                    <td>
                      <code>{r.code}</code>
                    </td>
                    <td>{r.name}</td>
                    <td>{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered?.length && <p className="empty-inline">No matching references.</p>}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Building2 size={32} />
          <h3>A little context goes a long way.</h3>
          <p>
            Connect to explore the live Rebana catalog. The rental app works independently of this
            connection.
          </p>
        </div>
      )}
      <a
        className="text-link"
        href="https://rebana.canang.com.my/rebana-license/v3/api-docs/sandbox"
        target="_blank"
        rel="noreferrer"
      >
        View the API specification
        <ExternalLink size={14} />
      </a>
    </section>
  );
}
