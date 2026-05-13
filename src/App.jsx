import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import { LoadingGrid } from './components/common/UI';
import { useApp } from './context/AppContext';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const RecipesPage = lazy(() => import('./pages/public/RecipesPages'));
const RecipeDetailPage = lazy(() => import('./pages/public/RecipeDetailPage'));
const CategoryPage = lazy(() =>
  import('./pages/public/RecipesPages').then((module) => ({ default: module.CategoryPage })),
);
const CuisinePage = lazy(() =>
  import('./pages/public/RecipesPages').then((module) => ({ default: module.CuisinePage })),
);
const RecipesSavedPage = lazy(() =>
  import('./pages/public/RecipesPages').then((module) => ({ default: module.RecipesSavedPage })),
);
const MealPlannerPage = lazy(() =>
  import('./pages/public/RecipesPages').then((module) => ({ default: module.MealPlannerPage })),
);
const ShoppingListPage = lazy(() =>
  import('./pages/public/RecipesPages').then((module) => ({ default: module.ShoppingListPage })),
);
const PantryPage = lazy(() =>
  import('./pages/public/PantryPage').then((module) => ({ default: module.PantryPage })),
);
const BlogListPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.BlogListPage })),
);
const BlogDetailPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.BlogDetailPage })),
);
const AboutPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.AboutPage })),
);
const ContactPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.ContactPage })),
);
const AuthorProfilePage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.AuthorProfilePage })),
);
const CollectionsPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.CollectionsPage })),
);
const CollectionDetailPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.CollectionDetailPage })),
);
const UserProfilePage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.UserProfilePage })),
);
const LoginPage = lazy(() =>
  import('./pages/public/AuthPages').then((module) => ({ default: module.LoginPage })),
);
const AccessDeniedPage = lazy(() =>
  import('./pages/public/AuthPages').then((module) => ({ default: module.AccessDeniedPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/public/ContentPages').then((module) => ({ default: module.NotFoundPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminDashboardPage })),
);
const AdminRecipesPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminRecipesPage })),
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminCategoriesPage })),
);
const AdminCuisinesPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminCuisinesPage })),
);
const AdminBlogsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminBlogsPage })),
);
const AdminAuthorsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminAuthorsPage })),
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminReviewsPage })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminUsersPage })),
);
const AdminCollectionsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminCollectionsPage })),
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminSettingsPage })),
);
const AdminAuditPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminAuditPage })),
);
const AdminAnnouncementsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminAnnouncementsPage })),
);
const AdminMessagesPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminMessagesPage })),
);
const AdminSubmissionsPage = lazy(() =>
  import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminSubmissionsPage })),
);
const SubmitRecipePage = lazy(() =>
  import('./pages/public/SubmitRecipePage').then((module) => ({ default: module.SubmitRecipePage })),
);

const RouteLoader = () => (
  <div className="container page-shell">
    <LoadingGrid count={6} />
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, currentUser, isBootstrapping } = useApp();
  const location = useLocation();

  if (isBootstrapping) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(currentUser?.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

const App = () => (
  <Suspense fallback={<RouteLoader />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/cuisine/:slug" element={<CuisinePage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/authors/:slug" element={<AuthorProfilePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        <Route path="/saved" element={<ProtectedRoute><RecipesSavedPage /></ProtectedRoute>} />
        <Route path="/meal-planner" element={<ProtectedRoute><MealPlannerPage /></ProtectedRoute>} />
        <Route path="/shopping-list" element={<ProtectedRoute><ShoppingListPage /></ProtectedRoute>} />
        <Route path="/pantry" element={<ProtectedRoute><PantryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        <Route path="/submit-recipe" element={<ProtectedRoute><SubmitRecipePage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'editor']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="recipes" element={<AdminRecipesPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="cuisines" element={<AdminCuisinesPage />} />
        <Route path="blogs" element={<AdminBlogsPage />} />
        <Route path="authors" element={<AdminAuthorsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="collections" element={<AdminCollectionsPage />} />
        <Route path="settings" element={<ProtectedRoute roles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="submissions" element={<AdminSubmissionsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;
