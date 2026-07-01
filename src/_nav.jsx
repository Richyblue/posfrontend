/**
 * Sidebar Navigation Configuration
 *
 * Defines the structure and content of the sidebar navigation menu.
 * Supports multiple navigation component types from CoreUI React:
 * - CNavItem: Single navigation link
 * - CNavGroup: Collapsible group of links
 * - CNavTitle: Section title/divider
 *
 * @module _nav
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilPeople,
  cibLibreoffice,
  cilBarChart,
  cilPencil,
  cilStorage,
  cilSpeedometer,
  cilCart,
  cilUserPlus,
  cilCreditCard,
  cilSettings,
  cilAccountLogout,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

/**
 * Navigation menu structure array
 *
 * @type {Array<Object>}
 * @property {React.ComponentType} component - CoreUI nav component (CNavItem, CNavGroup, CNavTitle)
 * @property {string} name - Display text for the nav item
 * @property {string} [to] - Internal route path (for CNavItem with routing)
 * @property {string} [href] - External URL (for CNavItem with external links)
 * @property {React.ReactNode} [icon] - Icon element to display
 * @property {Object} [badge] - Optional badge configuration
 * @property {string} badge.color - Badge color (info, danger, success, etc.)
 * @property {string} badge.text - Badge text content
 * @property {Array<Object>} [items] - Child items for CNavGroup
 *
 * @example
 * // Simple navigation item
 * {
 *   component: CNavItem,
 *   name: 'Dashboard',
 *   to: '/dashboard',
 *   icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
 * }
 *
 * @example
 * // Navigation group with children
 * {
 *   component: CNavGroup,
 *   name: 'Base',
 *   to: '/base',
 *   icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
 *   items: [
 *     {
 *       component: CNavItem,
 *       name: 'Cards',
 *       to: '/base/cards',
 *     },
 *   ],
 * }
 *
 * @example
 * // Section title
 * {
 *   component: CNavTitle,
 *   name: 'Theme',
 * }
 */
const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavGroup,
    name: 'Users',
    to: '/buttons',
    icon: <CIcon icon={cilUserPlus} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Admin',
        to: '/buttons/buttons',
      },
      {
        component: CNavItem,
        name: 'staff',
        to: '/staff',
      },
      {
        component: CNavItem,
        name: 'View',
        to: '/viewStaff',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Products Management',
    to: '/products',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Create Products',
        to: '/products',
      },
      {
        component: CNavItem,
        name: 'View Product',
        to: '/viewproduct',
      },
      {
        component: CNavItem,
        name: 'Recycle Bin',
        to: '/recycleBin',
      },
    ],
  },

  {
    component: CNavItem,
    name: 'Pos',
    to: '/pos',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },

  {
    component: CNavGroup,
    name: 'Expenses Management',
    to: '',
    icon: <CIcon icon={cilBarChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Create Expenes',
        to: '/expense',
      },
      {
        component: CNavItem,
        name: 'View Expense',
        to: '/viewExpense',
      },
      {
        component: CNavItem,
        name: 'Recycle Bin',
        to: '/recycleBin',
      },
    ],
  },

  {
    component: CNavGroup,
    name: 'Services',
    to: '',
    icon: <CIcon icon={cibLibreoffice} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Create Service',
        to: '/service',
      },
      {
        component: CNavItem,
        name: 'View Service',
        to: '/viewService',
      },
    ],
  },

  {
    component: CNavGroup,
    name: 'Customer',
    to: '',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Create Customer',
        to: '/customer',
      },
      {
        component: CNavItem,
        name: 'View Customer',
        to: '/viewCustomer',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Sales Report',
    to: '/report',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: 'Return',
    to: '/returns',
    icon: <CIcon icon={cilBarChart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Commissions',
    to: '/commission',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Loyaltys',
    to: '/loyaltycard',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: 'Settings',
    to: '/setting',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Signout',
    to: '/logout',
    icon: <CIcon icon={cilAccountLogout} customClassName="nav-icon" />,
  },
]

export default _nav
