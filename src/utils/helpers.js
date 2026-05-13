export const appStorageKey = 'saffron-table-state-v2';
export const authStorageKey = 'saffron-table-auth-v1';

export const createSlug = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const createId = (prefix = 'item') =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const groupBy = (items, selector) =>
  items.reduce((acc, item) => {
    const key = selector(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

export const uniqueValues = (items) => [...new Set(items.filter(Boolean))];

export const capitalize = (value = '') =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getTotalTime = (recipe) => recipe.prepTime + recipe.cookTime;

export const getAverageRating = (reviews) => {
  if (!reviews.length) return 0;
  return (
    reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) /
    reviews.length
  );
};

export const formatTime = (minutes) => {
  if (!minutes) return '0 mins';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} mins` : `${hours} hr`;
};

export const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const reorder = (items, compareFn) => [...items].sort(compareFn);

export const matchText = (value = '', query = '') =>
  value.toLowerCase().includes(query.toLowerCase());

export const getRecipeSuggestions = (recipes, query) => {
  if (!query.trim()) return [];
  const normalized = query.toLowerCase();
  return recipes
    .filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(normalized) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(normalized),
        ),
    )
    .slice(0, 5);
};

export const buildShoppingList = (recipes) => {
  const bucket = {};
  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = `${ingredient.category}-${ingredient.name}`;
      if (!bucket[key]) {
        bucket[key] = {
          id: key,
          name: ingredient.name,
          category: ingredient.category,
          quantity: `${ingredient.amount} ${ingredient.unit}`.trim(),
          checked: false,
        };
      }
    });
  });
  return Object.values(bucket);
};

export const getCollectionRecipes = (collection, recipes) =>
  recipes.filter((recipe) => collection.recipeIds.includes(recipe.id));

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const resolveImage = (url, width = 1200) =>
  `${url}&w=${width}&auto=format&fit=crop`;

export const getRecipeBySlug = (recipes, slug) =>
  recipes.find((recipe) => recipe.slug === slug);

export const getBlogBySlug = (posts, slug) =>
  posts.find((post) => post.slug === slug);

const normalizeIngredientName = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const ingredientMatches = (ingredient, pantryItem) => {
  const a = normalizeIngredientName(ingredient);
  const b = normalizeIngredientName(pantryItem);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

export const scaleIngredient = (ingredient, scale) => {
  const amount = Number(ingredient.amount);
  if (!amount || Number.isNaN(amount)) return ingredient;
  const scaled = amount * scale;
  const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 100) / 100;
  return { ...ingredient, amount: rounded };
};

export const extractTimerMinutes = (instruction = '') => {
  const text = instruction.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  const minuteMatch = text.match(/(\d+)(?:\s*-\s*\d+)?\s*(?:minute|min)s?/);
  if (minuteMatch) return Number(minuteMatch[1]);
  const secondMatch = text.match(/(\d+)\s*(?:second|sec)s?/);
  if (secondMatch) return Math.max(1, Math.round(Number(secondMatch[1]) / 60));
  return null;
};

export const computePantryMatch = (recipe, pantry = []) => {
  const total = recipe.ingredients?.length || 0;
  if (!total) return { score: 0, matched: [], missing: [] };
  const matched = [];
  const missing = [];
  recipe.ingredients.forEach((ingredient) => {
    const inPantry = pantry.some((item) => ingredientMatches(ingredient.name, item));
    (inPantry ? matched : missing).push(ingredient);
  });
  return {
    score: Math.round((matched.length / total) * 100),
    matched,
    missing,
  };
};

export const formatRelativeTime = (value) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};
