/**
 * AppSidebar Component
 *
 * Collapsible navigation sidebar with branding, menu items, and toggle controls.
 *
 * Features:
 * - Redux-controlled visibility state
 * - Unfoldable/narrow mode for more screen space
 * - Brand logo with full and narrow variants
 * - Close button for mobile devices
 * - Footer with toggle button
 * - Dark color scheme
 * - Fixed positioning
 */
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()

  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      className="border-end onishakara-sidebar"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({
          type: 'set',
          sidebarShow: visible,
        })
      }}
      style={{
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 55%, #111827 100%)',
        borderRight: '1px solid rgba(232, 189, 53, 0.16)',
        boxShadow: '8px 0 30px rgba(0, 0, 0, 0.18)',
      }}
    >
      {/* =====================================================
          SIDEBAR HEADER
      ====================================================== */}

      <CSidebarHeader
        className="border-bottom"
        style={{
          minHeight: '74px',
          padding: '0 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0))',
        }}
      >
        {/* =====================================================
            DESKTOP BRAND
        ====================================================== */}

        <CSidebarBrand
          to="/"
          className="d-flex align-items-center"
          style={{
            textDecoration: 'none',
            width: '100%',
            minHeight: '72px',
          }}
        >
          <div
            className="sidebar-brand-full d-flex align-items-center"
            style={{
              gap: '11px',
            }}
          >
            {/* Brand Logo */}

            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #e8bd35 0%, #c9a227 100%)',
                boxShadow: '0 6px 18px rgba(232, 189, 53, 0.22)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <CIcon
                icon={logo}
                height={27}
                style={{
                  maxWidth: '31px',
                }}
              />
            </div>

            {/* =================================================
                ONISHAKARA BRAND
            ================================================== */}

            <div
              style={{
                lineHeight: 1.1,
              }}
            >
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                PRINCESS CUTZ
              </div>

              <div
                style={{
                  color: '#e8bd35',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  marginTop: '4px',
                }}
              >
                UNISEX SALON
              </div>
            </div>
          </div>

          {/* =====================================================
              NARROW BRAND
          ====================================================== */}

          <div
            className="sidebar-brand-narrow"
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #e8bd35 0%, #c9a227 100%)',
                boxShadow: '0 6px 18px rgba(232, 189, 53, 0.22)',
              }}
            >
              <CIcon icon={sygnet} height={25} />
            </div>
          </div>
        </CSidebarBrand>

        {/* =====================================================
            MOBILE CLOSE
        ====================================================== */}

        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() =>
            dispatch({
              type: 'set',
              sidebarShow: false,
            })
          }
          style={{
            opacity: 0.8,
          }}
        />
      </CSidebarHeader>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '10px',
          paddingBottom: '10px',
        }}
      >
        <AppSidebarNav items={navigation} />
      </div>

      {/* =====================================================
          SIDEBAR FOOTER
      ====================================================== */}

      <CSidebarFooter
        className="border-top d-none d-lg-flex"
        style={{
          minHeight: '54px',
          padding: '8px 10px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.12))',
        }}
      >
        <CSidebarToggler
          onClick={() =>
            dispatch({
              type: 'set',
              sidebarUnfoldable: !unfoldable,
            })
          }
          style={{
            color: '#e8bd35',
            opacity: 0.9,
          }}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
