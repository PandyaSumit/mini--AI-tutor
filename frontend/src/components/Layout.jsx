import React from 'react';
import Sidebar from './Sidebar';

/**
 * Layout Component
 *
 * A reusable wrapper for all authenticated pages that provides:
 * - Consistent sidebar navigation
 * - Proper flex layout structure
 * - Responsive design (mobile bottom nav + desktop sidebar)
 * - Centralized layout management
 *
 * Usage:
 * <Layout>
 *   <YourPageComponent />
 * </Layout>
 */
const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - handles mobile/desktop rendering internally */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 overflow-x-hidden">
                {children}
            </div>
        </div>
    );
};

export default Layout;
