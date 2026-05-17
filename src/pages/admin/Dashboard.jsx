// AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  Zap,
  Box,
  Tags,
  Users,
  Palette,
  Settings,
  ChevronRight,
  Activity,
  ChevronsLeft,
  Clock,
  Bell,
  ChevronDown,
  Shield,
  ClipboardList, 
  MessageSquare,
  KeyRound // ✅ ADDED for Invite Tokens
} from "lucide-react";

import ProductsPage from "./ProductsPage";
import CategoriesPage from "./CategoriesPage";
import SiteSettingsPage from "./SiteSettingsPage";
import UsersPage from "./UsersPage";
import TrackOrderPage from "./TrackOrder"; 
import AllOrders from "./AllOrders"; 
import MessagesPage from "./MessagesPage"; 
import InviteTokensPage from "./InviteTokensPage"; // ✅ ADDED for Invite Tokens
// import AppearancePage from "./AppearancePage"; // <-- Uncomment when you create this page
import api from "../../api/axios";
import "./Dashboard.css";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("products");
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchSiteSettings();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchSiteSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/site-settings");
      setSiteSettings(res.data);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  // Note: We pass the React component directly (e.g., Box) instead of a string
  const menuItems = [
    { key: "products", label: "Products", icon: Box, description: "Manage inventory" },
    { key: "categories", label: "Categories", icon: Tags, description: "Organize catalog" },
    { key: "users", label: "Users", icon: Users, description: "Manage accounts" },
    { key: "invite-tokens", label: "Invite Tokens", icon: KeyRound, description: "Engineer registrations" }, // ✅ ADDED
    { key: "track-order", label: "Track Order", icon: ChevronRight, description: "Track & update orders" }, 
    { key: "all-orders", label: "All Orders", icon: ClipboardList, description: "View recent orders" }, 
    { key: "messages", label: "Messages", icon: MessageSquare, description: "Contact form messages" }, 
    { key: "appearance", label: "Appearance & Media", icon: Palette, description: "Theme & uploads" },
    { key: "settings", label: "Site Settings", icon: Settings, description: "Configuration" },
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="dashboard-loading-screen">
        <div className="dashboard-loading-card">
          <div className="dashboard-loading-spinner">
            <div className="spinner-ring" />
            <div className="spinner-ring delay-1" />
            <div className="spinner-ring delay-2" />
            <Zap width={28} className="spinner-icon" />
          </div>
          <p className="dashboard-loading-text">Initializing dashboard</p>
          <div className="dashboard-loading-bar">
            <div className="dashboard-loading-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${
          sidebarCollapsed ? "dashboard-sidebar-collapsed" : ""
        } ${
          mobileSidebarOpen
            ? "dashboard-sidebar-mobile-open"
            : "dashboard-sidebar-mobile-closed"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="dashboard-sidebar-header">
          {siteSettings?.logo ? (
            <img
              src={siteSettings.logo}
              alt="Logo"
              className={`dashboard-logo-img ${
                sidebarCollapsed ? "dashboard-logo-img-collapsed" : ""
              }`}
            />
          ) : (
            <div className="dashboard-logo-placeholder">
              <Zap width={22} />
              <div className="dashboard-logo-glow" />
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="dashboard-sidebar-title-group">
              <span className="dashboard-sidebar-title">Admin Panel</span>
              <span className="dashboard-sidebar-subtitle">Management</span>
            </div>
          )}
        </div>

        {/* Sidebar Label */}
        {!sidebarCollapsed && (
          <div className="dashboard-sidebar-label">
            <span>Navigation</span>
            <div className="dashboard-sidebar-label-line" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="dashboard-sidebar-nav">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActivePage(item.key);
                  setMobileSidebarOpen(false);
                }}
                className={`dashboard-nav-item ${
                  activePage === item.key ? "dashboard-nav-item-active" : ""
                } ${sidebarCollapsed ? "dashboard-nav-item-collapsed" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {activePage === item.key && (
                  <div className="dashboard-nav-item-indicator" />
                )}
                <div
                  className={`dashboard-nav-item-icon-wrap ${
                    activePage === item.key
                      ? "dashboard-nav-item-icon-wrap-active"
                      : ""
                  }`}
                >
                  <IconComponent width={20} />
                </div>
                {!sidebarCollapsed && (
                  <div className="dashboard-nav-item-text">
                    <span className="dashboard-nav-item-label">
                      {item.label}
                    </span>
                    <span className="dashboard-nav-item-description">
                      {item.description}
                    </span>
                  </div>
                )}
                {!sidebarCollapsed && activePage === item.key && (
                  <ChevronRight
                    width={16}
                    className="dashboard-nav-item-arrow"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Stats */}
        {!sidebarCollapsed && (
          <div className="dashboard-sidebar-stats">
            <div className="dashboard-sidebar-stat-card">
              <div className="dashboard-sidebar-stat-icon">
                <Activity width={16} />
              </div>
              <div>
                <span className="dashboard-sidebar-stat-value">Live</span>
                <span className="dashboard-sidebar-stat-label">System Status</span>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="dashboard-sidebar-footer">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="dashboard-collapse-btn"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div
              className={`dashboard-collapse-btn-icon ${
                sidebarCollapsed ? "rotated" : ""
              }`}
            >
              <ChevronsLeft width={18} />
            </div>
            {!sidebarCollapsed && (
              <span>Collapse</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="dashboard-mobile-menu-btn"
            >
              <div className="dashboard-mobile-menu-icon">
                <span />
                <span />
                <span />
              </div>
            </button>
            <div className="dashboard-header-title-group">
              <div className="dashboard-header-breadcrumb">
                <span className="dashboard-breadcrumb-root">Dashboard</span>
                <ChevronRight width={14} className="dashboard-breadcrumb-sep" />
                <span className="dashboard-breadcrumb-current">
                  {menuItems.find((item) => item.key === activePage)?.label}
                </span>
              </div>
              <h1 className="dashboard-header-title">
                {menuItems.find((item) => item.key === activePage)?.label}
              </h1>
            </div>
          </div>

          <div className="dashboard-header-right">
            {/* Time Display */}
            <div className="dashboard-header-time" title={formatDate(currentTime)}>
              <Clock width={14} />
              <span>{formatTime(currentTime)}</span>
            </div>

            {/* Notification Bell */}
            <button className="dashboard-header-notification">
              <Bell width={20} />
              <span className="dashboard-notification-dot" />
            </button>

            {/* Divider */}
            <div className="dashboard-header-divider" />

            {/* User Avatar */}
            <div className="dashboard-header-user">
              <div className="dashboard-avatar">
                <span>A</span>
                <div className="dashboard-avatar-status" />
              </div>
              <div className="dashboard-user-info">
                <span className="dashboard-user-name">Admin</span>
                <span className="dashboard-user-role">Super Admin</span>
              </div>
              <ChevronDown
                width={14}
                className="dashboard-user-chevron"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          {activePage === "products" && <ProductsPage />}
          {activePage === "categories" && <CategoriesPage />}
          {activePage === "users" && <UsersPage />}
          {activePage === "invite-tokens" && <InviteTokensPage />} {/* ✅ ADDED */}
          {activePage === "track-order" && <TrackOrderPage />} 
          {activePage === "all-orders" && <AllOrders />} 
          {activePage === "messages" && <MessagesPage />} 
          {activePage === "appearance" && (
            <div className="dashboard-placeholder-page">
              <h2>Appearance & Media</h2>
              <p>Theme and media upload settings will go here.</p>
              {/* Replace this div with <AppearancePage /> when ready */}
            </div>
          )}
          {activePage === "settings" && (
            <SiteSettingsPage initialSettings={siteSettings} />
          )}
        </div>

        {/* Subtle Bottom Bar */}
        <footer className="dashboard-footer">
          <span>Admin Panel v1.0</span>
          <span className="dashboard-footer-dot" />
          <span>Secure Connection</span>
          <Shield width={14} className="dashboard-footer-icon" />
        </footer>
      </main>
    </div>
  );
}