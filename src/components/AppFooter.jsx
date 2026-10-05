import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter
      className="px-4"
      style={{
        minHeight: '64px',
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 16px rgba(17, 24, 39, 0.03)',
        paddingTop: '14px',
        paddingBottom: '14px',
      }}
    >
      {/* Left Side */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#6b7280',
          fontSize: '13px',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#e8bd35',
            display: 'inline-block',
            boxShadow: '0 0 0 3px rgba(232, 189, 53, 0.12)',
          }}
        />

        <span>
          &copy; 2026{' '}
          <strong
            style={{
              color: '#111827',
              fontWeight: 700,
            }}
          >
            Princess Cutz
          </strong>
        </span>
      </div>

      {/* Right Side */}
      <div
        className="ms-auto"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
        }}
      >
        <span
          style={{
            color: '#9ca3af',
          }}
        >
          Powered by
        </span>

        <a
          href="https://wa.me/qr/Q5VF7APE45NHD1"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#111827',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            borderBottom: '1px solid rgba(232, 189, 53, 0.45)',
            paddingBottom: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#c9a227'
            e.currentTarget.style.borderBottomColor = '#c9a227'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111827'
            e.currentTarget.style.borderBottomColor = 'rgba(232, 189, 53, 0.45)'
          }}
        >
          IMVON  — Run Your Business Smarter
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
