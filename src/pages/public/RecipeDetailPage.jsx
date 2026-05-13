import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { RecipeCard, ReviewCard } from '../../components/shared/Cards';
import { EmptyState, RecipeNotesPanel } from '../../components/common/UI';
import {
  FAQAccordion,
  IngredientsChecklist,
  InstructionSteps,
  JumpNav,
  NutritionBox,
  RecipeMetaHeader,
} from '../../components/recipe/RecipeDetailSections';
import CookMode from '../../components/recipe/CookMode';
import { Chip, SectionHeader } from '../../components/common/UI';
import { formatDate } from '../../utils/helpers';

const RecipeDetailPage = () => {
  const { slug } = useParams();
  const { recipes, authors, reviews, users, toggleFavorite, favorites, submitReview, addRecentlyViewed, addToast, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const recipe = recipes.find((item) => item.slug === slug);
  const [cookOpen, setCookOpen] = useState(false);

  const approvedReviews = useMemo(
    () => reviews.filter((review) => review.recipeId === recipe?.id && review.status === 'approved'),
    [recipe?.id, reviews],
  );

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { rating: 5, comment: '' },
  });

  useEffect(() => {
    if (recipe) addRecentlyViewed(recipe.id);
  }, [addRecentlyViewed, recipe]);

  if (!recipe) {
    return (
      <div className="container page-shell">
        <EmptyState
          title="Recipe not found"
          description="That recipe may have been moved or renamed."
          action={
            <Link className="button button--primary" to="/recipes">
              Browse recipe index
            </Link>
          }
        />
      </div>
    );
  }

  const author = authors.find((item) => item.id === recipe.authorId) || authors[0];
  const relatedRecipes = recipes
    .filter((item) => item.id !== recipe.id && (item.category === recipe.category || item.cuisine === recipe.cuisine))
    .slice(0, 3);

  const handleShare = async () => {
    const shareData = { title: recipe.title, text: recipe.shortDescription, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Recipe link copied to clipboard.');
    }
  };

  const onSubmit = (values) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/recipes/${slug}` } } });
      return;
    }
    submitReview({ recipeId: recipe.id, rating: Number(values.rating), comment: values.comment });
    reset({ rating: 5, comment: '' });
  };

  return (
    <div className="page-shell">
      <div className="container">
        <RecipeMetaHeader recipe={recipe} author={author} />
        <JumpNav />
      </div>

      <section className="container detail-layout">
        <div className="detail-main">
          <IngredientsChecklist recipe={recipe} />
          <InstructionSteps recipe={recipe} />
          <NutritionBox recipe={recipe} />
          <section className="detail-card">
            <h2>Chef notes</h2>
            <ul className="plain-list">
              {recipe.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <h3>Substitutions</h3>
            <ul className="plain-list">
              {recipe.substitutions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Storage</h3>
            <p>{recipe.storage}</p>
          </section>
          <FAQAccordion items={recipe.faq.length ? recipe.faq : [{ question: 'Can I customize this recipe?', answer: 'Yes. Use the substitution notes and adjust seasoning to your taste.' }]} />
          <RecipeNotesPanel recipeId={recipe.id} />
          <section className="detail-card" id="reviews">
            <SectionHeader eyebrow="Community" title="Comments and reviews" description="Notes from readers and a space to add your own feedback." />
            <div className="card-grid compact">
              {approvedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} userName={users.find((user) => user.id === review.userId)?.name || 'Reader'} />
              ))}
            </div>
            {!isAuthenticated && (
              <div className="auth-inline-banner">
                <p>Sign in to leave a review and sync your comments with your account.</p>
                <Link className="button button--primary" to="/login" state={{ from: { pathname: `/recipes/${slug}` } }}>
                  Sign in
                </Link>
              </div>
            )}
            <form className="form-grid review-form" onSubmit={handleSubmit(onSubmit)}>
              <label>
                <span>Rating</span>
                <select {...register('rating', { required: true })}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} stars
                    </option>
                  ))}
                </select>
              </label>
              <label className="full-span">
                <span>Comment</span>
                <textarea {...register('comment', { required: 'Please add a short review.' })} rows="4" placeholder="What worked? Any adaptations worth sharing?" />
                {errors.comment && <small className="field-error">{errors.comment.message}</small>}
              </label>
              <button className="button button--primary" type="submit">
                Publish review
              </button>
            </form>
          </section>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-card sticky-card">
            <h3>Recipe details</h3>
            <div className="stack-gap">
              <div className="meta-row"><span>Category</span><strong>{recipe.category}</strong></div>
              <div className="meta-row"><span>Cuisine</span><strong>{recipe.cuisine}</strong></div>
              <div className="meta-row"><span>Difficulty</span><strong>{recipe.difficulty}</strong></div>
              <div className="meta-row"><span>Meal type</span><strong>{recipe.mealType}</strong></div>
              <div className="meta-row"><span>Published</span><strong>{formatDate(recipe.createdAt)}</strong></div>
              <div className="tag-row">
                {recipe.tags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
            </div>
            <div className="stack-gap top-gap">
              <button type="button" className="button button--primary" onClick={() => setCookOpen(true)}>
                Start cook mode
              </button>
              <button type="button" className="button button--ghost" onClick={() => window.print()}>
                Print recipe
              </button>
              <button type="button" className="button button--ghost" onClick={() => toggleFavorite(recipe.id)}>
                {favorites.includes(recipe.id) ? 'Remove bookmark' : 'Save recipe'}
              </button>
              <button type="button" className="button button--ghost" onClick={handleShare}>
                Share recipe
              </button>
            </div>
          </div>
        </aside>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Related recipes" title="You may also want to cook" description="Similar flavor profiles, cuisine notes, or dinner energy." />
        <div className="card-grid">
          {relatedRecipes.map((item) => (
            <RecipeCard key={item.id} recipe={item} />
          ))}
        </div>
      </section>

      <CookMode open={cookOpen} recipe={recipe} onClose={() => setCookOpen(false)} />
    </div>
  );
};

export default RecipeDetailPage;
