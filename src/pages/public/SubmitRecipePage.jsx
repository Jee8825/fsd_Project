import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs, EmptyState, PageHero, PlanCookSubnav, SectionHeader } from '../../components/common/UI';
import { formatRelativeTime } from '../../utils/helpers';

export const SubmitRecipePage = () => {
  const { isAuthenticated, currentUser, recipeSubmissions, submitRecipeIdea, categories, cuisines } = useApp();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      cuisine: '',
      estimatedTime: 30,
      ingredientsText: '',
      instructionsText: '',
    },
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const mySubmissions = recipeSubmissions
    .filter((submission) => submission.userId === currentUser.id)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const onSubmit = async (values) => {
    try {
      await submitRecipeIdea({
        ...values,
        estimatedTime: Number(values.estimatedTime) || 0,
      });
      reset();
    } catch (error) {
      // toast handled in context
    }
  };

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Community' }, { label: 'Submit a recipe' }]} />
        <PlanCookSubnav />
        <PageHero
          eyebrow="Community"
          title="Submit a recipe idea"
          description="Share your favorite dish with our editors. Approved submissions may be developed into full recipes for the site."
          image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80"
          compact
        />
      </div>
      <section className="container section-space two-col">
        <form className="detail-card form-grid" onSubmit={handleSubmit(onSubmit)}>
          <h2>Recipe details</h2>
          <label className="full-span">
            <span>Title</span>
            <input {...register('title', { required: 'Title is required.' })} placeholder="e.g. Smoky tomato dal" />
            {errors.title && <small className="field-error">{errors.title.message}</small>}
          </label>
          <label className="full-span">
            <span>Short description</span>
            <textarea {...register('description', { required: 'Tell us a little about it.' })} rows={3} placeholder="What makes this dish special? Where did you learn it?" />
            {errors.description && <small className="field-error">{errors.description.message}</small>}
          </label>
          <label>
            <span>Category</span>
            <select {...register('category')}>
              <option value="">Select…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Cuisine</span>
            <select {...register('cuisine')}>
              <option value="">Select…</option>
              {cuisines.map((cuisine) => (
                <option key={cuisine.id} value={cuisine.name}>{cuisine.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Estimated total time (minutes)</span>
            <input type="number" min="0" {...register('estimatedTime')} />
          </label>
          <label className="full-span">
            <span>Ingredients (one per line)</span>
            <textarea {...register('ingredientsText')} rows={5} placeholder="2 cups basmati rice&#10;1 tbsp ghee&#10;…" />
          </label>
          <label className="full-span">
            <span>Instructions (one step per line)</span>
            <textarea {...register('instructionsText')} rows={6} placeholder="Rinse rice until water runs clear.&#10;Heat ghee in a heavy-bottom pan.&#10;…" />
          </label>
          <div className="button-row full-span">
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </form>
        <div className="stack-gap">
          <article className="detail-card">
            <h2>Submission tips</h2>
            <ul>
              <li>Be specific with quantities — editors love clear measurements.</li>
              <li>Add a sentence about the origin or memory behind the dish.</li>
              <li>You can keep coming back to add more ideas — submissions are tied to your account.</li>
            </ul>
          </article>
          <article className="detail-card">
            <h2>Status legend</h2>
            <p><strong>Pending</strong> — waiting for editorial review.</p>
            <p><strong>Approved</strong> — passed review; may be developed into a full recipe.</p>
            <p><strong>Rejected</strong> — not a fit right now. Reviewer notes may explain why.</p>
          </article>
        </div>
      </section>
      <section className="container section-space">
        <SectionHeader title="Your submissions" description="Every idea you've sent in, with the latest status from our editors." />
        {mySubmissions.length ? (
          <div className="card-grid compact">
            {mySubmissions.map((submission) => (
              <article key={submission.id} className="detail-card">
                <p className="eyebrow">{submission.status}</p>
                <h3>{submission.title}</h3>
                <small>{submission.createdAt ? formatRelativeTime(submission.createdAt) : ''}</small>
                <p>{submission.description}</p>
                {submission.reviewerNote && (
                  <p><strong>Editor note:</strong> {submission.reviewerNote}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No submissions yet"
            description="Your sent ideas will appear here once submitted."
            action={<Link className="button button--ghost" to="/recipes">Browse recipes</Link>}
          />
        )}
      </section>
    </div>
  );
};

export default SubmitRecipePage;
