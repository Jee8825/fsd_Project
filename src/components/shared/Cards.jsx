import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { currency, formatDate, formatTime, getInitials } from '../../utils/helpers';
import { Chip, RatingStars } from '../common/UI';

export const RecipeCard = ({ recipe, showActions = true, compact = false }) => {
  const { favorites, toggleFavorite, toggleCompareRecipe, compareRecipes } = useApp();
  const isFavorite = favorites.includes(recipe.id);
  const isComparing = compareRecipes.includes(recipe.id);
  return (
    <article className={`recipe-card ${compact ? 'compact' : ''}`}>
      <Link to={`/recipes/${recipe.slug}`} className="recipe-card__image">
        <img src={recipe.image} alt={recipe.title} loading="lazy" decoding="async" />
        <div className="recipe-card__overlay">
          <Chip tone="accent">{recipe.difficulty}</Chip>
          {recipe.trending && <Chip tone="warm">Trending</Chip>}
        </div>
      </Link>
      <div className="recipe-card__body">
        <div className="recipe-card__meta">
          <span>{recipe.category}</span>
          <span>{recipe.cuisine}</span>
        </div>
        <Link to={`/recipes/${recipe.slug}`}>
          <h3>{recipe.title}</h3>
        </Link>
        <p>{recipe.shortDescription}</p>
        <div className="recipe-card__stats">
          <span>{formatTime(recipe.totalTime)}</span>
          <span>{currency(recipe.estimatedCost)}</span>
          <span>{recipe.dietType}</span>
        </div>
        <RatingStars value={recipe.rating} count={recipe.reviewCount} />
        {showActions && (
          <div className="card-actions">
            <button type="button" className="button button--ghost" onClick={() => toggleFavorite(recipe.id)}>
              {isFavorite ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="button button--ghost" onClick={() => toggleCompareRecipe(recipe.id)}>
              {isComparing ? 'Comparing' : 'Compare'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export const CategoryCard = ({ item, prefix = '/category' }) => (
  <Link to={`${prefix}/${item.slug}`} className="visual-card">
    <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
    <div className="visual-card__content">
      <span className="eyebrow">Discover</span>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  </Link>
);

export const CuisineCard = ({ item }) => <CategoryCard item={item} prefix="/cuisine" />;

export const BlogCard = ({ post, author }) => (
  <article className="blog-card">
    <Link to={`/blog/${post.slug}`} className="blog-card__image">
      <img src={post.coverImage} alt={post.title} loading="lazy" decoding="async" />
    </Link>
    <div className="blog-card__body">
      <div className="recipe-card__meta">
        <span>{post.category}</span>
        <span>{post.readTime} min read</span>
      </div>
      <Link to={`/blog/${post.slug}`}>
        <h3>{post.title}</h3>
      </Link>
      <p>{post.excerpt}</p>
      <div className="blog-card__footer">
        {author && (
          <div className="avatar-inline">
            <img src={author.avatar} alt={author.name} loading="lazy" decoding="async" />
            <span>{author.name}</span>
          </div>
        )}
        <small>{formatDate(post.createdAt)}</small>
      </div>
    </div>
  </article>
);

export const AuthorCard = ({ author, recipeCount, postCount }) => (
  <Link to={`/authors/${author.slug}`} className="author-card">
    <img src={author.avatar} alt={author.name} loading="lazy" decoding="async" />
    <div>
      <h3>{author.name}</h3>
      <p>{author.specialty}</p>
      <small>
        {recipeCount} recipes • {postCount} posts
      </small>
    </div>
  </Link>
);

export const CollectionCard = ({ collection, recipeCount }) => (
  <Link to={`/collections/${collection.slug}`} className="collection-card">
    <img src={collection.image} alt={collection.title} loading="lazy" decoding="async" />
    <div className="collection-card__content">
      <span className="eyebrow">Curated collection</span>
      <h3>{collection.title}</h3>
      <p>{collection.description}</p>
      <strong>{recipeCount} recipes</strong>
    </div>
  </Link>
);

export const ReviewCard = ({ review, userName }) => (
  <article className="review-card">
    <div className="review-card__top">
      <div className="avatar-fallback">{getInitials(userName)}</div>
      <div>
        <strong>{userName}</strong>
        <RatingStars value={review.rating} />
      </div>
    </div>
    <p>{review.comment}</p>
    <small>{formatDate(review.createdAt)}</small>
  </article>
);
