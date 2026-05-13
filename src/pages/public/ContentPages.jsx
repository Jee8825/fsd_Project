import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useApp } from '../../context/AppContext';
import { AuthorCard, BlogCard, CollectionCard, RecipeCard, ReviewCard } from '../../components/shared/Cards';
import { Breadcrumbs, EmptyState, NewsletterCard, PageHero, PlanCookSubnav, SearchBar, SectionHeader } from '../../components/common/UI';
import { formatDate } from '../../utils/helpers';

export const BlogListPage = () => {
  const { blogPosts, authors } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState('');
  const categories = [...new Set(blogPosts.map((post) => post.category))];
  const filteredPosts = blogPosts.filter(
    (post) =>
      (!deferredQuery ||
        post.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(deferredQuery.toLowerCase()))) &&
      (!category || post.category === category),
  );
  const featured = blogPosts.find((post) => post.featured) || blogPosts[0];

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />
        <PageHero eyebrow="Food journal" title="Editorial stories, kitchen systems, and plated inspiration." description="Long-form articles about technique, styling, pantry staples, and building a kitchen rhythm that lasts." image={featured.coverImage} compact>
          <div className="inline-controls">
            <SearchBar value={query} onChange={setQuery} searchPool={[]} placeholder="Search blog posts" />
            <select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All topics</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </PageHero>
      </div>
      <section className="container section-space featured-story">
        <div className="featured-story__visual">
          <img src={featured.coverImage} alt={featured.title} loading="eager" fetchPriority="high" decoding="async" />
        </div>
        <div className="featured-story__content">
          <span className="eyebrow">Featured article</span>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <Link to={`/blog/${featured.slug}`} className="button button--primary">
            Read article
          </Link>
        </div>
      </section>
      <section className="container section-space">
        <SectionHeader title="Latest posts" description="Recent long-form editorial content and kitchen notes." />
        <div className="card-grid">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} author={authors.find((author) => author.id === post.authorId)} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const { blogPosts, authors } = useApp();
  const [comments, setComments] = useState([{ name: 'Lena', comment: 'Loved the practical framing here.' }]);
  const { register, handleSubmit, reset } = useForm();
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <div className="container page-shell">
        <EmptyState title="Article not found" description="That blog post may have been moved." action={<Link className="button button--primary" to="/blog">Go to blog</Link>} />
      </div>
    );
  }

  const author = authors.find((item) => item.id === post.authorId) || authors[0];
  const related = blogPosts.filter((item) => item.id !== post.id).slice(0, 3);

  const addComment = (values) => {
    setComments((current) => [{ name: values.name, comment: values.comment }, ...current]);
    reset({ name: '', comment: '' });
  };

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Blog', to: '/blog' },
            { label: post.title },
          ]}
        />
        <PageHero eyebrow={post.category} title={post.title} description={post.excerpt} image={post.coverImage} compact />
      </div>
      <section className="container blog-detail-layout">
        <article className="blog-detail">
          <div className="author-inline bottom-gap">
            <img src={author.avatar} alt={author.name} loading="lazy" decoding="async" />
            <div>
              <strong>
                <Link to={`/authors/${author.slug}`}>{author.name}</Link>
              </strong>
              <span>
                {author.specialty} • {post.readTime} min read • {formatDate(post.createdAt)}
              </span>
            </div>
          </div>
          {post.content.map((section) => (
            <section key={section.title} id={section.title.toLowerCase().replace(/\s+/g, '-')}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <section className="detail-card">
            <h2>Comments</h2>
            <div className="stack-gap">
              {comments.map((item) => (
                <article key={`${item.name}-${item.comment}`} className="review-card">
                  <strong>{item.name}</strong>
                  <p>{item.comment}</p>
                </article>
              ))}
            </div>
            <form className="form-grid top-gap" onSubmit={handleSubmit(addComment)}>
              <label>
                <span>Name</span>
                <input {...register('name', { required: true })} placeholder="Your name" />
              </label>
              <label className="full-span">
                <span>Comment</span>
                <textarea {...register('comment', { required: true })} rows="4" placeholder="Share your thoughts" />
              </label>
              <button className="button button--primary" type="submit">
                Add comment
              </button>
            </form>
          </section>
        </article>
        <aside className="blog-toc sticky-card">
          <h3>Table of contents</h3>
          <nav className="stack-gap">
            {post.content.map((section) => (
              <a key={section.title} href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {section.title}
              </a>
            ))}
          </nav>
          <div className="stack-gap top-gap">
            <button className="button button--ghost" type="button" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Copy link
            </button>
          </div>
        </aside>
      </section>
      <section className="container section-space">
        <SectionHeader title="Related posts" />
        <div className="card-grid">
          {related.map((item) => (
            <BlogCard key={item.id} post={item} author={authors.find((authorItem) => authorItem.id === item.authorId)} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const AboutPage = () => {
  const { authors } = useApp();
  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
        <PageHero eyebrow="About us" title="A modern recipe platform shaped by editorial standards and practical cooking." description="Saffron Table exists for cooks who care about both flavor and flow: the joy of a beautiful recipe and the usefulness of a planner, saved boards, and organized shopping." image={authors[0].avatar} />
      </div>
      <section className="container section-space two-col">
        <article className="detail-card">
          <h2>Mission</h2>
          <p>We design recipes that are visually aspirational, deeply usable, and suited to real kitchen routines. The goal is a food platform that feels premium without becoming impractical.</p>
          <h2>Cooking philosophy</h2>
          <p>Layered flavor, ingredient flexibility, and strong recipe metadata make every recipe easier to trust and easier to return to.</p>
        </article>
        <article className="detail-card">
          <h2>Brand story</h2>
          <p>Born from editorial food culture and the realities of modern weekly cooking, Saffron Table pairs storytelling with planning infrastructure. It is equal parts recipe journal, culinary magazine, and kitchen manager.</p>
        </article>
      </section>
      <section className="container section-space">
        <SectionHeader title="The team" description="Recipe developers, editors, and stylists behind the platform." />
        <div className="card-grid">
          {authors.map((author) => (
            <AuthorCard key={author.id} author={author} recipeCount={0} postCount={0} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const ContactPage = () => {
  const { settings, sendContactMessage } = useApp();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const onSubmit = async (values) => {
    try {
      await sendContactMessage(values);
      reset();
    } catch (error) {
      // toast already handled in context
    }
  };

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
        <PageHero eyebrow="Contact" title="Editorial collaborations, sponsored work, or kitchen questions." description="Reach the Saffron Table team for partnerships, business inquiries, freelance food styling, and reader feedback." image="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80" compact />
      </div>
      <section className="container section-space two-col">
        <form className="detail-card form-grid" onSubmit={handleSubmit(onSubmit)}>
          <h2>Send a message</h2>
          <label>
            <span>Name</span>
            <input {...register('name', { required: 'Please enter your name.' })} placeholder="Your name" />
            {errors.name && <small className="field-error">{errors.name.message}</small>}
          </label>
          <label>
            <span>Email</span>
            <input {...register('email', { required: 'Email is required.' })} type="email" placeholder="you@example.com" />
            {errors.email && <small className="field-error">{errors.email.message}</small>}
          </label>
          <label className="full-span">
            <span>Inquiry type</span>
            <select {...register('type')}>
              <option value="collab">Collaboration</option>
              <option value="business">Business inquiry</option>
              <option value="support">General support</option>
            </select>
          </label>
          <label className="full-span">
            <span>Message</span>
            <textarea {...register('message', { required: 'Please add a message.' })} rows="5" placeholder="Tell us about your project or question" />
            {errors.message && <small className="field-error">{errors.message.message}</small>}
          </label>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Submit inquiry'}
          </button>
        </form>
        <div className="stack-gap">
          <article className="detail-card">
            <h2>Contact details</h2>
            <p>Email: {settings.contactEmail}</p>
            <p>Phone: {settings.contactPhone}</p>
            <p>Instagram, Pinterest, and YouTube are the fastest places to discover new content and styling updates.</p>
          </article>
          <article className="detail-card">
            <h2>FAQ snippet</h2>
            <p>We accept brand partnerships aligned with food, kitchenware, hospitality, and premium lifestyle products. We do not provide medical nutrition advice.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export const AuthorProfilePage = () => {
  const { slug } = useParams();
  const { authors, recipes, blogPosts } = useApp();
  const author = authors.find((item) => item.slug === slug);

  if (!author) {
    return (
      <div className="container page-shell">
        <EmptyState title="Author profile unavailable" description="This chef profile no longer exists." action={<Link className="button button--primary" to="/">Return home</Link>} />
      </div>
    );
  }

  const authoredRecipes = recipes.filter((recipe) => recipe.authorId === author.id);
  const authoredPosts = blogPosts.filter((post) => post.authorId === author.id);

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Authors', to: '/about' },
            { label: author.name },
          ]}
        />
        <PageHero eyebrow="Chef profile" title={author.name} description={author.bio} image={author.avatar} compact />
      </div>
      <section className="container section-space two-col">
        <article className="detail-card">
          <h2>Expertise</h2>
          <p>{author.specialty}</p>
          <div className="footer-socials">
            {Object.entries(author.socialLinks).map(([key, value]) => (
              <a key={key} href={value} target="_blank" rel="noreferrer">
                {key}
              </a>
            ))}
          </div>
        </article>
        <article className="detail-card">
          <h2>Authored work</h2>
          <p>
            {authoredRecipes.length} recipes and {authoredPosts.length} editorial posts published on Saffron Table.
          </p>
        </article>
      </section>
      <section className="container section-space">
        <SectionHeader title="Recipes by this author" />
        <div className="card-grid">
          {authoredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
      <section className="container section-space">
        <SectionHeader title="Articles by this author" />
        <div className="card-grid">
          {authoredPosts.map((post) => (
            <BlogCard key={post.id} post={post} author={author} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const CollectionsPage = () => {
  const { collections } = useApp();
  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
        <PageHero eyebrow="Collections" title="Curated recipe bundles for mood, season, and kitchen intent." description="Explore shareable collections like 15-minute meals, comfort food, festive sweets, and summer drinks." image={collections[0].image} compact />
      </div>
      <section className="container section-space">
        <div className="collection-grid">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} recipeCount={collection.recipeIds.length} />
          ))}
        </div>
      </section>
      <NewsletterCard />
    </div>
  );
};

export const CollectionDetailPage = () => {
  const { slug } = useParams();
  const { collections, recipes } = useApp();
  const collection = collections.find((item) => item.slug === slug);

  if (!collection) {
    return (
      <div className="container page-shell">
        <EmptyState title="Collection not found" description="This shareable collection may have moved." action={<Link className="button button--primary" to="/collections">Back to collections</Link>} />
      </div>
    );
  }

  const collectionRecipes = recipes.filter((recipe) => collection.recipeIds.includes(recipe.id));

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Collections', to: '/collections' },
            { label: collection.title },
          ]}
        />
        <PageHero eyebrow="Curated collection" title={collection.title} description={collection.description} image={collection.image} compact>
          <button className="button button--ghost" type="button" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Copy share link
          </button>
        </PageHero>
      </div>
      <section className="container section-space">
        <div className="card-grid">
          {collectionRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </div>
  );
};

export const UserProfilePage = () => {
  const { currentUser, favorites, recipes, reviews, mealPlan, users, recipeSubmissions, pantry, shoppingList } = useApp();
  const savedRecipes = recipes.filter((recipe) => favorites.includes(recipe.id));
  const myReviews = reviews.filter((review) => review.userId === currentUser.id);
  const mySubmissions = recipeSubmissions.filter((submission) => submission.userId === currentUser.id);
  const plannedCount = useMemo(
    () => Object.values(mealPlan).flatMap((day) => Object.values(day).filter(Boolean)).length,
    [mealPlan],
  );
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const quickLinks = [
    { to: '/saved', label: 'Saved recipes', count: savedRecipes.length },
    { to: '/meal-planner', label: 'Meal planner', count: plannedCount },
    { to: '/shopping-list', label: 'Shopping list', count: shoppingList.length },
    { to: '/pantry', label: 'Pantry', count: pantry.length },
    { to: '/submit-recipe', label: 'Submit a recipe', count: mySubmissions.length },
  ];

  return (
    <div className="page-shell">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Your profile' }]} />
        <PlanCookSubnav />
        <PageHero eyebrow="Profile" title={currentUser.name} description={`${currentUser.role} account with saved recipes, review history, and meal-planning preferences.`} image={currentUser.avatar} compact>
          <div className="button-row">
            {isStaff && (
              <Link className="button button--primary" to="/admin">
                Open admin dashboard
              </Link>
            )}
            <Link className="button button--ghost" to="/submit-recipe">
              Submit a recipe
            </Link>
            <Link className="button button--ghost" to="/contact">
              Contact us
            </Link>
          </div>
        </PageHero>
      </div>
      <section className="container section-space">
        <SectionHeader title="Quick actions" description="Jump back into the things you cook with most." />
        <div className="profile-quick-grid">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className="profile-quick-card">
              <strong>{link.label}</strong>
              <span>{link.count} item{link.count === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container section-space two-col">
        <article className="detail-card">
          <h2>Preferences</h2>
          <p>{currentUser.preferences.join(' • ') || 'No dietary tags set yet.'}</p>
          <p>{plannedCount} meal slots are currently planned this week.</p>
        </article>
        <article className="detail-card">
          <h2>Account details</h2>
          <p>{currentUser.email}</p>
          <p>Role: {currentUser.role}</p>
          <p>Saved recipes: {savedRecipes.length}</p>
        </article>
      </section>
      <section className="container section-space">
        <SectionHeader
          title="Saved recipes"
          action={<Link className="button button--ghost" to="/saved">See all</Link>}
        />
        <div className="card-grid">
          {savedRecipes.slice(0, 6).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
      <section className="container section-space">
        <SectionHeader
          title="Your submissions"
          action={<Link className="button button--ghost" to="/submit-recipe">Submit another</Link>}
        />
        {mySubmissions.length ? (
          <div className="card-grid compact">
            {mySubmissions.slice(0, 4).map((submission) => (
              <article key={submission.id} className="detail-card">
                <p className="eyebrow">{submission.status}</p>
                <h3>{submission.title}</h3>
                <p>{submission.description}</p>
                {submission.reviewerNote && <p><strong>Editor note:</strong> {submission.reviewerNote}</p>}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No submissions yet"
            description="Share your favorite recipe ideas with the editorial team."
            action={<Link className="button button--primary" to="/submit-recipe">Submit a recipe idea</Link>}
          />
        )}
      </section>
      <section className="container section-space">
        <SectionHeader title="Review history" />
        <div className="card-grid compact">
          {myReviews.length ? (
            myReviews.map((review) => (
              <ReviewCard key={review.id} review={review} userName={users.find((user) => user.id === review.userId)?.name || currentUser.name} />
            ))
          ) : (
            <EmptyState
              title="No reviews yet"
              description="Try a recipe and share what you thought."
              action={<Link className="button button--primary" to="/recipes">Browse recipes</Link>}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export const NotFoundPage = () => (
  <div className="page-shell">
    <div className="container">
      <section className="not-found-card">
        <span className="eyebrow">404</span>
        <h1>This page wandered out of the kitchen.</h1>
        <p>The page you tried to open is unavailable. Try one of these instead:</p>
        <div className="button-row">
          <Link className="button button--primary" to="/">
            Go home
          </Link>
          <Link className="button button--ghost" to="/recipes">
            Browse recipes
          </Link>
          <Link className="button button--ghost" to="/blog">
            Read the blog
          </Link>
          <Link className="button button--ghost" to="/contact">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  </div>
);
