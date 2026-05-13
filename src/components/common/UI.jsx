import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { currency, formatTime, getRecipeSuggestions, uniqueValues } from '../../utils/helpers';

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useApp();
  return (
    <button className="icon-button" onClick={toggleTheme} type="button" aria-label="Toggle theme">
      {theme === 'light' ? '◐' : '◑'}
    </button>
  );
};

export const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="section-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
    {action}
  </div>
);

export const PageHero = ({ eyebrow, title, description, image, children, compact = false }) => (
  <section className={`page-hero ${compact ? 'compact' : ''}`}>
    <div className="page-hero__content">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
    {image && (
      <div className="page-hero__visual">
        <img src={image} alt={title} loading="eager" fetchPriority="high" decoding="async" />
      </div>
    )}
  </section>
);

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search recipes, ingredients, or tags',
  searchPool,
  to = (item) => `/recipes/${item.slug}`,
}) => {
  const [focused, setFocused] = useState(false);
  const deferredValue = useDeferredValue(value);
  const suggestions = useMemo(
    () => (searchPool ? getRecipeSuggestions(searchPool, deferredValue) : []),
    [deferredValue, searchPool],
  );
  return (
    <div className="search-shell">
      <div className={`search-bar ${focused ? 'focused' : ''}`}>
        <span aria-hidden="true">⌕</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      <AnimatePresence>
        {focused && suggestions.length > 0 && (
          <motion.div
            className="suggestions-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {suggestions.map((item) => (
              <Link key={item.id} to={to(item)} className="suggestion-link">
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.tags.slice(0, 2).join(' • ')}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RatingStars = ({ value = 0, count }) => (
  <div className="rating-row" aria-label={`Rated ${value} out of 5`}>
    <span className="stars">{'★'.repeat(Math.round(value))}</span>
    <strong>{value.toFixed ? value.toFixed(1) : value}</strong>
    {count !== undefined && <span>{count} reviews</span>}
  </div>
);

export const Breadcrumbs = ({ items }) => (
  <nav className="breadcrumbs" aria-label="Breadcrumb">
    {items.map((item, index) => (
      <span key={`${item.label}-${index}`}>
        {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        {index < items.length - 1 && <span className="breadcrumbs__sep">/</span>}
      </span>
    ))}
  </nav>
);

export const InfoPill = ({ label, value }) => (
  <div className="info-pill">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const Chip = ({ children, tone = 'default' }) => (
  <span className={`chip chip--${tone}`}>{children}</span>
);

export const EmptyState = ({ title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state__art" />
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
);

export const SkeletonCard = ({ compact = false }) => (
  <div className={`skeleton-card ${compact ? 'compact' : ''}`}>
    <div className="skeleton skeleton-card__image" />
    <div className="skeleton skeleton-card__line short" />
    <div className="skeleton skeleton-card__line" />
    <div className="skeleton skeleton-card__line medium" />
  </div>
);

export const LoadingGrid = ({ count = 6 }) => (
  <div className="card-grid">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const NewsletterCard = () => {
  const { subscribeToNewsletter } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await subscribeToNewsletter(email.trim());
      setEmail('');
    } catch (error) {
      // context already shows a toast on failure
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="newsletter-card">
      <div>
        <p className="eyebrow">Newsletter</p>
        <h2>Weekly menus, editorial picks, and fresh kitchen ideas.</h2>
        <p>Subscribe for seasonal menus, smart planning tools, and new recipes from the Saffron Table kitchen.</p>
      </div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          aria-label="Email address"
        />
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? 'Joining…' : 'Join the community'}
        </button>
      </form>
    </section>
  );
};

export const FooterNav = ({ items }) => (
  <div className="footer-nav">
    {items.map((item) => (
      <NavLink key={item.to} to={item.to}>
        {item.label}
      </NavLink>
    ))}
  </div>
);

export const Modal = ({ open, title, onClose, children, size = 'medium' }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`modal-card modal-card--${size}`}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
        >
          <div className="modal-card__header">
            <div>
              <h3>{title}</h3>
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
              ×
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ConfirmDialog = ({ open, title, description, onClose, onConfirm }) => (
  <Modal open={open} title={title} onClose={onClose} size="small">
    <div className="stack-gap">
      <p>{description}</p>
      <div className="button-row">
        <button type="button" className="button button--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

export const ToastViewport = () => {
  const { toasts } = useApp();
  return (
    <div className="toast-viewport" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {toast.title}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          ↑ Top
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export const SortDropdown = ({ value, onChange, options }) => (
  <select className="select-control" value={value} onChange={(event) => onChange(event.target.value)}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const Pagination = ({ page, pageCount, onChange }) => {
  if (pageCount <= 1) return null;
  return (
    <div className="pagination">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
};

export const StatCard = ({ label, value, meta }) => (
  <div className="stat-card">
    <span>{label}</span>
    <strong>{value}</strong>
    {meta && <small>{meta}</small>}
  </div>
);

export const FilterSidebar = ({ filters, onChange, recipes }) => {
  const options = {
    category: uniqueValues(recipes.map((recipe) => recipe.category)),
    cuisine: uniqueValues(recipes.map((recipe) => recipe.cuisine)),
    mealType: uniqueValues(recipes.map((recipe) => recipe.mealType)),
    dietType: uniqueValues(recipes.map((recipe) => recipe.dietType)),
    difficulty: uniqueValues(recipes.map((recipe) => recipe.difficulty)),
    tags: uniqueValues(recipes.flatMap((recipe) => recipe.tags)),
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-sidebar__head">
        <h3>Refine recipes</h3>
      </div>
      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onChange('category', event.target.value)}>
          <option value="">All</option>
          {options.category.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Cuisine</span>
        <select value={filters.cuisine} onChange={(event) => onChange('cuisine', event.target.value)}>
          <option value="">All</option>
          {options.cuisine.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Meal type</span>
        <select value={filters.mealType} onChange={(event) => onChange('mealType', event.target.value)}>
          <option value="">All</option>
          {options.mealType.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Diet type</span>
        <select value={filters.dietType} onChange={(event) => onChange('dietType', event.target.value)}>
          <option value="">All</option>
          {options.dietType.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Difficulty</span>
        <select value={filters.difficulty} onChange={(event) => onChange('difficulty', event.target.value)}>
          <option value="">All</option>
          {options.difficulty.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Pantry friendly</span>
        <select value={filters.pantryFriendly} onChange={(event) => onChange('pantryFriendly', event.target.value)}>
          <option value="">All</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <label>
        <span>Max total time</span>
        <input
          type="number"
          value={filters.totalTime}
          min="0"
          placeholder="Any"
          onChange={(event) => onChange('totalTime', event.target.value)}
        />
      </label>
      <label>
        <span>Ingredient includes</span>
        <input
          type="text"
          value={filters.ingredients}
          placeholder="e.g. basil"
          onChange={(event) => onChange('ingredients', event.target.value)}
        />
      </label>
      <label>
        <span>Tag</span>
        <select value={filters.tag} onChange={(event) => onChange('tag', event.target.value)}>
          <option value="">All</option>
          {options.tags.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
};

export const QuickRecipeStats = ({ recipe }) => (
  <div className="quick-stats">
    <InfoPill label="Prep" value={formatTime(recipe.prepTime)} />
    <InfoPill label="Cook" value={formatTime(recipe.cookTime)} />
    <InfoPill label="Serves" value={recipe.servings} />
    <InfoPill label="Cost" value={currency(recipe.estimatedCost)} />
  </div>
);

export const AdminNavLink = ({ to, children }) => (
  <NavLink to={to} className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}>
    {children}
  </NavLink>
);

const planNavItems = [
  { to: '/saved', label: 'Saved recipes' },
  { to: '/meal-planner', label: 'Meal planner' },
  { to: '/shopping-list', label: 'Shopping list' },
  { to: '/pantry', label: 'Pantry' },
  { to: '/submit-recipe', label: 'Submit a recipe' },
  { to: '/profile', label: 'Profile' },
];

export const PlanCookSubnav = () => (
  <nav className="plan-subnav" aria-label="Plan & cook">
    {planNavItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end
        className={({ isActive }) => `plan-subnav__link ${isActive ? 'active' : ''}`}
      >
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export const AnnouncementsBanner = () => {
  const { announcements } = useApp();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saffron-announcements-dismissed') || '[]');
    } catch (error) {
      return [];
    }
  });

  const visible = (announcements || []).filter(
    (item) => item.active && !dismissed.includes(item.id),
  );
  if (visible.length === 0) return null;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('saffron-announcements-dismissed', JSON.stringify(next));
  };

  return (
    <div className="announcement-banner-stack">
      {visible.map((item) => (
        <div key={item.id} className={`announcement-banner announcement-banner--${item.tone || 'info'}`}>
          <div className="announcement-banner__body">
            <strong>{item.title}</strong>
            <span>{item.message}</span>
            {item.link && (
              <Link to={item.link} className="announcement-banner__link">
                Learn more →
              </Link>
            )}
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss announcement"
            onClick={() => dismiss(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const RecipeNotesPanel = ({ recipeId }) => {
  const { recipeNotes, currentUser, isAuthenticated, saveRecipeNote, deleteRecipeNote } = useApp();
  const existing = useMemo(
    () =>
      recipeNotes.find(
        (item) => item.recipeId === recipeId && item.userId === currentUser?.id,
      ),
    [recipeNotes, recipeId, currentUser?.id],
  );
  const [body, setBody] = useState(existing?.body || '');
  const [editing, setEditing] = useState(!existing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBody(existing?.body || '');
    setEditing(!existing);
  }, [existing?.id, recipeId]);

  if (!isAuthenticated) {
    return (
      <article className="detail-card">
        <h3>Your private notes</h3>
        <p className="muted-text">
          Sign in to save personal notes on this recipe — substitutions, kitchen tweaks, and reminders for next time.
        </p>
        <Link className="button button--ghost" to="/login">Sign in</Link>
      </article>
    );
  }

  const handleSave = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await saveRecipeNote(recipeId, body.trim());
      setEditing(false);
    } catch (error) {
      // toast handled in context
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteRecipeNote(recipeId);
      setBody('');
      setEditing(true);
    } catch (error) {
      // toast handled in context
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="detail-card">
      <h3>Your private notes</h3>
      <p className="muted-text">
        Only you can see these. Saved to your account so they follow you between devices.
      </p>
      {editing ? (
        <>
          <textarea
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Substitutions, timing tweaks, or reminders for next time…"
            style={{ width: '100%' }}
          />
          <div className="button-row">
            {existing && (
              <button type="button" className="button button--ghost" onClick={() => { setEditing(false); setBody(existing.body); }}>
                Cancel
              </button>
            )}
            <button type="button" className="button button--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Update note' : 'Save note'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ whiteSpace: 'pre-wrap' }}>{existing?.body}</p>
          <div className="button-row">
            <button type="button" className="button button--ghost" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="button button--danger" onClick={handleDelete} disabled={saving}>
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  );
};
