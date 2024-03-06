import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './components/UserProvider/UserProvider.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    <BrowserRouter>
      <UserProvider>
           <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
)