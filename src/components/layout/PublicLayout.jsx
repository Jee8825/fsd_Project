import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AnnouncementsBanner, BackToTop, SearchBar, ThemeToggle, ToastViewport } from '../common/UI';
import NotificationCenter from '../common/NotificationCenter';

const navItems = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/blog', label: 'Blog' },
  { to: '/collections', label: 'Collections' },
  { to: '/meal-planner', label: 'Meal Planner' },
  { to: '/pantry', label: 'Pantry' },
  { to: '/saved', label: 'Saved' },
  { to: '/submit-recipe', label: 'Submit' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const footerGroups = [
  {
    heading: 'Explore',
    items: [
      { to: '/recipes', label: 'Recipe index' },
      { to: '/collections', label: 'Collections' },
      { to: '/blog', label: 'Food journal' },
    ],
  },
  {
    heading: 'Plan & cook',
    items: [
      { to: '/meal-planner', label: 'Meal planner' },
      { to: '/shopping-list', label: 'Shopping list' },
      { to: '/pantry', label: 'Pantry' },
      { to: '/saved', label: 'Saved recipes' },
    ],
  },
  {
    heading: 'Community',
    items: [
      { to: '/submit-recipe', label: 'Submit a recipe' },
      { to: '/profile', label: 'Your profile' },
      { to: '/contact', label: 'Contact us' },
    ],
  },
  {
    heading: 'Site',
    items: [
      { to: '/about', label: 'About' },
      { to: '/login', label: 'Sign in' },
      { to: '/admin', label: 'Admin dashboard' },
    ],
  },
];

const PublicLayout = () => {
  const { settings, recipes, isAuthenticated, currentUser, logout } = useApp();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const seasonalRecipes = useMemo(() => recipes.filter((recipe) => recipe.seasonal), [recipes]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="brand-mark">
            <span className="brand-mark__badge">S</span>
            <div>
              <strong>{settings.logoText}</strong>
              <small>Recipe studio · live on AWS</small>
            </div>
            <span
              className="chip chip--accent aws-badge"
              title="Frontend on S3 + CloudFront · Backend on Elastic Beanstalk · MongoDB Atlas"
            >
              ☁ Deployed on AWS
            </span>
          </Link>
          <nav className={`site-nav ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-header__actions">
            <div className="desktop-search">
              <SearchBar value={query} onChange={setQuery} searchPool={recipes} />
            </div>
            <ThemeToggle />
            {isAuthenticated && <NotificationCenter />}
            {isAuthenticated ? (
              <>
                <Link className="button button--ghost hide-mobile" to="/profile">
                  {currentUser?.name?.split(' ')[0] || 'Profile'}
                </Link>
                {(currentUser?.role === 'admin' || currentUser?.role === 'editor') && (
                  <Link className="button button--ghost hide-mobile" to="/admin">
                    Dashboard
                  </Link>
                )}
                <button className="button button--ghost hide-mobile" type="button" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link className="button button--ghost hide-mobile" to="/login">
                Sign in
              </Link>
            )}
            <button type="button" className="icon-button show-mobile" onClick={() => setMenuOpen((value) => !value)}>
              ☰
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <AnnouncementsBanner />
        </div>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <h3>{settings.siteTitle}</h3>
            <p>{settings.footerBlurb}</p>
            <div className="footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer">
                Pinterest
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                YouTube
              </a>
            </div>
          </div>
          {footerGroups.map((group) => (
            <div key={group.heading} className="footer-nav-group">
              <p className="eyebrow">{group.heading}</p>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="footer-highlight">
            <p className="eyebrow">Seasonal picks</p>
            {seasonalRecipes.slice(0, 2).map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.slug}`}>
                {recipe.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
      <ToastViewport />
      <BackToTop />
    </div>
  );
};

export default PublicLayout;
