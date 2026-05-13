import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog, EmptyState, Modal, SectionHeader, StatCard } from '../../components/common/UI';
import { createId, formatDate, formatRelativeTime } from '../../utils/helpers';

const Field = ({ field, register, errors, watch, setValue, options = [] }) => {
  const preview = watch(field.name);
  const commonProps = register(field.name, field.rules || {});

  if (field.type === 'textarea') {
    return (
      <label className={field.full ? 'full-span' : ''}>
        <span>{field.label}</span>
        <textarea rows={field.rows || 4} placeholder={field.placeholder} {...commonProps} />
        {errors[field.name] && <small className="field-error">{errors[field.name].message}</small>}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className={field.full ? 'full-span' : ''}>
        <span>{field.label}</span>
        <select {...commonProps}>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-label">
        <input type="checkbox" {...register(field.name)} />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'image') {
    return (
      <label className={field.full ? 'full-span' : ''}>
        <span>{field.label}</span>
        <input type="url" placeholder={field.placeholder} {...commonProps} />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setValue(field.name, reader.result);
            reader.readAsDataURL(file);
          }}
        />
        {preview && <img src={preview} alt="Preview" className="admin-image-preview" />}
      </label>
    );
  }

  return (
    <label className={field.full ? 'full-span' : ''}>
      <span>{field.label}</span>
      <input type={field.type || 'text'} placeholder={field.placeholder} {...commonProps} />
      {errors[field.name] && <small className="field-error">{errors[field.name].message}</small>}
    </label>
  );
};

const CrudModal = ({ open, title, fields, item, onClose, onSubmit, selectOptions }) => {
  const defaults = fields.reduce((acc, field) => {
    acc[field.name] = item?.[field.name] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '');
    return acc;
  }, {});
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({ values: defaults });

  const submit = (values) => {
    onSubmit(values);
    reset(defaults);
  };

  return (
    <Modal open={open} title={title} onClose={onClose} size="large">
      <form className="form-grid" onSubmit={handleSubmit(submit)}>
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            options={selectOptions[field.name] || field.options || []}
          />
        ))}
        <div className="button-row full-span">
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button button--primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AdminTable = ({ columns, rows, actions }) => (
  <div className="admin-table-wrap">
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
          {actions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.key}>{column.render ? column.render(row[column.key], row) : row[column.key]}</td>
            ))}
            {actions && <td>{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CrudManager = ({ title, singular, description, entityKey, rows, columns, fields, normalize, selectOptions }) => {
  const { upsertEntity, deleteEntity } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const onSubmit = (values) => {
    const payload = normalize(values, editing);
    upsertEntity(entityKey, payload);
    setOpen(false);
    setEditing(null);
  };

  const onEdit = (row) => {
    setEditing(row);
    setOpen(true);
  };

  return (
    <section className="admin-section">
      <SectionHeader
        title={title}
        description={description}
        action={
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Create new
          </button>
        }
      />
      {rows.length ? (
        <AdminTable
          columns={columns}
          rows={rows}
          actions={(row) => (
            <div className="button-row">
              <button type="button" className="button button--ghost" onClick={() => onEdit(row)}>
                Edit
              </button>
              <button type="button" className="button button--danger" onClick={() => setPendingDelete(row)}>
                Delete
              </button>
            </div>
          )}
        />
      ) : (
        <EmptyState title={`No ${title.toLowerCase()} yet`} description="Create the first item from the dashboard." />
      )}
      <CrudModal
        open={open}
        title={`${editing ? 'Edit' : 'Create'} ${singular}`}
        fields={fields}
        item={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        selectOptions={selectOptions}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.title || pendingDelete?.name}`}
        description="This action removes the entry from the mock admin store."
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          deleteEntity(entityKey, pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </section>
  );
};

const recipeFields = [
  { name: 'title', label: 'Title', rules: { required: 'Title is required.' } },
  { name: 'image', label: 'Hero image', type: 'image', full: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 3, full: true },
  { name: 'fullDescription', label: 'Full description', type: 'textarea', rows: 5, full: true },
  { name: 'category', label: 'Category', type: 'select' },
  { name: 'cuisine', label: 'Cuisine', type: 'select' },
  { name: 'mealType', label: 'Meal type' },
  { name: 'dietType', label: 'Diet type' },
  { name: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'] },
  { name: 'prepTime', label: 'Prep time', type: 'number' },
  { name: 'cookTime', label: 'Cook time', type: 'number' },
  { name: 'servings', label: 'Servings', type: 'number' },
  { name: 'estimatedCost', label: 'Estimated cost', type: 'number' },
  { name: 'authorId', label: 'Author', type: 'select' },
  { name: 'tagsText', label: 'Tags (comma separated)', full: true },
  { name: 'ingredientsText', label: 'Ingredients (one per line: amount|unit|name|category)', type: 'textarea', rows: 6, full: true },
  { name: 'instructionsText', label: 'Instructions (one step per line)', type: 'textarea', rows: 6, full: true },
  { name: 'featured', label: 'Featured', type: 'checkbox', defaultValue: false },
  { name: 'trending', label: 'Trending', type: 'checkbox', defaultValue: false },
  { name: 'seasonal', label: 'Seasonal', type: 'checkbox', defaultValue: false },
  { name: 'pantryFriendly', label: 'Pantry friendly', type: 'checkbox', defaultValue: false },
];

const recipeColumns = [
  { key: 'title', label: 'Recipe' },
  { key: 'category', label: 'Category' },
  { key: 'cuisine', label: 'Cuisine' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'reviewCount', label: 'Reviews' },
  { key: 'rating', label: 'Rating' },
];

const simpleContentFields = (nameLabel = 'Name') => [
  { name: 'name', label: nameLabel, rules: { required: `${nameLabel} is required.` } },
  { name: 'image', label: 'Image', type: 'image', full: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
];

const blogFields = [
  { name: 'title', label: 'Title', rules: { required: 'Title is required.' }, full: true },
  { name: 'coverImage', label: 'Cover image', type: 'image', full: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 3, full: true },
  { name: 'category', label: 'Category' },
  { name: 'authorId', label: 'Author', type: 'select' },
  { name: 'readTime', label: 'Read time', type: 'number' },
  { name: 'tagsText', label: 'Tags (comma separated)', full: true },
  { name: 'contentText', label: 'Content sections (one per line: Heading|Paragraph)', type: 'textarea', rows: 8, full: true },
  { name: 'featured', label: 'Featured', type: 'checkbox', defaultValue: false },
];

const authorFields = [
  { name: 'name', label: 'Name', rules: { required: 'Name is required.' } },
  { name: 'avatar', label: 'Avatar', type: 'image', full: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'specialty', label: 'Specialty' },
  { name: 'bio', label: 'Bio', type: 'textarea', rows: 5, full: true },
];

const collectionFields = [
  { name: 'title', label: 'Collection title', rules: { required: 'Title is required.' } },
  { name: 'image', label: 'Collection image', type: 'image', full: true, placeholder: 'https://images.unsplash.com/...' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
  { name: 'recipeIdsText', label: 'Recipe IDs (comma separated)', full: true },
];

export const AdminDashboardPage = () => {
  const { recipes, blogPosts, categories, users, reviews, collections, pantry, auditLog } = useApp();
  const ingredientFrequency = useMemo(() => {
    const tally = new Map();
    recipes.forEach((recipe) => {
      recipe.ingredients?.forEach((ingredient) => {
        const name = ingredient.name?.toLowerCase();
        if (!name) return;
        tally.set(name, (tally.get(name) || 0) + 1);
      });
    });
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [recipes]);
  const chartData = categories.slice(0, 6).map((category) => ({
    name: category.name,
    recipes: recipes.filter((recipe) => recipe.category === category.name).length,
  }));
  const reviewStatusData = ['approved', 'pending', 'rejected'].map((status) => ({
    name: status,
    value: reviews.filter((review) => review.status === status).length || 0.1,
  }));
  const recentActivity = [
    `Published ${recipes[0]?.title}`,
    `Updated ${blogPosts[0]?.title}`,
    `Curated ${collections[0]?.title}`,
    `Moderated ${reviews.length} total reviews`,
  ];

  return (
    <div className="admin-content">
      <div className="stats-grid">
        <StatCard label="Total recipes" value={recipes.length} meta="Live in the frontend catalog" />
        <StatCard label="Blog posts" value={blogPosts.length} meta="Editorial content in the journal" />
        <StatCard label="Categories" value={categories.length} meta="Taxonomy driving discovery" />
        <StatCard label="Users" value={users.length} meta="Sample roles and saved states" />
        <StatCard label="Reviews" value={reviews.length} meta="Includes moderation controls" />
      </div>
      <div className="admin-chart-grid">
        <article className="detail-card chart-card">
          <SectionHeader title="Recipes by category" description="Distribution across major landing categories." />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="recipes" radius={[10, 10, 0, 0]} fill="var(--color-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="detail-card chart-card">
          <SectionHeader title="Review moderation" description="Quick health snapshot for comment operations." />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie dataKey="value" data={reviewStatusData} innerRadius={60} outerRadius={95}>
                {reviewStatusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === 'approved' ? '#d98032' : entry.name === 'pending' ? '#f5c36b' : '#d65b44'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </div>
      <article className="detail-card">
        <SectionHeader title="Recent activity" description="Quick actions and editorial system motion." />
        <div className="stack-gap">
          {recentActivity.map((item) => (
            <div key={item} className="activity-row">
              <span className="activity-dot" />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </article>
      <div className="admin-chart-grid">
        <article className="detail-card">
          <SectionHeader
            title="Pantry insights"
            description="Most-used ingredients across the catalog — useful for sourcing partnerships and staple-driven editorial."
          />
          <ul className="pantry-insight-list">
            {ingredientFrequency.map(([name, count]) => (
              <li key={name}>
                <span>{name}</span>
                <strong>{count} recipes</strong>
              </li>
            ))}
          </ul>
          <small className="muted-text">Your own pantry has {pantry.length} item{pantry.length === 1 ? '' : 's'} tracked.</small>
        </article>
        <article className="detail-card">
          <SectionHeader
            title="Latest audit events"
            description="Recent edits, deletes, and role changes. Full history under Audit log."
          />
          <ul className="audit-mini-list">
            {auditLog.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <strong>{entry.actorName}</strong> {entry.summary}
                <small>{formatRelativeTime(entry.createdAt)}</small>
              </li>
            ))}
            {auditLog.length === 0 && (
              <li className="muted-text">No actions logged yet — make an edit to populate this feed.</li>
            )}
          </ul>
        </article>
      </div>
    </div>
  );
};

export const AdminAuditPage = () => {
  const { auditLog } = useApp();
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [query, setQuery] = useState('');

  const actionTypes = useMemo(() => [...new Set(auditLog.map((entry) => entry.action))], [auditLog]);
  const entityTypes = useMemo(() => [...new Set(auditLog.map((entry) => entry.entity))], [auditLog]);

  const filtered = auditLog.filter((entry) => {
    if (actionFilter && entry.action !== actionFilter) return false;
    if (entityFilter && entry.entity !== entityFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${entry.actorName} ${entry.summary} ${entry.entity}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <section className="admin-section">
      <SectionHeader
        title="Audit log"
        description="Every create, update, delete, and role change is captured here so editorial operations stay accountable."
      />
      <div className="audit-toolbar">
        <input
          type="search"
          placeholder="Search actor, summary, or entity..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="">All actions</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)}>
          <option value="">All entities</option>
          {entityTypes.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
        <small>{filtered.length} of {auditLog.length} events</small>
      </div>
      {filtered.length ? (
        <AdminTable
          columns={[
            { key: 'createdAt', label: 'When', render: (value) => formatRelativeTime(value) },
            { key: 'actorName', label: 'Actor', render: (value, row) => `${value} (${row.actorRole})` },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
            { key: 'summary', label: 'Summary' },
          ]}
          rows={filtered}
        />
      ) : (
        <EmptyState
          title="No audit events match these filters"
          description="Adjust the filters above or perform an action in the dashboard to populate the log."
        />
      )}
    </section>
  );
};

export const AdminRecipesPage = () => {
  const { recipes, categories, cuisines, authors } = useApp();
  const rows = recipes.map((recipe) => ({
    ...recipe,
    tagsText: recipe.tags.join(', '),
    ingredientsText: recipe.ingredients.map((item) => `${item.amount}|${item.unit}|${item.name}|${item.category}`).join('\n'),
    instructionsText: recipe.instructions.join('\n'),
  }));
  const selectOptions = {
    category: categories.map((item) => item.name),
    cuisine: cuisines.map((item) => item.name),
    authorId: authors.map((item) => ({ value: item.id, label: item.name })),
  };

  return (
    <CrudManager
      title="Recipes"
      singular="Recipe"
      description="Full CRUD for recipe content, metadata, imagery, and discovery labels."
      entityKey="recipes"
      rows={rows}
      columns={recipeColumns}
      fields={recipeFields}
      selectOptions={selectOptions}
      normalize={(values, editing) => {
        const ingredients = values.ingredientsText
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [amount, unit, name, category] = line.split('|');
            return { amount: Number(amount) || 0, unit: unit || '', name: name || '', category: category || 'pantry' };
          });
        const instructions = values.instructionsText.split('\n').filter(Boolean);
        return {
          ...editing,
          ...values,
          id: editing?.id || createId('recipe'),
          totalTime: Number(values.prepTime) + Number(values.cookTime),
          calories: editing?.calories || 400,
          protein: editing?.protein || 15,
          carbs: editing?.carbs || 30,
          fat: editing?.fat || 15,
          tags: values.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
          tips: editing?.tips || ['Chef note coming soon.'],
          substitutions: editing?.substitutions || ['Substitution notes coming soon.'],
          faq: editing?.faq || [],
          storage: editing?.storage || 'Store chilled for up to 2 days.',
          ingredients,
          instructions,
          reviewCount: editing?.reviewCount || 0,
          rating: editing?.rating || 4.5,
          createdAt: editing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }}
    />
  );
};

export const AdminCategoriesPage = () => {
  const { categories } = useApp();
  return (
    <CrudManager
      title="Categories"
      singular="Category"
      description="Manage homepage category cards and recipe taxonomy."
      entityKey="categories"
      rows={categories}
      columns={[
        { key: 'name', label: 'Category' },
        { key: 'description', label: 'Description' },
      ]}
      fields={simpleContentFields('Category name')}
      normalize={(values, editing) => ({ ...editing, ...values, id: editing?.id || createId('category') })}
      selectOptions={{}}
    />
  );
};

export const AdminCuisinesPage = () => {
  const { cuisines } = useApp();
  return (
    <CrudManager
      title="Cuisines"
      singular="Cuisine"
      description="Manage cuisine landing pages and filtering paths."
      entityKey="cuisines"
      rows={cuisines}
      columns={[
        { key: 'name', label: 'Cuisine' },
        { key: 'description', label: 'Description' },
      ]}
      fields={simpleContentFields('Cuisine name')}
      normalize={(values, editing) => ({ ...editing, ...values, id: editing?.id || createId('cuisine') })}
      selectOptions={{}}
    />
  );
};

export const AdminBlogsPage = () => {
  const { blogPosts, authors } = useApp();
  return (
    <CrudManager
      title="Blogs"
      singular="Blog post"
      description="Full CRUD for editorial blog posts."
      entityKey="blogPosts"
      rows={blogPosts.map((post) => ({
        ...post,
        tagsText: post.tags.join(', '),
        contentText: post.content.map((section) => `${section.title}|${section.body}`).join('\n'),
      }))}
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'readTime', label: 'Read time' },
      ]}
      fields={blogFields}
      selectOptions={{
        authorId: authors.map((item) => ({ value: item.id, label: item.name })),
      }}
      normalize={(values, editing) => ({
        ...editing,
        ...values,
        id: editing?.id || createId('blog'),
        tags: values.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
        content: values.contentText
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [title, body] = line.split('|');
            return { title, body };
          }),
        createdAt: editing?.createdAt || new Date().toISOString(),
      })}
    />
  );
};

export const AdminAuthorsPage = () => {
  const { authors } = useApp();
  return (
    <CrudManager
      title="Authors"
      singular="Author"
      description="Manage chef and editor profiles shown across the site."
      entityKey="authors"
      rows={authors}
      columns={[
        { key: 'name', label: 'Author' },
        { key: 'specialty', label: 'Specialty' },
      ]}
      fields={authorFields}
      normalize={(values, editing) => ({
        ...editing,
        ...values,
        id: editing?.id || createId('author'),
        socialLinks: editing?.socialLinks || { instagram: 'https://instagram.com', website: 'https://example.com' },
      })}
      selectOptions={{}}
    />
  );
};

export const AdminReviewsPage = () => {
  const { reviews, recipes, users, moderateReview, deleteEntity } = useApp();
  return (
    <section className="admin-section">
      <SectionHeader title="Reviews" description="Approve, reject, or remove user-submitted reviews." />
      <AdminTable
        columns={[
          { key: 'recipeId', label: 'Recipe', render: (value) => recipes.find((item) => item.id === value)?.title || value },
          { key: 'userId', label: 'User', render: (value) => users.find((item) => item.id === value)?.name || value },
          { key: 'rating', label: 'Rating' },
          { key: 'status', label: 'Status' },
          { key: 'comment', label: 'Comment' },
        ]}
        rows={reviews}
        actions={(row) => (
          <div className="button-row">
            <button type="button" className="button button--ghost" onClick={() => moderateReview(row.id, 'approved')}>
              Approve
            </button>
            <button type="button" className="button button--ghost" onClick={() => moderateReview(row.id, 'rejected')}>
              Reject
            </button>
            <button type="button" className="button button--danger" onClick={() => deleteEntity('reviews', row.id)}>
              Delete
            </button>
          </div>
        )}
      />
    </section>
  );
};

export const AdminUsersPage = () => {
  const { users, updateUserRole } = useApp();
  return (
    <section className="admin-section">
      <SectionHeader title="Users" description="Sample user listing with editable roles." />
      <AdminTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'role',
            label: 'Role',
            render: (value, row) => (
              <select value={value} onChange={(event) => updateUserRole(row.id, event.target.value)}>
                {['admin', 'editor', 'viewer'].map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ),
          },
          { key: 'preferences', label: 'Preferences', render: (value) => value.join(', ') },
        ]}
        rows={users}
      />
    </section>
  );
};

export const AdminCollectionsPage = () => {
  const { collections } = useApp();
  return (
    <CrudManager
      title="Collections"
      singular="Collection"
      description="Create and edit curated recipe bundles for the public site."
      entityKey="collections"
      rows={collections.map((collection) => ({ ...collection, recipeIdsText: collection.recipeIds.join(', ') }))}
      columns={[
        { key: 'title', label: 'Collection' },
        { key: 'description', label: 'Description' },
      ]}
      fields={collectionFields}
      normalize={(values, editing) => ({
        ...editing,
        ...values,
        id: editing?.id || createId('collection'),
        recipeIds: values.recipeIdsText.split(',').map((item) => item.trim()).filter(Boolean),
      })}
      selectOptions={{}}
    />
  );
};

export const AdminSettingsPage = () => {
  const { settings, saveSettings } = useApp();
  const { register, handleSubmit, formState: { errors } } = useForm({ values: settings });
  return (
    <section className="admin-section">
      <SectionHeader title="Settings" description="Configure core site identity, footer content, and contact details." />
      <form className="detail-card form-grid" onSubmit={handleSubmit(saveSettings)}>
        <label>
          <span>Site title</span>
          <input {...register('siteTitle', { required: 'Site title is required.' })} />
          {errors.siteTitle && <small className="field-error">{errors.siteTitle.message}</small>}
        </label>
        <label>
          <span>Logo text</span>
          <input {...register('logoText')} />
        </label>
        <label>
          <span>Contact email</span>
          <input type="email" {...register('contactEmail')} />
        </label>
        <label>
          <span>Contact phone</span>
          <input {...register('contactPhone')} />
        </label>
        <label className="full-span">
          <span>Footer blurb</span>
          <textarea rows="4" {...register('footerBlurb')} />
        </label>
        <label>
          <span>Homepage featured recipe ID</span>
          <input {...register('featuredHeroRecipeId')} />
        </label>
        <div className="button-row full-span">
          <button className="button button--primary" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
};

const announcementFields = [
  { name: 'title', label: 'Title', rules: { required: 'Title is required.' } },
  { name: 'tone', label: 'Tone', type: 'select', options: ['info', 'success', 'warning', 'danger'] },
  { name: 'message', label: 'Message', type: 'textarea', rows: 4, full: true, rules: { required: 'Message is required.' } },
  { name: 'link', label: 'Optional link (e.g. /recipes/lemon-tart)', full: true },
  { name: 'active', label: 'Active (visible to users)', type: 'checkbox', defaultValue: true },
];

export const AdminAnnouncementsPage = () => {
  const { announcements } = useApp();
  return (
    <CrudManager
      title="Announcements"
      singular="Announcement"
      description="Site-wide banners that appear at the top of the public site for all visitors."
      entityKey="announcements"
      rows={announcements}
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'tone', label: 'Tone' },
        { key: 'active', label: 'Active', render: (value) => (value ? 'Yes' : 'No') },
        { key: 'createdAt', label: 'Created', render: (value) => (value ? formatDate(value) : '—') },
      ]}
      fields={announcementFields}
      normalize={(values, editing) => ({
        ...editing,
        ...values,
        active: Boolean(values.active),
        id: editing?.id || createId('announcement'),
        createdAt: editing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })}
      selectOptions={{}}
    />
  );
};

export const AdminMessagesPage = () => {
  const { contactMessages, updateMessageStatus, deleteEntity } = useApp();
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all'
    ? contactMessages
    : contactMessages.filter((message) => message.status === filter);

  return (
    <section className="admin-section">
      <SectionHeader
        title="Contact messages"
        description="Inquiries submitted from the public contact form. Mark as read or resolved to keep the queue clean."
      />
      <div className="audit-toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
        <small>{filtered.length} of {contactMessages.length} messages</small>
      </div>
      {filtered.length ? (
        <AdminTable
          columns={[
            { key: 'createdAt', label: 'When', render: (value) => (value ? formatRelativeTime(value) : '—') },
            { key: 'name', label: 'From' },
            { key: 'email', label: 'Email' },
            { key: 'type', label: 'Type' },
            { key: 'message', label: 'Message' },
            { key: 'status', label: 'Status' },
          ]}
          rows={filtered}
          actions={(row) => (
            <div className="button-row">
              {row.status !== 'read' && (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => updateMessageStatus(row.id, 'read')}
                >
                  Mark read
                </button>
              )}
              {row.status !== 'resolved' && (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => updateMessageStatus(row.id, 'resolved')}
                >
                  Resolve
                </button>
              )}
              <button
                type="button"
                className="button button--danger"
                onClick={() => deleteEntity('contactMessages', row.id)}
              >
                Delete
              </button>
            </div>
          )}
        />
      ) : (
        <EmptyState
          title="No messages match"
          description="Messages submitted from the public contact form will appear here."
        />
      )}
    </section>
  );
};

export const AdminSubmissionsPage = () => {
  const { recipeSubmissions, updateSubmissionStatus, deleteEntity } = useApp();
  const [filter, setFilter] = useState('all');
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');

  const filtered = filter === 'all'
    ? recipeSubmissions
    : recipeSubmissions.filter((submission) => submission.status === filter);

  const closeReview = () => {
    setReviewing(null);
    setNote('');
  };

  const handleDecision = async (status) => {
    if (!reviewing) return;
    await updateSubmissionStatus(reviewing.id, status, note);
    closeReview();
  };

  return (
    <section className="admin-section">
      <SectionHeader
        title="Recipe submissions"
        description="Reader-submitted recipe ideas. Review, approve, or reject them — approvals appear in the audit log."
      />
      <div className="audit-toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <small>{filtered.length} of {recipeSubmissions.length} submissions</small>
      </div>
      {filtered.length ? (
        <AdminTable
          columns={[
            { key: 'createdAt', label: 'When', render: (value) => (value ? formatRelativeTime(value) : '—') },
            { key: 'submitterName', label: 'Submitter' },
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'cuisine', label: 'Cuisine' },
            { key: 'estimatedTime', label: 'Time (min)' },
            { key: 'status', label: 'Status' },
          ]}
          rows={filtered}
          actions={(row) => (
            <div className="button-row">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setReviewing(row);
                  setNote(row.reviewerNote || '');
                }}
              >
                Review
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => deleteEntity('recipeSubmissions', row.id)}
              >
                Delete
              </button>
            </div>
          )}
        />
      ) : (
        <EmptyState
          title="No submissions match"
          description="When readers submit recipe ideas they'll appear in this queue for editorial review."
        />
      )}
      <Modal open={Boolean(reviewing)} title={reviewing?.title || 'Review submission'} onClose={closeReview} size="large">
        {reviewing && (
          <div className="stack-gap">
            <p><strong>From:</strong> {reviewing.submitterName} · {reviewing.category || '—'} · {reviewing.cuisine || '—'} · {reviewing.estimatedTime || '?'} min</p>
            <p>{reviewing.description}</p>
            {reviewing.ingredientsText && (
              <article className="detail-card">
                <h3>Ingredients</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{reviewing.ingredientsText}</pre>
              </article>
            )}
            {reviewing.instructionsText && (
              <article className="detail-card">
                <h3>Instructions</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{reviewing.instructionsText}</pre>
              </article>
            )}
            <label>
              <span>Reviewer note (optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Internal feedback or rationale"
              />
            </label>
            <div className="button-row">
              <button type="button" className="button button--ghost" onClick={closeReview}>Close</button>
              <button type="button" className="button button--ghost" onClick={() => handleDecision('rejected')}>
                Reject
              </button>
              <button type="button" className="button button--primary" onClick={() => handleDecision('approved')}>
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};
