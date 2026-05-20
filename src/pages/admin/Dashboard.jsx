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
  KeyRound,
  UserCog,
  // Dashboard Home & Activity Icons
  ShoppingBag,
  DollarSign,
  Package,
  PlusCircle,
  List,
  Tag,
  ArrowRight,
  ShoppingCart,
  AlertTriangle,
  UserPlus,
  CreditCard
} from "lucide-react";

import ProductsPage from "./ProductsPage";
import CategoriesPage from "./CategoriesPage";
import SiteSettingsPage from "./SiteSettingsPage";
import UsersPage from "./UsersPage";
import TrackOrderPage from "./TrackOrder"; 
import AllOrders from "./AllOrders"; 
import MessagesPage from "./MessagesPage"; 
import InviteTokensPage from "./InviteTokensPage"; 
import ManageSalesReps from "./ManageSalesReps"; 

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext"; 
import "./Dashboard.css";

export default function AdminDashboard() {
  const { user, hasPermission } = useAuth(); 
  
  const [activePage, setActivePage] = useState("dashboard"); 
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ✅ Real-time Data States
  const [dashboardStats, setDashboardStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ─── Initial Data Fetch ───
  useEffect(() => {
    fetchSiteSettings();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Fetch Dashboard Specific Data ───
  useEffect(() => {
    if (activePage === "dashboard") {
      fetchDashboardStats();
      fetchActivities();
    }
  }, [activePage]);

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

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/dashboard/stats");
      const d = res.data;
      
      const formatCurrencyShort = (amount) => {
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(1)}K`;
        return `₦${amount.toLocaleString()}`;
      };

      setDashboardStats([
        { icon: ShoppingBag, label: "Total Orders", value: d.totalOrders.toLocaleString(), bg: "linear-gradient(135deg, #fff5eb 0%, #ffe8d1 100%)", color: "#e8590c" },
        { icon: DollarSign, label: "Revenue", value: formatCurrencyShort(d.revenue), bg: "linear-gradient(135deg, #e6fcf5 0%, #c3fae8 100%)", color: "#099268" },
        { icon: Package, label: "Products", value: d.totalProducts.toLocaleString(), bg: "linear-gradient(135deg, #e8f4fd 0%, #d0ebff 100%)", color: "#1971c2" },
        { icon: Users, label: "Customers", value: d.totalCustomers.toLocaleString(), bg: "linear-gradient(135deg, #f3f0ff 0%, #e5dbff 100%)", color: "#6741d9" }
      ]);
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivityLoading(true);
      const res = await api.get("/activities");
      setActivities(res.data);
    } catch (error) {
      console.error("Failed to load activities", error);
    } finally {
      setActivityLoading(false);
    }
  };

  // ─── Menu & Permissions ───
  const allMenuItems = [
    { key: "dashboard", label: "Dashboard", icon: Activity, description: "Overview & Stats", requiredPermission: "dashboard" },
    { key: "products", label: "Products", icon: Box, description: "Manage inventory", requiredPermission: "manage_products" },
    { key: "categories", label: "Categories", icon: Tags, description: "Organize catalog", requiredPermission: "manage_categories" },
    { key: "users", label: "Users", icon: Users, description: "Manage accounts", requiredPermission: "manage_users" },
    { key: "sales-reps", label: "Sales Reps", icon: UserCog, description: "Manage sales team", requiredPermission: "manage_sales_reps" }, 
    { key: "invite-tokens", label: "Invite Tokens", icon: KeyRound, description: "Engineer registrations", requiredPermission: "manage_engineers" },
    { key: "track-order", label: "Track Order", icon: ChevronRight, description: "Track & update", requiredPermission: "manage_orders" }, 
    { key: "all-orders", label: "All Orders", icon: ClipboardList, description: "View orders", requiredPermission: "manage_orders" }, 
    { key: "messages", label: "Messages", icon: MessageSquare, description: "Support inbox", requiredPermission: "manage_banners" }, 
    { key: "appearance", label: "Appearance", icon: Palette, description: "Theme & uploads", requiredPermission: "manage_settings" },
    { key: "settings", label: "Settings", icon: Settings, description: "Configuration", requiredPermission: "manage_settings" },
  ];

  const menuItems = allMenuItems.filter(item => hasPermission(item.requiredPermission));

  useEffect(() => {
    if (menuItems.length > 0 && !menuItems.find(item => item.key === activePage)) {
      setActivePage(menuItems[0].key);
    }
  }, [menuItems, activePage]);

  // ─── Helpers ───
  const formatTime = (date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date) => date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const getActivityStyle = (type) => {
    switch (type) {
      case "order": return { Icon: ShoppingBag, color: "#f68b1e" };
      case "payment": return { Icon: CreditCard, color: "#099268" };
      case "user": return { Icon: UserPlus, color: "#0984e3" };
      case "stock": return { Icon: AlertTriangle, color: "#e8590c" };
      case "cart": return { Icon: ShoppingCart, color: "#6c5ce7" };
      case "cart_abandoned": return { Icon: AlertTriangle, color: "#e8590c" };
      default: return { Icon: Activity, color: "#868e96" };
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const quickActions = [
    { icon: PlusCircle, label: "Add Product", page: "products", bg: "linear-gradient(135deg, #f68b1e 0%, #e8590c 100%)" },
    { icon: List, label: "View Orders", page: "all-orders", bg: "linear-gradient(135deg, #0984e3 0%, #1971c2 100%)" },
    { icon: Tag, label: "Categories", page: "categories", bg: "linear-gradient(135deg, #6c5ce7 0%, #6741d9 100%)" },
    { icon: MessageSquare, label: "Messages", page: "messages", bg: "linear-gradient(135deg, #00b894 0%, #099268 100%)" }
  ];

  // ─── Loading Screen ───
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

  // ─── Main Render ───
  return (
    <div className="dashboard-root">
      {mobileSidebarOpen && <div className="dashboard-overlay" onClick={() => setMobileSidebarOpen(false)} />}

      {/* ═══════ SIDEBAR ═══════ */}
      <aside className={`dashboard-sidebar ${sidebarCollapsed ? "dashboard-sidebar-collapsed" : ""} ${mobileSidebarOpen ? "dashboard-sidebar-mobile-open" : "dashboard-sidebar-mobile-closed"}`}>
        <div className="dashboard-sidebar-header">
          {siteSettings?.logo ? (
            <img src={siteSettings.logo} alt="Logo" className={`dashboard-logo-img ${sidebarCollapsed ? "dashboard-logo-img-collapsed" : ""}`} />
          ) : (
            <div className="dashboard-logo-placeholder"><Zap width={22} /><div className="dashboard-logo-glow" /></div>
          )}
          {!sidebarCollapsed && (
            <div className="dashboard-sidebar-title-group">
              <span className="dashboard-sidebar-title">Admin Panel</span>
              <span className="dashboard-sidebar-subtitle">{user?.role === 'admin' ? 'Administration' : 'Sales Rep'}</span>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="dashboard-sidebar-label">
            <span>Navigation</span>
            <div className="dashboard-sidebar-label-line" />
          </div>
        )}

        <nav className="dashboard-sidebar-nav">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { setActivePage(item.key); setMobileSidebarOpen(false); }}
                className={`dashboard-nav-item ${activePage === item.key ? "dashboard-nav-item-active" : ""} ${sidebarCollapsed ? "dashboard-nav-item-collapsed" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {activePage === item.key && <div className="dashboard-nav-item-indicator" />}
                <div className={`dashboard-nav-item-icon-wrap ${activePage === item.key ? "dashboard-nav-item-icon-wrap-active" : ""}`}>
                  <IconComponent width={20} />
                </div>
                {!sidebarCollapsed && (
                  <div className="dashboard-nav-item-text">
                    <span className="dashboard-nav-item-label">{item.label}</span>
                    <span className="dashboard-nav-item-description">{item.description}</span>
                  </div>
                )}
                {!sidebarCollapsed && activePage === item.key && <ChevronRight width={16} className="dashboard-nav-item-arrow" />}
              </button>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="dashboard-sidebar-stats">
            <div className="dashboard-sidebar-stat-card">
              <div className="dashboard-sidebar-stat-icon"><Activity width={16} /></div>
              <div>
                <span className="dashboard-sidebar-stat-value">Live</span>
                <span className="dashboard-sidebar-stat-label">System Status</span>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-sidebar-footer">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="dashboard-collapse-btn" title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <div className={`dashboard-collapse-btn-icon ${sidebarCollapsed ? "rotated" : ""}`}><ChevronsLeft width={18} /></div>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="dashboard-main">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button onClick={() => setMobileSidebarOpen(true)} className="dashboard-mobile-menu-btn">
              <div className="dashboard-mobile-menu-icon"><span /><span /><span /></div>
            </button>
            <div className="dashboard-header-title-group">
              <div className="dashboard-header-breadcrumb">
                <span className="dashboard-breadcrumb-root">Dashboard</span>
                <ChevronRight width={14} className="dashboard-breadcrumb-sep" />
                <span className="dashboard-breadcrumb-current">{menuItems.find((item) => item.key === activePage)?.label}</span>
              </div>
              <h1 className="dashboard-header-title">{menuItems.find((item) => item.key === activePage)?.label}</h1>
            </div>
          </div>

          <div className="dashboard-header-right">
            <div className="dashboard-header-time" title={formatDate(currentTime)}>
              <Clock width={14} /><span>{formatTime(currentTime)}</span>
            </div>
            <button className="dashboard-header-notification">
              <Bell width={20} /><span className="dashboard-notification-dot" />
            </button>
            <div className="dashboard-header-divider" />
            <div className="dashboard-header-user">
              <div className="dashboard-avatar">
                <span>{user?.name?.charAt(0) || 'A'}</span>
                <div className="dashboard-avatar-status" />
              </div>
              <div className="dashboard-user-info">
                <span className="dashboard-user-name">{user?.name || 'Admin'}</span>
                <span className="dashboard-user-role" style={{textTransform: 'capitalize'}}>{user?.role?.replace('_', ' ') || 'Admin'}</span>
              </div>
              <ChevronDown width={14} className="dashboard-user-chevron" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          
          {/* ═══════ DASHBOARD HOME ═══════ */}
          {activePage === "dashboard" && (
            <div className="jm-dash-home">
              {/* Welcome Header */}
              <div className="jm-dash-welcome">
                <div className="jm-dash-welcome__text">
                  <h2>Welcome back, {user?.name || 'Admin'} 👋</h2>
                  <p>Here's what's happening with your store today.</p>
                </div>
                <button onClick={() => setActivePage("settings")} className="jm-dash-welcome__btn">
                  <Settings width={16} /> Store Settings
                </button>
              </div>

              {/* Stats Grid */}
              <div className="jm-dash-stats">
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="jm-stat-card" style={{ opacity: 0.6, background: "#f8f9fa" }}>
                      <div className="jm-stat-card__header">
                        <div className="jm-stat-card__icon" style={{ background: "#e9ecef", color: "#adb5bd" }}><Activity width={22} /></div>
                      </div>
                      <div className="jm-stat-card__body">
                        <h3 className="jm-stat-card__value">--</h3>
                        <p className="jm-stat-card__label">Loading...</p>
                      </div>
                    </div>
                  ))
                ) : (
                  dashboardStats.map((stat, idx) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={idx} className="jm-stat-card" style={{ background: stat.bg }}>
                        <div className="jm-stat-card__header">
                          <div className="jm-stat-card__icon" style={{ color: stat.color }}>
                            <IconComponent width={22} />
                          </div>
                        </div>
                        <div className="jm-stat-card__body">
                          <h3 className="jm-stat-card__value">{stat.value}</h3>
                          <p className="jm-stat-card__label">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Actions */}
              <div className="jm-dash-section">
                <div className="jm-dash-section__head">
                  <h3>Quick Actions</h3>
                </div>
                <div className="jm-dash-actions">
                  {quickActions.map((action, idx) => {
                    const IconComponent = action.icon;
                    return (
                      <button key={idx} onClick={() => setActivePage(action.page)} className="jm-action-tile" style={{ background: action.bg }}>
                        <div className="jm-action-tile__bg-icon"><IconComponent width={48} /></div>
                        <div className="jm-action-tile__content">
                          <IconComponent width={24} />
                          <div>
                            <span className="jm-action-tile__label">{action.label}</span>
                          </div>
                        </div>
                        <ArrowRight width={18} className="jm-action-tile__arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real Activity Feed */}
              <div className="jm-dash-section">
                <div className="jm-dash-section__head">
                  <h3>Recent Activity</h3>
                  <button onClick={() => setActivePage("all-orders")} className="jm-dash-view-all">View All <ArrowRight width={14} /></button>
                </div>
                
                <div className="jm-dash-activity">
                  {activityLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="jm-activity-item" style={{ opacity: 0.5 }}>
                        <div className="jm-activity-item__icon" style={{ background: "#f8f9fa", color: "#adb5bd" }}><Activity width={18} /></div>
                        <div className="jm-activity-item__text">
                          <p>Loading activity...</p>
                          <span>&nbsp;</span>
                        </div>
                      </div>
                    ))
                  ) : activities.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#868e96" }}>
                      No recent activity found.
                    </div>
                  ) : (
                    activities.map((item, idx) => {
                      const { Icon, color } = getActivityStyle(item.type);
                      return (
                        <div key={idx} className="jm-activity-item">
                          <div className="jm-activity-item__icon" style={{ color: color, background: `${color}10` }}>
                            <Icon width={18} />
                          </div>
                          <div className="jm-activity-item__text">
                            <p>{item.message}</p>
                            <span>{timeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ OTHER PAGES ═══════ */}
          {activePage === "products" && <ProductsPage />}
          {activePage === "categories" && <CategoriesPage />}
          {activePage === "users" && <UsersPage />}
          {activePage === "sales-reps" && <ManageSalesReps />} 
          {activePage === "invite-tokens" && <InviteTokensPage />}
          {activePage === "track-order" && <TrackOrderPage />} 
          {activePage === "all-orders" && <AllOrders />} 
          {activePage === "messages" && <MessagesPage />} 
          {activePage === "appearance" && (
            <div className="dashboard-placeholder-page">
              <h2>Appearance & Media</h2>
              <p>Theme and media upload settings will go here.</p>
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