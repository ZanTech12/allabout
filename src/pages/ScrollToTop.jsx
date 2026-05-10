function ScrollToTop() {
  const { pathname } = useLocation(); 
  
  useEffect(() => { 
    // 1. Scroll the standard browser window to the top (for public pages like Home, Login)
    window.scrollTo(0, 0); 
    
    // 2. Scroll the Admin Dashboard internal container to the top (for admin pages)
    const dashboardContainer = document.getElementById("dashboard-scroll-container");
    if (dashboardContainer) {
      dashboardContainer.scrollTo(0, 0);
    }
  }, [pathname]);
  
  return null;
}