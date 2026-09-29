'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  House,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Plus,
  LogOut,
  UserRound,
  X,
  Menu,
  Building2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadHomes, setFilters } from '../store/home.action';
import { selectHomeState, selectVisibleHomes } from '../store/home.selector';
import { defaultFilters, type Home, type User } from '@shared/models/rental.model';
import { api } from '@shared/services/rental.service';
import { HomeCard } from '@shared/components/home-card';
import { HomeDialog } from '../home-dialog';
import { ListingDialog } from '../listing-dialog';
import { AccountDialog } from '@modules/account/account-dialog';
import { RequestDialog } from '@modules/requests/request-dialog';
import { DashboardPage } from '@modules/dashboard/dashboard.page';
import { ReferencesPage } from '@modules/references/references.page';
type View = 'discover' | 'saved' | 'dashboard' | 'references' | 'guide';
export function DiscoverPage() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectHomeState);
  const visible = useAppSelector(selectVisibleHomes);
  const [view, setView] = useState<View>('discover');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState(15000);
  const [type, setType] = useState('all');
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Home | null>(null);
  const [request, setRequest] = useState<Home | null>(null);
  const [auth, setAuth] = useState(false);
  const [listing, setListing] = useState(false);
  const [pending, setPending] = useState<'list' | 'dashboard' | Home | null>(null);
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const results = useRef<HTMLElement>(null);
  useEffect(() => {
    dispatch(loadHomes());
    api<{ user: User | null }>('auth')
      .then((r) => setUser(r.user))
      .catch(() => {})
      .finally(() => setAuthReady(true));
    try {
      const value: unknown = JSON.parse(localStorage.getItem('rentara:saved:v1') || '[]');
      if (Array.isArray(value))
        setSaved(value.filter((v): v is string => typeof v === 'string').slice(0, 500));
    } catch {}
  }, [dispatch]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const homes = view === 'saved' ? state.items.filter((h) => saved.includes(h.id)) : visible;
  function save(id: string) {
    const next = saved.includes(id) ? saved.filter((v) => v !== id) : [...saved, id];
    if (next.length > 500) {
      setNotice('Your saved collection is full. Remove a home to add another.');
      return;
    }
    setSaved(next);
    try {
      localStorage.setItem('rentara:saved:v1', JSON.stringify(next));
      setNotice(
        saved.includes(id)
          ? 'Home removed from your saved collection.'
          : 'Home saved for a second look.',
      );
    } catch {
      setNotice('Saved for this session; browser storage is unavailable.');
    }
  }
  function navigate(next: View) {
    setMobileNav(false);
    if (next === 'dashboard' && !user) {
      setPending('dashboard');
      setAuth(true);
      return;
    }
    setView(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function list() {
    if (!user) {
      setPending('list');
      setAuth(true);
    } else setListing(true);
  }
  function search(city = query) {
    setQuery(city);
    dispatch(setFilters({ query: city, maxRent: budget, type }));
    setView('discover');
    setTimeout(
      () =>
        results.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        }),
      30,
    );
  }
  function reset() {
    setQuery('');
    setBudget(15000);
    setType('all');
    dispatch(setFilters(defaultFilters));
  }
  function startRequest(home: Home) {
    setSelected(null);
    if (!user) {
      setPending(home);
      setAuth(true);
    } else setRequest(home);
  }
  function signedIn(u: User) {
    setUser(u);
    setAuth(false);
    if (pending === 'list') setListing(true);
    else if (pending === 'dashboard') setView('dashboard');
    else if (pending) setRequest(pending);
    setPending(null);
  }
  const nav = [
    ['discover', 'Find a home'],
    ['saved', 'Saved homes'],
    ['guide', 'How it works'],
  ] as const;
  return (
    <div>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate('discover')} aria-label="Rentara home">
            <span>
              <House size={25} strokeWidth={2.2} />
            </span>
            rentara<span className="brand-dot">.</span>
          </button>
          <nav className={mobileNav ? 'open' : ''} aria-label="Main navigation">
            {nav.map(([id, label]) => (
              <button key={id} className={view === id ? 'active' : ''} onClick={() => navigate(id)}>
                {label}
                {id === 'saved' && saved.length > 0 && (
                  <span className="nav-count">{saved.length}</span>
                )}
              </button>
            ))}
            <button
              className={view === 'references' ? 'active' : ''}
              onClick={() => navigate('references')}
            >
              Owner resources
            </button>
          </nav>
          <div className="header-actions">
            <button className="list-button" onClick={list}>
              <Plus size={16} />
              List your property
            </button>
            {user ? (
              <>
                <button
                  className="account-button"
                  onClick={() => navigate('dashboard')}
                  aria-label="My dashboard"
                >
                  <UserRound size={17} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                <button
                  className="logout"
                  aria-label="Sign out"
                  onClick={async () => {
                    try {
                      await api('auth', 'POST', { action: 'logout' });
                      setUser(null);
                      setView('discover');
                      setNotice('You have signed out.');
                    } catch (e) {
                      setNotice(e instanceof Error ? e.message : 'Sign out failed.');
                    }
                  }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                className="account-button"
                disabled={!authReady}
                onClick={() => {
                  setPending(null);
                  setAuth(true);
                }}
              >
                Sign in
                <ArrowUpRight size={14} />
              </button>
            )}
            <button
              className="mobile-menu"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNav}
            >
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        {view === 'discover' && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-kicker">
                  <span />A PLACE FOR YOUR NEXT CHAPTER
                </span>
                <h1>
                  More than a house.
                  <br />A place to <span>call home.</span>
                </h1>
                <p>
                  Find a space that fits your life, your people,
                  <br />
                  and all the little things that make you, you.
                </p>
                <div className="hero-tags">
                  <span>
                    <Check size={14} />
                    Space for every lifestyle
                  </span>
                  <span>
                    <Check size={14} />A simpler way to rent
                  </span>
                </div>
                <button
                  className="hero-explore"
                  onClick={() => results.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span>
                    <ArrowDown size={15} />
                  </span>
                  Find your kind of home
                </button>
              </div>
              <div className="hero-image">
                <img
                  src="/images/hero.jpg"
                  alt="Bright welcoming living room with natural textures"
                />
                <div className="hero-image-shade" />
                <span className="image-note">A little inspiration for your next home</span>
                <div className="floating-card">
                  <div className="floating-icon">
                    <KeyRound size={23} />
                  </div>
                  <div>
                    <strong>
                      Your next chapter,
                      <br />
                      starts with a little space.
                    </strong>
                    <span>Let’s find yours.</span>
                  </div>
                  <Sparkles size={18} />
                </div>
              </div>
            </section>
            <section className="search-box" aria-label="Search rental homes">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  search();
                }}
              >
                <label className="search-location">
                  <MapPin size={22} />
                  <span>
                    <span className="search-label">LOCATION</span>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="City, neighbourhood or area"
                      aria-label="Search location"
                    />
                  </span>
                </label>
                <label>
                  <span className="search-label">PROPERTY TYPE</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    aria-label="Property type"
                  >
                    <option value="all">Any type</option>
                    <option>Apartment</option>
                    <option>Condominium</option>
                    <option>Terrace house</option>
                    <option>Detached house</option>
                  </select>
                </label>
                <label>
                  <span className="search-label">MONTHLY BUDGET</span>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    aria-label="Monthly budget"
                  >
                    <option value={15000}>Up to RM 15,000</option>
                    <option value={2000}>Up to RM 2,000</option>
                    <option value={3000}>Up to RM 3,000</option>
                    <option value={5000}>Up to RM 5,000</option>
                    <option value={100000}>Any budget</option>
                  </select>
                </label>
                <button className="primary-button">
                  <Search size={18} />
                  Find a home
                </button>
              </form>
            </section>
            <div className="popular-searches">
              <span>Popular searches:</span>
              {['Kuala Lumpur', 'Petaling Jaya', 'Penang', 'Johor Bahru'].map((city) => (
                <button key={city} onClick={() => search(city)}>
                  {city}
                  <ArrowUpRight size={11} />
                </button>
              ))}
            </div>
          </>
        )}
        {(view === 'discover' || view === 'saved') && (
          <section ref={results} className="homes-section container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {view === 'saved' ? 'KEEP THE POSSIBILITIES CLOSE' : 'GOOD SPACES. FRESH STARTS.'}
                </span>
                <h2>
                  {view === 'saved'
                    ? 'Worth a second look.'
                    : state.filters.query
                      ? `Homes around ${state.filters.query}`
                      : 'Some places just feel right.'}
                </h2>
                <p>
                  {view === 'saved'
                    ? 'Your saved homes, kept on this device. Unpublished homes are hidden.'
                    : 'Discover a little more space for the life you want to live.'}
                </p>
              </div>
              {view === 'discover' && (
                <div className="results-count">
                  <span>{homes.length} homes</span>
                  <select
                    aria-label="Sort homes"
                    value={state.filters.sort}
                    onChange={(e) => dispatch(setFilters({ sort: e.target.value }))}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="space">Most space</option>
                  </select>
                </div>
              )}
            </div>
            {view === 'discover' && (
              <div className="filter-bar">
                <div className="type-tabs">
                  {['all', 'Apartment', 'Condominium', 'Terrace house', 'Detached house'].map(
                    (t) => (
                      <button
                        key={t}
                        className={state.filters.type === t ? 'active' : ''}
                        onClick={() => {
                          setType(t);
                          dispatch(setFilters({ type: t }));
                        }}
                      >
                        {t === 'all' ? (
                          <>
                            <Building2 size={15} />
                            All homes
                          </>
                        ) : t === 'Terrace house' ? (
                          'Terrace houses'
                        ) : t === 'Detached house' ? (
                          'Detached houses'
                        ) : (
                          `${t}s`
                        )}
                      </button>
                    ),
                  )}
                </div>
                <div className="extra-filters">
                  <label>
                    <input
                      type="checkbox"
                      checked={state.filters.furnished}
                      onChange={(e) => dispatch(setFilters({ furnished: e.target.checked }))}
                    />
                    Furnished
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={state.filters.pets}
                      onChange={(e) => dispatch(setFilters({ pets: e.target.checked }))}
                    />
                    Pet friendly
                  </label>
                  <select
                    aria-label="Minimum bedrooms"
                    value={state.filters.beds}
                    onChange={(e) => dispatch(setFilters({ beds: Number(e.target.value) }))}
                  >
                    <option value={0}>Any beds</option>
                    <option value={2}>2+ beds</option>
                    <option value={3}>3+ beds</option>
                    <option value={4}>4+ beds</option>
                  </select>
                  <button className="reset-button" onClick={reset}>
                    <SlidersHorizontal size={14} />
                    Reset
                  </button>
                </div>
              </div>
            )}
            <div className="catalog-note">
              <span className="small-dot" />
              Explore the sample catalog, or list your own home. Sample listings are fictional and
              use inspiration photos.
            </div>
            {state.status === 'error' ? (
              <div className="empty-state" role="alert">
                <h3>We couldn’t load the homes.</h3>
                <p>{state.error}</p>
                <button className="secondary-button" onClick={() => dispatch(loadHomes())}>
                  Try again
                </button>
              </div>
            ) : state.status === 'loading' && !state.items.length ? (
              <div className="home-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : homes.length ? (
              <div className="home-grid">
                {homes.map((h) => (
                  <HomeCard
                    key={h.id}
                    home={h}
                    saved={saved.includes(h.id)}
                    onSave={() => save(h.id)}
                    onOpen={() => setSelected(h)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <House size={32} />
                <h3>
                  {view === 'saved'
                    ? 'Your next home might be a heart away.'
                    : 'No homes match your search yet.'}
                </h3>
                <p>
                  {view === 'saved'
                    ? 'Tap the heart on a home to keep it here.'
                    : 'Try another area, increase your budget or clear your filters.'}
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    reset();
                    setView('discover');
                  }}
                >
                  {view === 'saved' ? 'Explore homes' : 'Clear filters'}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        )}
        {view === 'discover' && (
          <>
            <section className="values-strip container">
              <div>
                <span>
                  <Search size={23} />
                </span>
                <div>
                  <h3>A place for every you</h3>
                  <p>From a cosy first apartment to room for the whole family.</p>
                </div>
              </div>
              <div>
                <span>
                  <ShieldCheck size={23} />
                </span>
                <div>
                  <h3>The details, up front</h3>
                  <p>Monthly rent, deposits and the things that make a home.</p>
                </div>
              </div>
              <div>
                <span>
                  <KeyRound size={23} />
                </span>
                <div>
                  <h3>Your next move, simplified</h3>
                  <p>Send a request and keep track of the conversation.</p>
                </div>
              </div>
            </section>
            <section className="owner-banner container">
              <div className="owner-art">
                <House size={58} strokeWidth={1} />
                <span />
                <span />
              </div>
              <div>
                <span className="eyebrow">GOOD HOMES DESERVE GOOD PEOPLE</span>
                <h2>Your property. Someone’s fresh start.</h2>
                <p>Bring your listing to life and manage rental requests in one place.</p>
              </div>
              <button className="primary-button" onClick={list}>
                List your property
                <ArrowUpRight size={17} />
              </button>
            </section>
          </>
        )}
        {view === 'dashboard' && user && (
          <div className="container">
            <DashboardPage
              user={user}
              revision={revision}
              onList={list}
              onChanged={() => dispatch(loadHomes())}
            />
          </div>
        )}
        {view === 'references' && (
          <div className="container">
            <ReferencesPage />
          </div>
        )}
        {view === 'guide' && (
          <section className="guide container">
            <span className="eyebrow">A SIMPLER WAY TO FIND YOUR PLACE</span>
            <h1>Your next move, one step at a time.</h1>
            <p className="page-description">
              A little browsing, a few details, and a conversation about what comes next.
            </p>
            <div className="guide-grid">
              {[
                {
                  n: '01',
                  title: 'Find a home that fits',
                  text: 'Search by area, monthly budget and property type. Narrow down by bedrooms, furnishing and pets. Save the homes you want to come back to.',
                  icon: Search,
                },
                {
                  n: '02',
                  title: 'Get to know the details',
                  text: 'Check the available date, monthly rent, deposit and estimated move-in total. Sample homes are clearly labelled; owner listings have not been independently verified.',
                  icon: House,
                },
                {
                  n: '03',
                  title: 'Make the first move',
                  text: 'Create an account and send your preferred move-in date, lease length and a short introduction. The owner can accept or decline in their dashboard. Updates stay in the app; no emails are sent.',
                  icon: KeyRound,
                },
              ].map((item) => (
                <article key={item.n}>
                  <span className="guide-number">{item.n}</span>
                  <item.icon size={30} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <div className="guide-note">
              <ShieldCheck size={28} />
              <div>
                <h3>A request is the start of a conversation.</h3>
                <p>
                  Even an accepted request is not a reservation, payment or signed tenancy
                  agreement. Confirm the property, owner and terms directly. Rentara does not
                  process payments or verify ownership. Sample homes have no real landlord.
                </p>
              </div>
            </div>
            <h3 className="privacy-heading">Your information, in plain language</h3>
            <p className="privacy-text">
              Account details, property listings and rental requests are stored in this app’s server
              database. Owners see the renter’s name, email and request details for their own
              properties. Accepting a request shares the owner’s name and email with that renter.
              Saved homes stay in this browser. Signing out ends your session, but does
              not delete your account or requests. Email verification, password recovery and
              self-service account deletion are not included in this version; contact the
              installation operator for account help. External maps and Google Fonts connect to
              their respective providers.
            </p>
          </section>
        )}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <button className="brand" onClick={() => navigate('discover')}>
              <span>
                <House size={21} />
              </span>
              rentara<span className="brand-dot">.</span>
            </button>
            <p>Room for your next chapter.</p>
            <div>
              <button onClick={() => navigate('guide')}>How it works & privacy</button>
              <button onClick={() => navigate('references')}>Owner resources</button>
              <button onClick={list}>List a property</button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Rentara. Find a place. Make it yours.</span>
            <span>
              Built for fresh starts <span className="footer-heart">♡</span>
            </span>
          </div>
        </div>
      </footer>
      {selected && (
        <HomeDialog
          home={selected}
          saved={saved.includes(selected.id)}
          onClose={() => setSelected(null)}
          onSave={() => save(selected.id)}
          onRequest={() => startRequest(selected)}
        />
      )}
      {auth && (
        <AccountDialog
          onClose={() => {
            setAuth(false);
            setPending(null);
          }}
          onSuccess={signedIn}
        />
      )}
      {request && (
        <RequestDialog
          home={request}
          onClose={() => setRequest(null)}
          onSuccess={() => {
            setRequest(null);
            setView('dashboard');
            setRevision((v) => v + 1);
            setNotice('Your request is saved. You can track it in My requests.');
          }}
        />
      )}
      {listing && (
        <ListingDialog
          onClose={() => setListing(false)}
          onSuccess={() => {
            setListing(false);
            setView('dashboard');
            setRevision((v) => v + 1);
            dispatch(loadHomes());
            setNotice('Your home is published. Manage it in My properties.');
          }}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
