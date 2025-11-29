import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileSidebar from './MobileSidebar';

const Layout = ({ children }) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Header - ChatGPT Style */}
            <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} />

            {/* Mobile Sidebar - ChatGPT Style */}
            <MobileSidebar
                isOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
            />

            {/* Desktop Sidebar - Original */}
            <Sidebar />

            {/* Main Content Area - Add top padding for mobile header */}
            <div className="flex-1 overflow-x-hidden pt-14 lg:pt-0">
                {children}
            </div>
        </div>
    );
};

export default Layout;
