import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { EmptyState } from './components/ui/States'
import { AuthProvider } from './features/auth/AuthProvider'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { CatalogProvider } from './features/catalog/CatalogProvider'

// Pages load on first visit, so the charting library (Overview, Reports)
// isn't part of the initial download for every other page.
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <CatalogProvider>
          <AdminLayout />
        </CatalogProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./features/dashboard/DashboardPage')).DashboardPage }) },
      { path: 'expenses', lazy: async () => ({ Component: (await import('./features/expenses/ExpensesPage')).ExpensesPage }) },
      { path: 'reimbursements', lazy: async () => ({ Component: (await import('./features/reimbursements/ReimbursementsPage')).ReimbursementsPage }) },
      { path: 'wishlist', lazy: async () => ({ Component: (await import('./features/wishlist/WishlistPage')).WishlistPage }) },
      { path: 'budgets', lazy: async () => ({ Component: (await import('./features/budgets/BudgetsPage')).BudgetsPage }) },
      { path: 'reports', lazy: async () => ({ Component: (await import('./features/reports/ReportsPage')).ReportsPage }) },
      { path: 'categories', lazy: async () => ({ Component: (await import('./features/catalog/CatalogPage')).CatalogPage }) },
      { path: 'users', lazy: async () => ({ Component: (await import('./features/users/UsersPage')).UsersPage }) },
      { path: 'activity', lazy: async () => ({ Component: (await import('./features/activity/ActivityPage')).ActivityPage }) },
      { path: '*', element: <EmptyState title="Page not found" message="The chapter you are looking for is not in this book." /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
