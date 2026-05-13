import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { PageHero } from '../../components/common/UI';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, backendConnected } = useApp();
  const destination = location.state?.from?.pathname || '/profile';
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: 'rhea@example.com',
      password: 'admin123',
    },
  });

  const onSubmit = async (values) => {
    try {
      await login(values.email, values.password);
      navigate(destination, { replace: true });
    } catch (error) {
      setError('root', { message: error.message || 'Unable to sign in.' });
    }
  };

  return (
    <div className="page-shell">
      <div className="container">
        <PageHero
          eyebrow="Sign in"
          title="Access your kitchen dashboard and personal tools."
          description="Sign in to manage saved recipes, your planner, shopping list, and admin operations."
          image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80"
          compact
        />
      </div>
      <section className="container section-space two-col">
        <form className="detail-card form-grid auth-card" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="full-span">Welcome back</h2>
          <label>
            <span>Email</span>
            <input type="email" {...register('email', { required: 'Email is required.' })} />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </label>
          <label>
            <span>Password</span>
            <input type="password" {...register('password', { required: 'Password is required.' })} />
            {errors.password && <small className="field-error">{errors.password.message}</small>}
          </label>
          {errors.root && <small className="field-error full-span">{errors.root.message}</small>}
          <div className="button-row full-span">
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="stack-gap">
          <article className="detail-card">
            <h2>Demo accounts</h2>
            <p>`rhea@example.com / admin123`</p>
            <p>`omar@example.com / editor123`</p>
            <p>`mina@example.com / viewer123`</p>
          </article>
          <article className="detail-card">
            <h2>Connection status</h2>
            <p>{backendConnected ? 'Backend reachable. JWT login is active.' : 'Backend offline. Start Mongo + API server before signing in.'}</p>
            <p>Copy `.env.example` to `.env`, start MongoDB, then run `npm run dev:full`.</p>
          </article>
          <Link className="button button--ghost" to="/">
            Return to homepage
          </Link>
        </div>
      </section>
    </div>
  );
};

export const AccessDeniedPage = () => {
  const { isAuthenticated, currentUser } = useApp();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  return (
  <div className="page-shell">
    <div className="container">
      <section className="not-found-card">
        <span className="eyebrow">Restricted</span>
        <h1>You do not have permission to open this area.</h1>
        <p>
          {isAuthenticated
            ? `Signed in as ${currentUser?.name || 'a member'} (${currentUser?.role}). This section requires a higher role — your session is still active.`
            : 'This route is available only to the required signed-in role.'}
        </p>
        <div className="button-row">
          {isStaff && (
            <Link className="button button--primary" to="/admin">
              Back to dashboard
            </Link>
          )}
          <Link className={isStaff ? 'button button--ghost' : 'button button--primary'} to="/">
            Go home
          </Link>
          {!isAuthenticated && (
            <Link className="button button--ghost" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </section>
    </div>
  </div>
  );
};
