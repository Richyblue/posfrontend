import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import store from './store'

import { SettingsProvider } from './context/SettingsContext'

import '../src/scss/custom.css'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </Provider>,
)
