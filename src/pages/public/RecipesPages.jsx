import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs, EmptyState, FilterSidebar, LoadingGrid, PageHero, Pagination, PlanCookSubnav, SearchBar, SectionHeader, SortDropdown } from '../../components/common/UI';
import { CategoryCard, CuisineCard, RecipeCard } from '../../components/shared/Cards';
import { groupBy, matchText, reorder } from '../../utils/helpers';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rating' },
  { value: 'time', label: 'Quickest total time' },
];

const applyRecipeFilters = (recipes, query, filters) =>
  recipes.filter((recipe) => {
    const matchesQuery =
      !query ||
      recipe.title.toLowerCase().includes(query.toLowerCase()) ||
      recipe.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
      recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = !filters.category || recipe.category === filters.category;
    const matchesCuisine = !filters.cuisine || recipe.cuisine === filters.cuisine;
    const matchesMealType = !filters.mealType || recipe.mealType === filters.mealType;
    const matchesDietType = !filters.dietType || recipe.dietType === filters.dietType;
    const matchesDifficulty = !filters.difficulty || recipe.difficulty === filters.difficulty;
    const matchesPantry = !filters.pantryFriendly || recipe.pantryFriendly;
    const matchesTime = !filters.totalTime || recipe.totalTime <= Number(filters.totalTime);
    const matchesIngredient =
      !filters.ingredients ||
      recipe.ingredients.some((ingredient) => matchText(ingredient.name, filters.ingredients));
    const matchesTag = !filters.tag || recipe.tags.includes(filters.tag);
    return (
      matchesQuery &&
      matchesCategory &&
      matchesCuisine &&
      matchesMealType &&
      matchesDietType &&
      matchesDifficulty &&
      matchesPantry &&
      matchesTime &&
      matchesIngredient &&
      matchesTag
    );
  });

const sortRecipes = (recipes, sort) => {
  switch (sort) {
    case 'popular':
      return reorder(recipes, (a, b) => b.reviewCount - a.reviewCount);
    case 'rating':
      return reorder(recipes, (a, b) => b.rating - a.rating);
    case 'time':
      return reorder(recipes, (a, b) => a.totalTime - b.totalTime);
    default:
      return reorder(recipes, (a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const CompareStrip = () => {
  const { compareRecipes, recipes, toggleCompareRecipe } = useApp();
  const compared = recipes.filter((recipe) => compareRecipes.includes(recipe.id));
  if (!compared.length) return null;
  return (
    <div className="compare-strip">
      <div>
        <strong>Recipe comparison</strong>
        <span>Select up to 3 recipes to compare timing, cost, diet, and difficulty.</span>
      </div>
      <div className="compare-strip__items">
        {compared.map((recipe) => (
          <div key={recipe.id} className="compare-item">
            <strong>{recipe.title}</strong>
            <small>
              {recipe.totalTime} mins • {recipe.dietType} • ${recipe.estimatedCost}
            </small>
            <button type="button" onClick={() => toggleCompareRecipe(recipe.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecipesPage = () => {
  const { recipes } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    cuisine: '',
    mealType: '',
    dietType: '',
    difficulty: '',
    pantryFriendly: '',
    totalTime: '',
    ingredients: '',
    tag: '',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () => sortRecipes(applyRecipeFilters(recipes, deferredQuery, filters), sort),
    [deferredQuery, filters, recipes, sort],
  );
  const pageCount = Math.ceil(filtered.length / 6) || 1;
  const paginated = filtered.slice((page - 1) * 6, page * 6);

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, filters, sort]);

  return (
    <div className="page-shell">
      <div className="container">
        <PageHero
          eyebrow="Recipe index"
          title="A full recipe library with deep filters and quick decision support."
          description="Browse by cuisine, category, diet, ingredients, pantry comfort, or tonight’s timing constraints."
          image={recipes[0].image}
          compact
        >
          <SearchBar value={query} onChange={setQuery} searchPool={recipes} />
        </PageHero>
      </div>
      <section className="container recipe-listing-layout">
        <FilterSidebar
          filters={filters}
          onChange={(key, value) =>
            startTransition(() => {
              setFilters((current) => ({ ...current, [key]: value }));
            })
          }
          recipes={recipes}
        />
        <div className="listing-main">
          <div className="listing-toolbar">
            <p>{filtered.length} recipes found</p>
            <SortDropdown
              value={sort}
              onChange={(value) =>
                startTransition(() => {
                  setSort(value);
                })
              }
              options={sortOptions}
            />
          </div>
          {loading ? (
            <LoadingGrid count={6} />
          ) : paginated.length ? (
            <>
              <div className="card-grid">
                {paginated.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </>
          ) : (
            <EmptyState
              title="No recipes matched this filter combination"
              description="Try a broader ingredient, remove a strict timing filter, or switch to another cuisine."
            />
          )}
        </div>
      </section>
      <div className="container">
        <CompareStrip />
      </div>
    </div>
  );
};

const FilteredShowcasePage = ({ type }) => {
  const { slug } = useParams();
  const { recipes, categories, cuisines } = useApp();
  const dataset = type === 'category' ? categories : cuisines;
  const item = dataset.find((entry) => entry.slug === slug);
  const filteredRecipes = recipes.filter((recipe) =>
    type === 'category' ? recipe.category.toLowerCase() === item?.name.toLowerCase() : recipe.cuisine.toLowerCase() === item?.name.toLowerCase(),
  );

  if (!item) {
    return (
      <div className="container page-shell">
        <EmptyState title="We couldn’t find that page" description="The category or cuisine may have moved." action={<Link className="button button--primary" to="/recipes">Browse recipe index</Link>} />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Recipes', to: '/recipes' },
            { label: type === 'category' ? 'Categories' : 'Cuisines' },
            { label: item.name },
          ]}
        />
        <PageHero eyebrow={type === 'category' ? 'Recipe category' : 'Cuisine guide'} title={item.name} description={item.description} image={item.image} compact />
      </div>
      <section className="container section-space">
        <SectionHeader title={`${item.name} recipes`} description="A focused collection tailored to this browsing path." />
        <div className="card-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
      <section className="container section-space">
        <SectionHeader title={type === 'category' ? 'Explore more categories' : 'Explore more cuisines'} />
        <div className="visual-grid">
          {(type === 'category' ? categories : cuisines)
            .filter((entry) => entry.slug !== slug)
            .slice(0, 3)
            .map((entry) =>
              type === 'category' ? <CategoryCard key={entry.id} item={entry} /> : <CuisineCard key={entry.id} item={entry} />,
            )}
        </div>
      </section>
    </div>
  );
};

export const CategoryPage = () => <FilteredShowcasePage type="category" />;
export const CuisinePage = () => <FilteredShowcasePage type="cuisine" />;

export const RecipesSavedPage = () => {
  const { favorites, recipes, collections } = useApp();
  const savedRecipes = recipes.filter((recipe) => favorites.includes(recipe.id));
  const grouped = groupBy(savedRecipes, (recipe) => recipe.category);
  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Plan & cook', to: '/meal-planner' }, { label: 'Saved recipes' }]} />
        <PlanCookSubnav />
        <PageHero eyebrow="Saved recipes" title="Your private recipe corner" description="Keep favorites organized by category and springboard them into collections or meal plans." image={savedRecipes[0]?.image || collections[0].image} compact />
      </div>
      <section className="container section-space">
        {savedRecipes.length ? (
          Object.entries(grouped).map(([group, items]) => (
            <div className="section-space" key={group}>
              <SectionHeader title={group} description={`${items.length} saved recipes in this folder`} />
              <div className="card-grid">
                {items.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No saved recipes yet"
            description="Start bookmarking recipes to build your own weeknight playbook."
            action={
              <Link className="button button--primary" to="/recipes">
                Explore recipes
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
};

export const MealPlannerPage = () => {
  const { mealPlan, recipes, setMealPlanSlot, autoFillMealPlan, syncShoppingListFromRecipeIds, addToast } = useApp();
  const days = Object.keys(mealPlan);
  const meals = ['breakfast', 'lunch', 'dinner'];
  const plannedIds = Object.values(mealPlan).flatMap((entry) => Object.values(entry).filter(Boolean));

  const onDropRecipe = (event, day, meal) => {
    const recipeId = event.dataTransfer.getData('text/plain');
    if (recipeId) setMealPlanSlot(day, meal, recipeId);
  };

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Plan & cook', to: '/saved' }, { label: 'Meal planner' }]} />
        <PlanCookSubnav />
        <PageHero eyebrow="Meal planner" title="Build your week with drag-and-drop recipe planning" description="Drag recipes into each slot, auto-fill a smart draft, and generate a shopping list instantly." image={recipes[1].image} compact>
          <div className="button-row">
            <button className="button button--primary" type="button" onClick={autoFillMealPlan}>
              Auto plan week
            </button>
            <button className="button button--ghost" type="button" onClick={() => syncShoppingListFromRecipeIds(plannedIds)}>
              Create shopping list
            </button>
            <button className="button button--ghost" type="button" onClick={() => addToast('Meal plan saved locally.')}>
              Save plan
            </button>
          </div>
        </PageHero>
      </div>
      <section className="container planner-layout">
        <div className="planner-board">
          {days.map((day) => (
            <article key={day} className="planner-day">
              <h3>{day}</h3>
              {meals.map((meal) => {
                const recipe = recipes.find((item) => item.id === mealPlan[day][meal]);
                return (
                  <div
                    key={meal}
                    className="planner-slot"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropRecipe(event, day, meal)}
                  >
                    <span>{meal}</span>
                    {recipe ? (
                      <div className="planner-slot__recipe">
                        <strong>{recipe.title}</strong>
                        <small>{recipe.totalTime} mins</small>
                      </div>
                    ) : (
                      <p>Drop a recipe here</p>
                    )}
                  </div>
                );
              })}
            </article>
          ))}
        </div>
        <aside className="planner-sidebar">
          <SectionHeader title="Recipe pool" description="Drag these recipe cards onto a meal slot." />
          <div className="stack-gap">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', recipe.id)}
                className="draggable-recipe"
              >
                <img src={recipe.image} alt={recipe.title} />
                <div>
                  <strong>{recipe.title}</strong>
                  <small>
                    {recipe.totalTime} mins • {recipe.dietType}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

export const ShoppingListPage = () => {
  const { shoppingList, favorites, recipes, mealPlan, syncShoppingListFromRecipeIds, toggleShoppingItem, clearShoppingList } = useApp();
  const grouped = groupBy(shoppingList, (item) => item.category);
  const savedRecipeIds = favorites.filter(Boolean);
  const plannerRecipeIds = Object.values(mealPlan).flatMap((day) => Object.values(day).filter(Boolean));

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Plan & cook', to: '/saved' }, { label: 'Shopping list' }]} />
        <PlanCookSubnav />
        <PageHero eyebrow="Shopping list" title="Ingredient shopping grouped by grocery aisle" description="Generate a list from saved recipes or your weekly planner, then check off items as you shop." image={recipes[2].image} compact>
          <div className="button-row">
            <button className="button button--primary" type="button" onClick={() => syncShoppingListFromRecipeIds(savedRecipeIds)}>
              Import saved recipes
            </button>
            <button className="button button--ghost" type="button" onClick={() => syncShoppingListFromRecipeIds(plannerRecipeIds)}>
              Import planner meals
            </button>
            <button className="button button--ghost" type="button" onClick={clearShoppingList}>
              Clear list
            </button>
          </div>
        </PageHero>
      </div>
      <section className="container section-space">
        {shoppingList.length ? (
          <div className="shopping-groups">
            {Object.entries(grouped).map(([group, items]) => (
              <article key={group} className="detail-card">
                <h3>{group}</h3>
                <ul className="shopping-list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <label>
                        <input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)} />
                        <span>{item.name}</span>
                      </label>
                      <small>{item.quantity}</small>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your shopping list is empty"
            description="Build it from saved recipes or from the weekly meal planner."
            action={
              <Link className="button button--primary" to="/meal-planner">
                Open meal planner
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
};

export default RecipesPage;
