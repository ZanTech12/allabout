import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // A tiny delay ensures the new page content has rendered 
    // before we try to scroll it to the top.
    const timer = setTimeout(() => {
      // 1. Try the standard window & document
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      // 2. Aggressively find and scroll your layout containers
      const selectors = [
        "#root", 
        ".app-layout", 
        ".app-main", 
        "main", 
        "#dashboard-scroll-container"
      ];
      
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollTop = 0;
          el.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
      });
    }, 50); // 50 millisecond delay

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}