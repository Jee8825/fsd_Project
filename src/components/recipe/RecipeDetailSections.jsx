import { useMemo, useState } from 'react';
import { Breadcrumbs, Chip, InfoPill, RatingStars } from '../common/UI';
import { currency, formatTime } from '../../utils/helpers';

export const RecipeMetaHeader = ({ recipe, author }) => (
  <section className="recipe-hero">
    <div className="recipe-hero__content">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Recipes', to: '/recipes' }, { label: recipe.title }]} />
      <div className="hero-badges">
        <Chip tone="accent">{recipe.category}</Chip>
        <Chip tone="warm">{recipe.dietType}</Chip>
        {recipe.trending && <Chip tone="default">Trending now</Chip>}
      </div>
      <h1>{recipe.title}</h1>
      <p>{recipe.fullDescription}</p>
      <div className="author-inline">
        <img src={author.avatar} alt={author.name} loading="lazy" decoding="async" />
        <div>
          <strong>{author.name}</strong>
          <span>{author.specialty}</span>
        </div>
      </div>
      <RatingStars value={recipe.rating} count={recipe.reviewCount} />
      <div className="quick-stats">
        <InfoPill label="Prep" value={formatTime(recipe.prepTime)} />
        <InfoPill label="Cook" value={formatTime(recipe.cookTime)} />
        <InfoPill label="Total" value={formatTime(recipe.totalTime)} />
        <InfoPill label="Serves" value={recipe.servings} />
        <InfoPill label="Cost" value={currency(recipe.estimatedCost)} />
      </div>
    </div>
    <div className="recipe-hero__visual">
      <img src={recipe.image} alt={recipe.title} loading="eager" fetchPriority="high" decoding="async" />
    </div>
  </section>
);

export const JumpNav = () => {
  const links = [
    ['ingredients', 'Ingredients'],
    ['instructions', 'Method'],
    ['nutrition', 'Nutrition'],
    ['notes', 'Chef Notes'],
    ['reviews', 'Reviews'],
  ];

  return (
    <div className="jump-nav">
      <strong>Jump to recipe</strong>
      <div>
        {links.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
};

export const IngredientsChecklist = ({ recipe }) => {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState([]);

  const scaledIngredients = useMemo(
    () =>
      recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        scaledAmount: ((ingredient.amount / recipe.servings) * servings).toFixed(ingredient.amount % 1 ? 1 : 0),
      })),
    [recipe.ingredients, recipe.servings, servings],
  );

  return (
    <section className="detail-card" id="ingredients">
      <div className="detail-card__header">
        <h2>Ingredients</h2>
        <div className="servings-switcher">
          <button type="button" onClick={() => setServings((value) => Math.max(1, value - 1))}>
            −
          </button>
          <span>{servings} servings</span>
          <button type="button" onClick={() => setServings((value) => value + 1)}>
            +
          </button>
        </div>
      </div>
      <ul className="ingredient-list">
        {scaledIngredients.map((ingredient) => (
          <li key={ingredient.name}>
            <label>
              <input
                type="checkbox"
                checked={checked.includes(ingredient.name)}
                onChange={() =>
                  setChecked((current) =>
                    current.includes(ingredient.name)
                      ? current.filter((item) => item !== ingredient.name)
                      : [...current, ingredient.name],
                  )
                }
              />
              <span>
                {ingredient.scaledAmount} {ingredient.unit} {ingredient.name}
              </span>
            </label>
            <small>{ingredient.category}</small>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const InstructionSteps = ({ recipe }) => (
  <section className="detail-card" id="instructions">
    <h2>Step-by-step</h2>
    <ol className="instruction-list">
      {recipe.instructions.map((step, index) => (
        <li key={step}>
          <span>{index + 1}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  </section>
);

export const NutritionBox = ({ recipe }) => (
  <section className="detail-card" id="nutrition">
    <h2>Nutrition facts</h2>
    <div className="nutrition-grid">
      <InfoPill label="Calories" value={recipe.calories} />
      <InfoPill label="Protein" value={`${recipe.protein}g`} />
      <InfoPill label="Carbs" value={`${recipe.carbs}g`} />
      <InfoPill label="Fat" value={`${recipe.fat}g`} />
    </div>
  </section>
);

export const FAQAccordion = ({ items }) => {
  const [open, setOpen] = useState(items[0]?.question || null);
  return (
    <section className="detail-card" id="notes">
      <h2>Tips, substitutions, and FAQ</h2>
      <div className="stack-gap">
        {items.map((item) => (
          <button
            type="button"
            key={item.question}
            className={`accordion-item ${open === item.question ? 'open' : ''}`}
            onClick={() => setOpen((current) => (current === item.question ? null : item.question))}
          >
            <div className="accordion-item__head">
              <strong>{item.question}</strong>
              <span>{open === item.question ? '−' : '+'}</span>
            </div>
            {open === item.question && <p>{item.answer}</p>}
          </button>
        ))}
      </div>
    </section>
  );
};
