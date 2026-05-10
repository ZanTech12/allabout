// ScrollToTopButton.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation(); // Listen to route changes

  useEffect(() => {
    // Find the dashboard scroll container (if it exists)
    const dashboardContainer = document.getElementById("dashboard-scroll-container");

    const handleScroll = () => {
      // Check scroll position of either the dashboard container OR the standard window
      const windowScroll = window.scrollY;
      const containerScroll = dashboardContainer ? dashboardContainer.scrollTop : 0;
      
      setIsVisible(windowScroll > 300 || containerScroll > 300);
    };

    // Add listeners to both (it's safe to add to window even if it's not the one scrolling)
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (dashboardContainer) {
      dashboardContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Run once on mount/route change in case we load already scrolled
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (dashboardContainer) {
        dashboardContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [location]); // Re-run this logic every time the user navigates to a new page

  const scrollToTop = () => {
    const dashboardContainer = document.getElementById("dashboard-scroll-container");
    
    // If the dashboard container exists and is scrolled, scroll it
    if (dashboardContainer && dashboardContainer.scrollTop > 0) {
      dashboardContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Otherwise, scroll the standard window
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      className={`scroll-to-top-btn ${isVisible ? "scroll-to-top-btn--visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp width={20} />
    </button>
  );
}