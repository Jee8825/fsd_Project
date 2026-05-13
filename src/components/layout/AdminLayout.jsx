import { Link, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AdminNavLink, ThemeToggle, ToastViewport } from '../common/UI';
import NotificationCenter from '../common/NotificationCenter';

const AdminLayout = () => {
  const { settings, backendConnected, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand-mark admin-brand">
          <span className="brand-mark__badge">S</span>
          <div>
            <strong>{settings.logoText}</strong>
            <small>{isAdmin ? 'Admin workspace' : 'Editor workspace'}</small>
          </div>
        </Link>
        <nav className="admin-nav">
          <AdminNavLink to="/admin">Overview</AdminNavLink>
          <AdminNavLink to="/admin/recipes">Recipes</AdminNavLink>
          <AdminNavLink to="/admin/categories">Categories</AdminNavLink>
          <AdminNavLink to="/admin/cuisines">Cuisines</AdminNavLink>
          <AdminNavLink to="/admin/blogs">Blog Posts</AdminNavLink>
          <AdminNavLink to="/admin/authors">Authors</AdminNavLink>
          <AdminNavLink to="/admin/reviews">Reviews</AdminNavLink>
          <AdminNavLink to="/admin/collections">Collections</AdminNavLink>
          <AdminNavLink to="/admin/announcements">Announcements</AdminNavLink>
          <AdminNavLink to="/admin/messages">Messages</AdminNavLink>
          <AdminNavLink to="/admin/submissions">Submissions</AdminNavLink>
          <AdminNavLink to="/admin/audit">Audit log</AdminNavLink>
          {isAdmin && <AdminNavLink to="/admin/users">Users</AdminNavLink>}
          {isAdmin && <AdminNavLink to="/admin/settings">Settings</AdminNavLink>}
        </nav>
        <small className="admin-role-badge">
          Signed in as <strong>{currentUser?.name || 'staff'}</strong> · {currentUser?.role || 'role'}
        </small>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="eyebrow">Control room</p>
            <h1>{isAdmin ? 'Editorial operations dashboard' : 'Editorial workspace'}</h1>
            <small>{backendConnected ? 'Live MongoDB API connected' : 'Using local fallback until backend is available'}</small>
          </div>
          <div className="button-row">
            <Link to="/" className="button button--ghost">
              View site
            </Link>
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </header>
        <Outlet />
      </section>
      <ToastViewport />
    </div>
  );
};

export default AdminLayout;
