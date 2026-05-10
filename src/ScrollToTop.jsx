// src/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ✅ Smart ScrollToTop that handles both Window and Admin Dashboard containers automatically
export default function ScrollToTop() {
  const { pathname } = useLocation(); 
  
  useEffect(() => { 
    // 1. Scroll the standard window/browser to the top (for public pages like Home, Login, etc.)
    window.scrollTo(0, 0); 
    
    // 2. Scroll the Admin Dashboard internal container to the top
    const dashboardContainer = document.getElementById("dashboard-scroll-container");
    if (dashboardContainer) {
      dashboardContainer.scrollTo(0, 0);
    }
  }, [pathname]);
  
  return null;
}