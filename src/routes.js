/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * Each route object contains:
 * - path: URL path for the route
 * - name: Human-readable name for breadcrumbs
 * - element: Lazy-loaded React component
 * - exact: (optional) Requires exact path match
 *
 * @module routes
 */

import React from 'react'

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const viewProduct = React.lazy(() => import('./product/viewProduct'))
const Products = React.lazy(() => import('./product/product'))
// const Pos = React.lazy(() => import('./pos/posPage'))

// Base
const Bin = React.lazy(() => import('./product/RecycleBin'))
const Expense = React.lazy(() => import('./expense/AddExpense'))
const viewExpense = React.lazy(() => import('./expense/ExpenseList'))
const Staff = React.lazy(() => import('./staff/AddStaff'))
const vStaff = React.lazy(() => import('./staff/ViewStaff'))
const Service = React.lazy(() => import('./service/CreateService'))
const viewService = React.lazy(() => import('./service/ViewServices'))
const Customer = React.lazy(() => import('./customers/CreateCustomer'))
const viewCustomer = React.lazy(() => import('./customers/ViewCustomers'))
const EditCustomer = React.lazy(() => import('./customers/EditCustomer'))
const EditService = React.lazy(() => import('./service/EditService'))
const LoyaltyCard = React.lazy(() => import('./customers/LoyaltyCards'))
const Commission = React.lazy(() => import('./staff/Commission'))
const Reports = React.lazy(() => import('./pos/Report'))
const Settings = React.lazy(() => import('./Settings'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))
const ChipInput = React.lazy(() => import('./views/forms/chip-input/ChipInput'))
const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))

/**
 * Array of route configuration objects
 *
 * @type {Array<Object>}
 * @property {string} path - URL path pattern
 * @property {string} name - Display name for breadcrumbs and navigation
 * @property {React.LazyExoticComponent} element - Lazy-loaded component
 * @property {boolean} [exact] - Whether to match path exactly
 *
 * @example
 * // Route renders when URL matches '/dashboard'
 * { path: '/dashboard', name: 'Dashboard', element: Dashboard }
 *
 * @example
 * // Route with exact match required
 * { path: '/base', name: 'Base', element: Cards, exact: true }
 */
export const routes = [
  { path: '/', exact: true, name: 'Home' },
  {
    path: '/dashboard',
    name: 'Dashboard',
    element: Dashboard,
    roles: ['admin', 'manager', 'cashier'],
  },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/setting', name: 'Settings', element: Settings, roles: ['admin'] },
  { path: '/report', name: 'Report', element: Reports, roles: ['admin', 'manager'] },
  { path: '/commission', name: 'Commission', element: Commission, roles: ['admin', 'manager'] },
  {
    path: '/loyaltycard',
    name: 'Loyalty Card',
    element: LoyaltyCard,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    path: '/editService/:id',
    name: 'Edit Service',
    element: EditService,
    roles: ['admin', 'manager'],
  },
  {
    path: '/editCustomer/:id',
    name: 'Edit Customer',
    element: EditCustomer,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    path: '/viewCustomer',
    name: 'View Customer',
    element: viewCustomer,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    path: '/customer',
    exact: true,
    name: 'Customer',
    element: Customer,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    path: '/viewService',
    name: 'View Services',
    element: viewService,
    roles: ['admin', 'manager'],
  },
  { path: '/service', name: 'Services', element: Service, roles: ['admin', 'manager', 'cashier'] },
  { path: '/viewStaff', name: 'View Staff', element: vStaff, roles: ['admin'] },
  { path: '/staff', name: 'Staff', element: Staff, roles: ['admin'] },
  { path: '/viewExpense', name: 'View Expense', element: viewExpense, roles: ['admin', 'manager'] },
  { path: '/expense', name: 'Expense', element: Expense, roles: ['admin', 'manager'] },
  { path: '/recycleBin', name: 'Bin', element: Bin },
  {
    path: '/viewProduct',
    name: 'View Products',
    element: viewProduct,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    path: '/products',
    name: 'Products',
    element: Products,
    roles: ['admin', 'manager', 'cashier'],
  },
  // { path: '/pos', name: 'Pos', element: Pos },
]

export default routes
