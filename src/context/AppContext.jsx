import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  authors,
  blogPosts,
  categories,
  collections,
  cuisines,
  recipes,
  reviews,
  siteSettings,
  testimonials,
  users,
} from '../data/mockData';
import {
  appStorageKey,
  authStorageKey,
  buildShoppingList,
  createId,
  createSlug,
  getAverageRating,
} from '../utils/helpers';
import { api, setApiToken } from '../utils/api';

const AppContext = createContext(null);

const contentKeys = [
  'recipes',
  'blogPosts',
  'categories',
  'cuisines',
  'authors',
  'reviews',
  'users',
  'collections',
  'announcements',
  'contactMessages',
  'recipeSubmissions',
  'subscribers',
  'recipeNotes',
];

const singularLabel = (key) =>
  ({
    recipes: 'Recipe',
    blogPosts: 'Blog post',
    categories: 'Category',
    cuisines: 'Cuisine',
    authors: 'Author',
    reviews: 'Review',
    users: 'User',
    collections: 'Collection',
    settings: 'Settings',
    announcements: 'Announcement',
    contactMessages: 'Contact message',
    recipeSubmissions: 'Recipe submission',
    subscribers: 'Subscriber',
    recipeNotes: 'Recipe note',
  }[key] || 'Item');

const defaultState = {
  theme: 'light',
  currentUserId: null,
  recipes,
  blogPosts,
  categories,
  cuisines,
  authors,
  reviews,
  users,
  collections,
  settings: siteSettings,
  announcements: [],
  contactMessages: [],
  recipeSubmissions: [],
  subscribers: [],
  recipeNotes: [],
  testimonials,
  favorites: ['recipe-1', 'recipe-4'],
  recentlyViewed: ['recipe-2', 'recipe-7'],
  compareRecipes: [],
  shoppingList: [],
  pantry: [],
  notifications: [],
  auditLog: [],
  mealPlan: {
    Monday: { breakfast: 'recipe-4', lunch: 'recipe-3', dinner: 'recipe-1' },
    Tuesday: { breakfast: 'recipe-6', lunch: 'recipe-2', dinner: 'recipe-7' },
    Wednesday: { breakfast: null, lunch: null, dinner: null },
    Thursday: { breakfast: null, lunch: null, dinner: null },
    Friday: { breakfast: null, lunch: null, dinner: null },
    Saturday: { breakfast: null, lunch: null, dinner: null },
    Sunday: { breakfast: null, lunch: null, dinner: null },
  },
};

const hydrateAuthSession = () => {
  const saved = localStorage.getItem(authStorageKey);
  if (!saved) return { token: null, user: null };
  try {
    return JSON.parse(saved);
  } catch (error) {
    return { token: null, user: null };
  }
};

const hydrateState = () => {
  const saved = localStorage.getItem(appStorageKey);
  if (!saved) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch (error) {
    return defaultState;
  }
};

const withRecipeMetrics = (state, recipeId) => {
  const approvedReviews = state.reviews.filter(
    (review) => review.recipeId === recipeId && review.status === 'approved',
  );
  return {
    ...state,
    recipes: state.recipes.map((recipe) =>
      recipe.id === recipeId
        ? {
            ...recipe,
            reviewCount: approvedReviews.length,
            rating: Number(getAverageRating(approvedReviews).toFixed(1)),
          }
        : recipe,
    ),
  };
};

const applyUpsertState = (state, key, payload) => {
  const currentItems = state[key];
  const isExisting = currentItems.some((item) => item.id === payload.id);
  const nextItem = {
    ...payload,
    slug: payload.slug || createSlug(payload.title || payload.name || payload.label || payload.id),
  };

  return {
    ...state,
    [key]: isExisting
      ? currentItems.map((item) => (item.id === payload.id ? nextItem : item))
      : [{ ...nextItem, id: payload.id || createId(key.slice(0, -1)) }, ...currentItems],
  };
};

const applyDeleteState = (state, key, id) => ({
  ...state,
  [key]: state[key].filter((item) => item.id !== id),
});

export const AppProvider = ({ children }) => {
  const [auth, setAuth] = useState(hydrateAuthSession);
  const [state, setState] = useState(() => ({
    ...hydrateState(),
    currentUserId: hydrateAuthSession().user?.id || null,
  }));
  const [toasts, setToasts] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem(appStorageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(authStorageKey, JSON.stringify(auth));
    setApiToken(auth.token);
  }, [auth]);

  useEffect(() => {
    let cancelled = false;

    const loadBootstrap = async () => {
      try {
        const data = await api.bootstrap();
        if (cancelled) return;
        setState((current) => ({
          ...current,
          ...Object.fromEntries(contentKeys.map((key) => [key, data[key] || current[key]])),
          settings: data.settings || current.settings,
          currentUserId: auth.user?.id || current.currentUserId,
        }));
        setBackendConnected(true);
        if (auth.token) {
          try {
            const session = await api.me();
            if (!cancelled) {
              setAuth((current) => ({ ...current, user: session.user }));
              setState((current) => ({ ...current, currentUserId: session.user.id }));
            }
          } catch (error) {
            if (!cancelled) {
              setAuth({ token: null, user: null });
              setState((current) => ({ ...current, currentUserId: null }));
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setBackendConnected(false);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  const addToast = (title, tone = 'default') => {
    const id = createId('toast');
    setToasts((current) => [...current, { id, title, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const updateState = (patch) => {
    setState((current) => ({ ...current, ...patch }));
  };

  const persistLocallyFallback = (message) => {
    setBackendConnected(false);
    addToast(message, 'warning');
  };

  const login = async (email, password) => {
    const response = await api.login(email, password);
    setAuth({ token: response.token, user: response.user });
    setState((current) => ({ ...current, currentUserId: response.user.id }));
    setBackendConnected(true);
    addToast(`Signed in as ${response.user.name}.`);
    return response.user;
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    setState((current) => ({ ...current, currentUserId: null }));
    addToast('Signed out.');
  };

  const toggleTheme = () => {
    setState((current) => ({
      ...current,
      theme: current.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const toggleFavorite = (recipeId) => {
    setState((current) => {
      const exists = current.favorites.includes(recipeId);
      const favorites = exists
        ? current.favorites.filter((id) => id !== recipeId)
        : [...current.favorites, recipeId];
      return { ...current, favorites };
    });
    addToast('Saved recipes updated.');
  };

  const toggleCompareRecipe = (recipeId) => {
    setState((current) => {
      const exists = current.compareRecipes.includes(recipeId);
      let compareRecipes = exists
        ? current.compareRecipes.filter((id) => id !== recipeId)
        : [...current.compareRecipes, recipeId];
      compareRecipes = compareRecipes.slice(-3);
      return { ...current, compareRecipes };
    });
  };

  const addRecentlyViewed = (recipeId) => {
    setState((current) => ({
      ...current,
      recentlyViewed: [recipeId, ...current.recentlyViewed.filter((id) => id !== recipeId)].slice(0, 6),
    }));
  };

  const setMealPlanSlot = (day, mealType, recipeId) => {
    setState((current) => ({
      ...current,
      mealPlan: {
        ...current.mealPlan,
        [day]: {
          ...current.mealPlan[day],
          [mealType]: recipeId,
        },
      },
    }));
    addToast('Meal plan updated.');
  };

  const autoFillMealPlan = () => {
    setState((current) => {
      const recipeIds = current.recipes.map((recipe) => recipe.id);
      const nextMealPlan = Object.fromEntries(
        Object.keys(current.mealPlan).map((day, dayIndex) => [
          day,
          {
            breakfast: recipeIds[(dayIndex + 3) % recipeIds.length],
            lunch: recipeIds[(dayIndex + 1) % recipeIds.length],
            dinner: recipeIds[(dayIndex + 5) % recipeIds.length],
          },
        ]),
      );
      return { ...current, mealPlan: nextMealPlan };
    });
    addToast('A smart weekly meal plan is ready.');
  };

  const syncShoppingListFromRecipeIds = (recipeIds) => {
    const recipesToUse = state.recipes.filter((recipe) => recipeIds.includes(recipe.id));
    updateState({ shoppingList: buildShoppingList(recipesToUse) });
    addToast('Shopping list refreshed from recipes.');
  };

  const toggleShoppingItem = (itemId) => {
    setState((current) => ({
      ...current,
      shoppingList: current.shoppingList.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    }));
  };

  const clearShoppingList = () => updateState({ shoppingList: [] });

  const pushNotification = (notification) => {
    const entry = {
      id: createId('notif'),
      createdAt: new Date().toISOString(),
      read: false,
      tone: 'default',
      ...notification,
    };
    setState((current) => ({
      ...current,
      notifications: [entry, ...current.notifications].slice(0, 60),
    }));
  };

  const markNotificationRead = (id) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }));
  };

  const clearNotifications = () => updateState({ notifications: [] });

  const pushAuditEntry = (entry) => {
    const record = {
      id: createId('audit'),
      createdAt: new Date().toISOString(),
      actorId: auth.user?.id || null,
      actorName: auth.user?.name || 'System',
      actorRole: auth.user?.role || 'system',
      ...entry,
    };
    setState((current) => ({
      ...current,
      auditLog: [record, ...current.auditLog].slice(0, 200),
    }));
  };

  const addPantryItem = (rawName) => {
    const name = String(rawName || '').trim();
    if (!name) return;
    setState((current) => {
      if (current.pantry.some((item) => item.toLowerCase() === name.toLowerCase())) {
        return current;
      }
      return { ...current, pantry: [...current.pantry, name] };
    });
    addToast(`Added ${name} to your pantry.`);
  };

  const removePantryItem = (name) => {
    setState((current) => ({
      ...current,
      pantry: current.pantry.filter((item) => item !== name),
    }));
  };

  const clearPantry = () => updateState({ pantry: [] });

  const addMissingToShoppingList = (missingIngredients) => {
    setState((current) => {
      const existingKeys = new Set(current.shoppingList.map((item) => item.id));
      const additions = missingIngredients
        .map((ingredient) => ({
          id: `${ingredient.category || 'pantry'}-${ingredient.name}`,
          name: ingredient.name,
          category: ingredient.category || 'pantry',
          quantity: `${ingredient.amount || ''} ${ingredient.unit || ''}`.trim(),
          checked: false,
        }))
        .filter((item) => !existingKeys.has(item.id));
      return { ...current, shoppingList: [...current.shoppingList, ...additions] };
    });
    addToast('Missing items added to your shopping list.');
  };

  const upsertEntity = (key, payload) => {
    const fallbackPayload = {
      ...payload,
      id: payload.id || createId(key.slice(0, -1)),
      slug: payload.slug || createSlug(payload.title || payload.name || payload.label || payload.id),
    };
    const isUpdate = Boolean(payload.id);
    const auditTitle = payload.title || payload.name || payload.label || singularLabel(key);

    const commit = (result) => {
      setState((current) => applyUpsertState(current, key, result));
      addToast(`${singularLabel(key)} saved successfully.`);
      pushAuditEntry({
        action: isUpdate ? 'update' : 'create',
        entity: key,
        entityId: result.id,
        summary: `${isUpdate ? 'Updated' : 'Created'} ${singularLabel(key).toLowerCase()} "${auditTitle}"`,
      });
      if (key === 'recipes' && !isUpdate) {
        pushNotification({
          tone: 'success',
          title: 'New recipe published',
          body: `"${auditTitle}" was just added to the catalog.`,
          forRole: 'user',
          link: result.slug ? `/recipes/${result.slug}` : '/recipes',
        });
      }
    };

    const fallback = () => {
      setState((current) => applyUpsertState(current, key, fallbackPayload));
      persistLocallyFallback(`${singularLabel(key)} saved locally. Start the backend to persist to MongoDB.`);
    };

    const execute = async () => {
      try {
        const result = payload.id
          ? await api.update(key, payload.id, payload)
          : await api.create(key, payload);
        setBackendConnected(true);
        commit(result);
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const deleteEntity = (key, id) => {
    const targetItem = state[key]?.find((item) => item.id === id);
    const targetLabel = targetItem?.title || targetItem?.name || targetItem?.label || id;
    const commit = () => {
      setState((current) => applyDeleteState(current, key, id));
      addToast(`${singularLabel(key)} deleted.`);
      pushAuditEntry({
        action: 'delete',
        entity: key,
        entityId: id,
        summary: `Deleted ${singularLabel(key).toLowerCase()} "${targetLabel}"`,
      });
    };

    const fallback = () => {
      setState((current) => applyDeleteState(current, key, id));
      persistLocallyFallback(`${singularLabel(key)} deleted locally. Start the backend to persist to MongoDB.`);
    };

    const execute = async () => {
      try {
        await api.remove(key, id);
        setBackendConnected(true);
        commit();
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const saveSettings = (settings) => {
    const merged = { ...state.settings, ...settings };

    const commit = (result) => {
      updateState({ settings: result });
      addToast('Settings saved.');
    };

    const fallback = () => {
      updateState({ settings: merged });
      persistLocallyFallback('Settings saved locally. Start the backend to persist to MongoDB.');
    };

    const execute = async () => {
      try {
        const result = await api.update('settings', merged.id || 'settings-primary', merged);
        setBackendConnected(true);
        commit(result);
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const submitReview = (payload) => {
    const newReview = {
      id: createId('review'),
      userId: state.currentUserId,
      createdAt: new Date().toISOString(),
      status: 'approved',
      ...payload,
    };

    const recipeForReview = state.recipes.find((item) => item.id === payload.recipeId);
    const reviewerName = auth.user?.name || 'A community member';

    const commit = (review) => {
      setState((current) =>
        withRecipeMetrics(
          {
            ...current,
            reviews: [review, ...current.reviews.filter((item) => item.id !== review.id)],
          },
          review.recipeId,
        ),
      );
      addToast('Thanks for sharing your review.');
      pushNotification({
        tone: 'info',
        title: 'New review submitted',
        body: `${reviewerName} left a ${review.rating}-star review on "${recipeForReview?.title || 'a recipe'}".`,
        forRole: 'editor',
        link: '/admin/reviews',
      });
      pushAuditEntry({
        action: 'create',
        entity: 'reviews',
        entityId: review.id,
        summary: `Posted ${review.rating}-star review on "${recipeForReview?.title || 'recipe'}"`,
      });
    };

    const fallback = () => {
      setState((current) =>
        withRecipeMetrics(
          {
            ...current,
            reviews: [newReview, ...current.reviews],
          },
          newReview.recipeId,
        ),
      );
      persistLocallyFallback('Review saved locally. Start the backend to persist to MongoDB.');
    };

    const execute = async () => {
      try {
        const result = await api.create('reviews', payload);
        setBackendConnected(true);
        commit(result);
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const moderateReview = (reviewId, status) => {
    const commit = (review) => {
      setState((current) =>
        withRecipeMetrics(
          {
            ...current,
            reviews: current.reviews.map((item) => (item.id === review.id ? review : item)),
          },
          review.recipeId,
        ),
      );
      addToast(`Review marked ${status}.`);
    };

    const fallback = () => {
      setState((current) => {
        const next = {
          ...current,
          reviews: current.reviews.map((review) =>
            review.id === reviewId ? { ...review, status } : review,
          ),
        };
        const review = next.reviews.find((item) => item.id === reviewId);
        return review ? withRecipeMetrics(next, review.recipeId) : next;
      });
      persistLocallyFallback(`Review marked ${status} locally. Start the backend to persist to MongoDB.`);
    };

    const execute = async () => {
      try {
        const result = await api.updateReviewStatus(reviewId, status);
        setBackendConnected(true);
        commit(result);
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const updateUserRole = (userId, role) => {
    const targetUser = state.users.find((item) => item.id === userId);
    const commit = (user) => {
      setState((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === user.id ? user : item)),
      }));
      addToast('User role updated.');
      pushAuditEntry({
        action: 'role-change',
        entity: 'users',
        entityId: user.id,
        summary: `Changed role of "${user.name}" to ${role}`,
      });
      pushNotification({
        tone: 'info',
        title: 'Your account role changed',
        body: `An admin updated your role to "${role}".`,
        forUserId: user.id,
        link: '/profile',
      });
    };

    const fallback = () => {
      setState((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === userId ? { ...user, role } : user)),
      }));
      persistLocallyFallback('User role updated locally. Start the backend to persist to MongoDB.');
    };

    const execute = async () => {
      try {
        const result = await api.updateUserRole(userId, role);
        setBackendConnected(true);
        commit(result);
      } catch (error) {
        fallback();
      }
    };

    execute();
  };

  const subscribeToNewsletter = async (email) => {
    try {
      const result = await api.subscribe(email);
      setBackendConnected(true);
      setState((current) => {
        const filtered = current.subscribers.filter((item) => item.email !== result.email);
        return { ...current, subscribers: [result, ...filtered] };
      });
      addToast(
        result.alreadySubscribed
          ? 'You are already subscribed.'
          : 'Subscribed! Welcome to the newsletter.',
      );
      return result;
    } catch (error) {
      persistLocallyFallback('Could not save subscription. Start the backend to persist.');
      throw error;
    }
  };

  const sendContactMessage = async (payload) => {
    try {
      const result = await api.submitContactMessage({
        ...payload,
        userId: auth.user?.id || null,
      });
      setBackendConnected(true);
      setState((current) => ({
        ...current,
        contactMessages: [result, ...current.contactMessages],
      }));
      addToast('Message sent — we will be in touch soon.');
      pushNotification({
        tone: 'info',
        title: 'New contact message',
        body: `${result.name} sent a "${result.type}" inquiry.`,
        forRole: 'editor',
        link: '/admin/messages',
      });
      return result;
    } catch (error) {
      persistLocallyFallback('Could not send message. Start the backend to persist.');
      throw error;
    }
  };

  const submitRecipeIdea = async (payload) => {
    try {
      const result = await api.submitRecipeIdea(payload);
      setBackendConnected(true);
      setState((current) => ({
        ...current,
        recipeSubmissions: [result, ...current.recipeSubmissions],
      }));
      addToast('Recipe idea submitted! Editors will review it shortly.');
      pushNotification({
        tone: 'info',
        title: 'New recipe submission',
        body: `${result.submitterName || 'A reader'} submitted "${result.title}".`,
        forRole: 'editor',
        link: '/admin/submissions',
      });
      return result;
    } catch (error) {
      persistLocallyFallback('Could not submit recipe idea. Start the backend to persist.');
      throw error;
    }
  };

  const updateSubmissionStatus = async (id, status, reviewerNote = '') => {
    try {
      const result = await api.updateSubmissionStatus(id, status, reviewerNote);
      setBackendConnected(true);
      setState((current) => ({
        ...current,
        recipeSubmissions: current.recipeSubmissions.map((item) =>
          item.id === id ? result : item,
        ),
      }));
      addToast(`Submission ${status}.`);
      pushAuditEntry({
        action: `submission-${status}`,
        entity: 'recipeSubmissions',
        entityId: id,
        summary: `${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'} submission "${result.title}"`,
      });
      return result;
    } catch (error) {
      persistLocallyFallback('Could not update submission. Start the backend to persist.');
      throw error;
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const result = await api.updateMessageStatus(id, status);
      setBackendConnected(true);
      setState((current) => ({
        ...current,
        contactMessages: current.contactMessages.map((item) =>
          item.id === id ? result : item,
        ),
      }));
      addToast(`Message marked ${status}.`);
      return result;
    } catch (error) {
      persistLocallyFallback('Could not update message. Start the backend to persist.');
      throw error;
    }
  };

  const saveRecipeNote = async (recipeId, body) => {
    try {
      const result = await api.saveRecipeNote({ recipeId, body });
      setBackendConnected(true);
      setState((current) => {
        const filtered = current.recipeNotes.filter(
          (item) => !(item.recipeId === recipeId && item.userId === result.userId),
        );
        return { ...current, recipeNotes: [result, ...filtered] };
      });
      addToast('Note saved.');
      return result;
    } catch (error) {
      persistLocallyFallback('Could not save note. Start the backend to persist.');
      throw error;
    }
  };

  const deleteRecipeNote = async (recipeId) => {
    try {
      await api.deleteRecipeNote(recipeId);
      setBackendConnected(true);
      setState((current) => ({
        ...current,
        recipeNotes: current.recipeNotes.filter(
          (item) => !(item.recipeId === recipeId && item.userId === auth.user?.id),
        ),
      }));
      addToast('Note removed.');
    } catch (error) {
      persistLocallyFallback('Could not delete note. Start the backend to persist.');
      throw error;
    }
  };

  const currentUser = useMemo(
    () =>
      (auth.user && state.users.find((user) => user.id === auth.user.id)) ||
      auth.user ||
      null,
    [auth.user, state.users],
  );

  const isAuthenticated = Boolean(auth.token && currentUser);

  const value = useMemo(
    () => ({
      ...state,
      toasts,
      currentUser,
      authUser: currentUser,
      authToken: auth.token,
      isAuthenticated,
      backendConnected,
      isBootstrapping,
      login,
      logout,
      toggleTheme,
      toggleFavorite,
      toggleCompareRecipe,
      addRecentlyViewed,
      setMealPlanSlot,
      autoFillMealPlan,
      syncShoppingListFromRecipeIds,
      toggleShoppingItem,
      clearShoppingList,
      upsertEntity,
      deleteEntity,
      submitReview,
      moderateReview,
      updateUserRole,
      saveSettings,
      addToast,
      addPantryItem,
      removePantryItem,
      clearPantry,
      addMissingToShoppingList,
      pushNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      pushAuditEntry,
      subscribeToNewsletter,
      sendContactMessage,
      submitRecipeIdea,
      updateSubmissionStatus,
      updateMessageStatus,
      saveRecipeNote,
      deleteRecipeNote,
    }),
    [auth.token, backendConnected, currentUser, isAuthenticated, isBootstrapping, state, toasts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
