import React from 'react'
import ReactDOM from 'react-dom/client'

// 1. Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'

// 2. Import your global base styles
import './index.css'

import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)