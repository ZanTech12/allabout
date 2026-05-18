// src/config/permissions.js

export const ADMIN_PERMISSIONS = [
  // Analytics
  { key: "dashboard", label: "Dashboard", group: "Analytics" },

  // User Management
  { key: "manage_users", label: "Manage Users", group: "User Management" },
  { key: "view_user_carts", label: "View User Carts", group: "User Management" },
  { key: "manage_engineers", label: "Manage Engineers & Invites", group: "User Management" },

  // Product Management
  { key: "manage_products", label: "Manage Products", group: "Product Management" },
  { key: "manage_categories", label: "Manage Categories", group: "Product Management" },
  { key: "manage_brands", label: "Manage Brands", group: "Product Management" },

  // Order Management
  { key: "manage_orders", label: "Manage Orders", group: "Order Management" },
  { key: "manage_refunds", label: "Manage Refunds", group: "Order Management" },

  // Marketing
  { key: "manage_coupons", label: "Manage Coupons", group: "Marketing" },
  { key: "manage_banners", label: "Manage Banners / Sliders", group: "Marketing" },

  // Content
  { key: "manage_contacts", label: "Manage Contact Messages", group: "Content" },
  { key: "manage_reviews", label: "Moderate Reviews", group: "Content" },

  // Settings
  { key: "manage_settings", label: "App Settings", group: "Settings" },
  { key: "manage_sales_reps", label: "Manage Sales Representatives", group: "Settings" },
];

// Permissions that can NEVER be given to a sales rep
export const ADMIN_ONLY_PERMISSIONS = ["manage_settings", "manage_sales_reps"];

// ✅ THIS IS THE MISSING EXPORT that the error is complaining about
export const groupPermissions = () => {
  const groups = {};
  ADMIN_PERMISSIONS.forEach((perm) => {
    if (!groups[perm.group]) groups[perm.group] = [];
    groups[perm.group].push(perm);
  });
  return groups;
};