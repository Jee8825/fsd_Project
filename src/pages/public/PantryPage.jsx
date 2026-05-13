import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs, EmptyState, PageHero, PlanCookSubnav, SectionHeader } from '../../components/common/UI';
import { computePantryMatch, uniqueValues } from '../../utils/helpers';

const matchTone = (score) => {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warn';
  return 'muted';
};

const PantryRecipeCard = ({ recipe, match }) => {
  const { addMissingToShoppingList } = useApp();
  return (
    <article className={`pantry-card pantry-card--${matchTone(match.score)}`}>
      <Link to={`/recipes/${recipe.slug}`} className="pantry-card__media">
        <img src={recipe.image} alt={recipe.title} loading="lazy" />
        <div className="pantry-card__badge">
          <strong>{match.score}%</strong>
          <span>match</span>
        </div>
      </Link>
      <div className="pantry-card__body">
        <Link to={`/recipes/${recipe.slug}`}>
          <h3>{recipe.title}</h3>
        </Link>
        <small>
          {match.matched.length} of {recipe.ingredients.length} ingredients on hand • {recipe.totalTime} mins
        </small>
        {match.missing.length > 0 ? (
          <>
            <p className="pantry-card__missing-label">Missing:</p>
            <ul className="pantry-card__missing">
              {match.missing.slice(0, 5).map((ingredient) => (
                <li key={ingredient.name}>{ingredient.name}</li>
              ))}
              {match.missing.length > 5 && <li>+{match.missing.length - 5} more</li>}
            </ul>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => addMissingToShoppingList(match.missing)}
            >
              Add missing to shopping list
            </button>
          </>
        ) : (
          <p className="pantry-card__ready">You have everything you need to cook this now.</p>
        )}
      </div>
    </article>
  );
};

export const PantryPage = () => {
  const { recipes, pantry, addPantryItem, removePantryItem, clearPantry } = useApp();
  const [draft, setDraft] = useState('');
  const [minMatch, setMinMatch] = useState(0);

  const ingredientSuggestions = useMemo(
    () =>
      uniqueValues(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.name))).slice(
        0,
        24,
      ),
    [recipes],
  );

  const ranked = useMemo(() => {
    if (!pantry.length) return [];
    return recipes
      .map((recipe) => ({ recipe, match: computePantryMatch(recipe, pantry) }))
      .filter((entry) => entry.match.score >= minMatch)
      .sort((a, b) => b.match.score - a.match.score);
  }, [recipes, pantry, minMatch]);

  const cookableNow = ranked.filter((entry) => entry.match.score === 100);

  const submit = (event) => {
    event.preventDefault();
    addPantryItem(draft);
    setDraft('');
  };

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Plan & cook', to: '/saved' }, { label: 'Pantry' }]} />
        <PlanCookSubnav />
        <PageHero
          eyebrow="Smart pantry"
          title="Tell us what's in your kitchen — we'll show you what to cook."
          description="Add the ingredients you have on hand. Saffron Table ranks every recipe by how close it is to ready, highlights what's missing, and pushes the gap straight to your shopping list."
          image={recipes[3]?.image || recipes[0].image}
          compact
        />
      </div>

      <section className="container pantry-layout">
        <aside className="pantry-sidebar">
          <div className="detail-card">
            <SectionHeader title="My pantry" description={`${pantry.length} items tracked`} />
            <form className="pantry-form" onSubmit={submit}>
              <input
                type="text"
                value={draft}
                placeholder="e.g. olive oil, garlic, eggs"
                onChange={(event) => setDraft(event.target.value)}
                list="pantry-suggestions"
              />
              <datalist id="pantry-suggestions">
                {ingredientSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <button type="submit" className="button button--primary">
                Add
              </button>
            </form>
            {pantry.length > 0 ? (
              <>
                <div className="pantry-chips">
                  {pantry.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="pantry-chip"
                      onClick={() => removePantryItem(item)}
                      aria-label={`Remove ${item}`}
                    >
                      {item} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="button button--ghost button--small" onClick={clearPantry}>
                  Clear pantry
                </button>
              </>
            ) : (
              <p className="muted-text">Add a few staples to start matching recipes.</p>
            )}
          </div>

          <div className="detail-card">
            <SectionHeader title="Filter" description="Hide low-match recipes" />
            <label className="pantry-range">
              <span>
                Minimum match: <strong>{minMatch}%</strong>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minMatch}
                onChange={(event) => setMinMatch(Number(event.target.value))}
              />
            </label>
            <p className="muted-text">
              {cookableNow.length} recipe{cookableNow.length === 1 ? '' : 's'} ready to cook with zero shopping.
            </p>
          </div>
        </aside>

        <div className="pantry-results">
          {pantry.length === 0 ? (
            <EmptyState
              title="Your pantry is empty"
              description="Add a few ingredients on the left to see recipes you can make right now."
            />
          ) : ranked.length === 0 ? (
            <EmptyState
              title="No recipes match this filter"
              description="Lower the minimum match threshold or add more pantry items."
            />
          ) : (
            <>
              <div className="pantry-summary">
                <strong>{ranked.length}</strong> recipes ranked by your pantry •{' '}
                <strong>{cookableNow.length}</strong> ready right now
              </div>
              <div className="pantry-grid">
                {ranked.map(({ recipe, match }) => (
                  <PantryRecipeCard key={recipe.id} recipe={recipe} match={match} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PantryPage;
