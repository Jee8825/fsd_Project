import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { AuthorCard, BlogCard, CategoryCard, CollectionCard, RecipeCard, ReviewCard } from '../../components/shared/Cards';
import { LoadingGrid, NewsletterCard, PageHero, SearchBar, SectionHeader, StatCard } from '../../components/common/UI';

const HomePage = () => {
  const { settings, recipes, categories, blogPosts, authors, collections, reviews, users, testimonials, recentlyViewed } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 550);
    return () => window.clearTimeout(timer);
  }, []);

  const featuredRecipe = recipes.find((recipe) => recipe.id === settings.featuredHeroRecipeId) || recipes[0];
  const trendingRecipes = recipes.filter((recipe) => recipe.trending).slice(0, 4);
  const editorPicks = recipes.filter((recipe) => recipe.featured).slice(0, 3);
  const seasonalRecipes = recipes.filter((recipe) => recipe.seasonal).slice(0, 3);
  const quickTonight = recipes.filter((recipe) => recipe.totalTime <= 30).slice(0, 4);
  const pantryFavorites = recipes.filter((recipe) => recipe.pantryFriendly).slice(0, 4);
  const readerFavorites = recipes.filter((recipe) => recipe.rating >= 4.7).slice(0, 4);
  const recentViewedRecipes = recipes.filter((recipe) => recentlyViewed.includes(recipe.id)).slice(0, 4);
  const recentPosts = [...blogPosts].slice(0, 3);
  const highlightedReviews = reviews.slice(0, 3).map((review) => ({
    ...review,
    userName: users.find((user) => user.id === review.userId)?.name || 'Community member',
  }));

  const searchedRecipes = useMemo(() => {
    if (!deferredQuery.trim()) return [];
    const normalized = deferredQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(normalized) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(normalized)),
    );
  }, [deferredQuery, recipes]);

  return (
    <div className="page-shell">
      <section className="hero-banner">
        <div className="container hero-banner__grid">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="eyebrow">Premium recipe studio</p>
            <h1>Recipes, stories, and planning tools for a beautifully run kitchen.</h1>
            <p>
              Saffron Table blends editorial-quality food inspiration with practical planning features for home cooks who
              want polished meals, saved collections, and smart weekly flow.
            </p>
            <div className="hero-banner__actions">
              <Link className="button button--primary" to="/recipes">
                Explore recipes
              </Link>
              <Link className="button button--ghost" to="/meal-planner">
                Plan this week
              </Link>
            </div>
            <SearchBar value={query} onChange={setQuery} searchPool={recipes} />
            {query && (
              <div className="search-result-panel">
                <div className="section-header tight">
                  <h3>Search suggestions</h3>
                </div>
                <div className="card-grid compact">
                  {searchedRecipes.slice(0, 4).map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} compact />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
          <div className="hero-banner__feature">
            <img src={featuredRecipe.image} alt={featuredRecipe.title} loading="eager" fetchPriority="high" decoding="async" />
            <div className="hero-banner__feature-card">
              <span className="eyebrow">Featured recipe</span>
              <h2>{featuredRecipe.title}</h2>
              <p>{featuredRecipe.shortDescription}</p>
              <Link to={`/recipes/${featuredRecipe.slug}`}>See the recipe</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-grid three">
        <StatCard label="Curated recipes" value={`${recipes.length}+`} meta="Across categories, cuisines, and diet styles" />
        <StatCard label="Editorial stories" value={`${blogPosts.length}+`} meta="Food journal pieces and kitchen guides" />
        <StatCard label="Active planners" value="1.2k" meta="Home cooks saving plans and shopping lists weekly" />
      </section>

      <section className="container section-space">
        <SectionHeader
          eyebrow="Browse"
          title="Featured categories"
          description="From weekday dinners to celebratory sweets, browse the main corners of the platform."
          action={
            <Link className="button button--ghost" to="/recipes">
              View all recipes
            </Link>
          }
        />
        <div className="visual-grid">
          {categories.slice(0, 6).map((category) => (
            <CategoryCard key={category.id} item={category} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Trending now" title="Reader favorites this week" description="The recipes the community is saving, reviewing, and remaking right now." />
        {loading ? <LoadingGrid count={4} /> : <div className="card-grid">{trendingRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>}
      </section>

      {recentViewedRecipes.length > 0 && (
        <section className="container section-space">
          <SectionHeader eyebrow="Recently viewed" title="Pick up where you left off" description="A quick row of recipes you opened recently, so rediscovery feels effortless." />
          <div className="card-grid">
            {recentViewedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      <section className="container feature-strip">
        <div className="feature-strip__intro">
          <p className="eyebrow">What to cook tonight?</p>
          <h2>Quick, elegant, and weeknight-safe recipes.</h2>
          <p>These recipes land under 30 minutes and still feel layered, polished, and worth serving to guests.</p>
        </div>
        <div className="feature-strip__grid">
          {quickTonight.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} compact />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Pantry first" title="Pantry-friendly recipes for low-friction cooking" description="Recipes built around shelf staples, flexible produce, and easy substitutions." />
        <div className="card-grid">
          {pantryFavorites.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Editor’s picks" title="Curated recipes with standout flavor and styling" description="A mix of showstopper recipes, make-ahead brunches, and elegant dinner ideas." />
        <div className="card-grid">
          {editorPicks.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Food journal" title="Latest blog stories" description="Thoughtful kitchen guides, styling notes, and smarter meal planning systems." action={<Link to="/blog">Visit the blog</Link>} />
        <div className="card-grid">
          {recentPosts.map((post) => (
            <BlogCard key={post.id} post={post} author={authors.find((author) => author.id === post.authorId)} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Seasonal picks" title="Cook with the moment" description="Recipes shaped by warmer evenings, market produce, and lighter entertaining." />
        <div className="card-grid">
          {seasonalRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Reader favorites" title="Highly rated recipes worth repeating" description="Top-rated dishes with strong comments, consistent saves, and repeat-cook energy." />
        <div className="card-grid">
          {readerFavorites.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>

      <section className="container section-space">
        <SectionHeader eyebrow="Collections" title="Popular recipe collections" description="Shareable recipe bundles for hosting, meal prep, and seasonal cravings." action={<Link to="/collections">Browse all</Link>} />
        <div className="collection-grid">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} recipeCount={collection.recipeIds.length} />
          ))}
        </div>
      </section>

      <section className="container section-space two-col">
        <div>
          <SectionHeader eyebrow="Community highlights" title="Reviews and reader notes" description="Feedback from cooks bringing these recipes into their own weekly rotation." />
          <div className="card-grid compact">
            {highlightedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} userName={review.userName} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader eyebrow="Meet the kitchen team" title="Authors and recipe developers" description="Editors, stylists, and developers behind the cooking philosophy of Saffron Table." />
          <div className="stack-gap">
            {authors.map((author) => (
              <AuthorCard
                key={author.id}
                author={author}
                recipeCount={recipes.filter((recipe) => recipe.authorId === author.id).length}
                postCount={blogPosts.filter((post) => post.authorId === author.id).length}
              />
            ))}
          </div>
        </div>
      </section>

      <NewsletterCard />

      <section className="container section-space">
        <SectionHeader eyebrow="Why people stay" title="A platform built for serious home cooks" description="A blend of inspiration, usability, and planning tools that feels like a real product, not a bare recipe grid." />
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="testimonial-card">
              <p>“{testimonial.quote}”</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.role}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
