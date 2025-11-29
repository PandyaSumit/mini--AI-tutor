import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <ToastProvider>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </ToastProvider>
        </AuthProvider>
    </React.StrictMode>,
)
