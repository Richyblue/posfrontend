import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import LogoutButton from '../auth/logout'

const AppHeader = () => {
  const headerRef = useRef()

  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const dispatch = useDispatch()

  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    }

    document.addEventListener('scroll', handleScroll)

    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <CHeader
      position="sticky"
      ref={headerRef}
      className="p-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1030,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* =====================================================
          MAIN HEADER
      ====================================================== */}

      <CContainer
        fluid
        className="px-3 px-lg-4"
        style={{
          minHeight: '70px',
        }}
      >
        {/* =====================================================
            SIDEBAR TOGGLE
        ====================================================== */}

        <CHeaderToggler
          onClick={() =>
            dispatch({
              type: 'set',
              sidebarShow: !sidebarShow,
            })
          }
          style={{
            marginInlineStart: '-6px',
            width: '44px',
            height: '44px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111827',
            background: '#f5f7fb',
            border: '1px solid #e5e7eb',
          }}
        >
          <CIcon
            icon={cilMenu}
            size="lg"
            style={{
              width: '20px',
              height: '20px',
            }}
          />
        </CHeaderToggler>

        {/* =====================================================
            ONISHAKARA BRAND
        ====================================================== */}

        <div
          className="d-none d-lg-flex align-items-center ms-3"
          style={{
            borderLeft: '1px solid #e5e7eb',
            paddingLeft: '18px',
          }}
        >
          {/* Brand Mark */}

          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: '#111827',
              color: '#e8bd35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '15px',
              marginRight: '10px',
              boxShadow: '0 3px 10px rgba(17, 24, 39, 0.12)',
            }}
          >
            P
          </div>

          {/* Brand Name */}

          <div>
            <div
              style={{
                color: '#111827',
                fontSize: '14px',
                fontWeight: '800',
                lineHeight: '1.1',
                letterSpacing: '0.4px',
              }}
            >
              PRINCESS CUTZ
            </div>

            <div
              style={{
                color: '#9ca3af',
                fontSize: '9px',
                fontWeight: '700',
                letterSpacing: '1.2px',
                marginTop: '2px',
              }}
            >
              UNISEX SALON
            </div>
          </div>
        </div>

        {/* =====================================================
            PRIMARY NAVIGATION
        ====================================================== */}

        <CHeaderNav className="d-none d-md-flex ms-4">
          {/* Dashboard */}

          <CNavItem>
            <CNavLink
              to="/dashboard"
              as={NavLink}
              style={({ isActive }) => ({
                color: isActive ? '#a07800' : '#4b5563',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                padding: '10px 13px',
                borderRadius: '9px',
                background: isActive ? '#fff8e1' : 'transparent',
                marginRight: '3px',
              })}
            >
              Dashboard
            </CNavLink>
          </CNavItem>

          {/* Users */}

          <CNavItem>
            <CNavLink
              to="/viewStaff"
              as={NavLink}
              style={({ isActive }) => ({
                color: isActive ? '#a07800' : '#4b5563',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                padding: '10px 13px',
                borderRadius: '9px',
                background: isActive ? '#fff8e1' : 'transparent',
                marginRight: '3px',
              })}
            >
              Staff
            </CNavLink>
          </CNavItem>

          {/* Products */}

          <CNavItem>
            <CNavLink
              to="/products"
              as={NavLink}
              style={({ isActive }) => ({
                color: isActive ? '#a07800' : '#4b5563',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                padding: '10px 13px',
                borderRadius: '9px',
                background: isActive ? '#fff8e1' : 'transparent',
                marginRight: '3px',
              })}
            >
              Products
            </CNavLink>
          </CNavItem>

          {/* Settings */}

          <CNavItem>
            <CNavLink
              to="/setting"
              as={NavLink}
              style={({ isActive }) => ({
                color: isActive ? '#a07800' : '#4b5563',
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                padding: '10px 13px',
                borderRadius: '9px',
                background: isActive ? '#fff8e1' : 'transparent',
                marginRight: '3px',
              })}
            >
              Settings
            </CNavLink>
          </CNavItem>

          {/* Logout */}

          <CNavItem
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '4px',
            }}
          >
            <LogoutButton />
          </CNavItem>
        </CHeaderNav>

        {/* =====================================================
            RIGHT SIDE ACTIONS
        ====================================================== */}

        <CHeaderNav className="ms-auto align-items-center">
          {/* =====================================================
              NOTIFICATIONS
          ====================================================== */}

          <CNavItem>
            <CNavLink
              href="#"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                position: 'relative',
                marginRight: '3px',
              }}
            >
              <CIcon
                icon={cilBell}
                style={{
                  width: '18px',
                  height: '18px',
                }}
              />

              <span
                style={{
                  position: 'absolute',
                  top: '7px',
                  right: '7px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#e8bd35',
                  border: '2px solid #fff',
                }}
              />
            </CNavLink>
          </CNavItem>

          {/* =====================================================
              ACTIVITY / LIST
          ====================================================== */}

          <CNavItem className="d-none d-sm-block">
            <CNavLink
              href="#"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                marginRight: '3px',
              }}
            >
              <CIcon
                icon={cilList}
                style={{
                  width: '18px',
                  height: '18px',
                }}
              />
            </CNavLink>
          </CNavItem>

          {/* =====================================================
              MESSAGES
          ====================================================== */}

          <CNavItem className="d-none d-sm-block">
            <CNavLink
              href="#"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
                marginRight: '6px',
              }}
            >
              <CIcon
                icon={cilEnvelopeOpen}
                style={{
                  width: '18px',
                  height: '18px',
                }}
              />
            </CNavLink>
          </CNavItem>

          {/* =====================================================
              DIVIDER
          ====================================================== */}

          <li
            className="nav-item py-1 d-none d-sm-block"
            style={{
              marginRight: '8px',
            }}
          >
            <div
              style={{
                width: '1px',
                height: '28px',
                background: '#e5e7eb',
              }}
            />
          </li>

          {/* =====================================================
              THEME SWITCHER
          ====================================================== */}

          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle
              caret={false}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                padding: 0,
              }}
            >
              {colorMode === 'dark' ? (
                <CIcon
                  icon={cilMoon}
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
                />
              ) : colorMode === 'auto' ? (
                <CIcon
                  icon={cilContrast}
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
                />
              ) : (
                <CIcon
                  icon={cilSun}
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
                />
              )}
            </CDropdownToggle>

            <CDropdownMenu
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '7px',
                minWidth: '150px',
                boxShadow: '0 10px 30px rgba(17, 24, 39, 0.12)',
              }}
            >
              {/* Light */}

              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('light')}
                style={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  padding: '9px 10px',
                }}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" />
                Light
              </CDropdownItem>

              {/* Dark */}

              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
                style={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  padding: '9px 10px',
                }}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" />
                Dark
              </CDropdownItem>

              {/* Auto */}

              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
                style={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  padding: '9px 10px',
                }}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" />
                Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>

          {/* =====================================================
              DIVIDER
          ====================================================== */}

          <li
            className="nav-item py-1 d-none d-sm-block"
            style={{
              marginLeft: '8px',
            }}
          >
            <div
              style={{
                width: '1px',
                height: '28px',
                background: '#e5e7eb',
              }}
            />
          </li>

          {/* =====================================================
              ONISHAKARA USER / BRAND MARK
          ====================================================== */}

          <li
            className="nav-item d-none d-md-flex align-items-center"
            style={{
              marginLeft: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: '#111827',
                color: '#e8bd35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '14px',
                boxShadow: '0 3px 10px rgba(17, 24, 39, 0.12)',
              }}
            >
              O
            </div>
          </li>
        </CHeaderNav>
      </CContainer>

      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div
        style={{
          background: '#fff',
          borderTop: '1px solid #f1f3f5',
        }}
      >
        <CContainer
          fluid
          className="px-3 px-lg-4"
          style={{
            minHeight: '42px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AppBreadcrumb />
        </CContainer>
      </div>
    </CHeader>
  )
}

export default AppHeader
