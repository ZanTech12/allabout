// UsersPage.jsx
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState(null); 
  const [deleting, setDeleting] = useState(false);
  
  // Edit states
  const [editModal, setEditModal] = useState(null); 
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "user", password: "" });
  const [saving, setSaving] = useState(false);

  // ✅ NEW: Cart Modal states
  const [cartModal, setCartModal] = useState(null); 
  const [loadingCart, setLoadingCart] = useState(false);

  // ✅ NEW: Track the timestamp when cart modal was opened (to detect "just added" items)
  const [cartOpenedAt, setCartOpenedAt] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users${search ? `?search=${search}` : ""}`);
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteModal._id}`);
      setUsers(users.filter((u) => u._id !== deleteModal._id));
      setDeleteModal(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user) => {
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "", role: user.role, password: "" });
    setEditModal(user);
  };

  const handleEditSubmit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      if (!payload.phone) delete payload.phone;

      const res = await api.put(`/users/${editModal._id}`, payload);
      setUsers(users.map(u => u._id === editModal._id ? res.data.user : u));
      setEditModal(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: Fetch User Cart
  const openCartModal = async (user) => {
    const now = new Date();
    setCartOpenedAt(now);
    setCartModal({ user, items: null }); // Set user, but items as null to show loading
    setLoadingCart(true);
    try {
      const res = await api.get(`/users/${user._id}/cart`);
      setCartModal({ user, items: res.data.cart?.items || [] });
    } catch (error) {
      alert("Failed to load cart.");
      setCartModal(null);
    } finally {
      setLoadingCart(false);
    }
  };

  // ✅ NEW: Determine if an item is "newly added" (within last 10 minutes of opening the cart)
  const isNewItem = (addedAt) => {
    if (!addedAt || !cartOpenedAt) return false;
    const addedDate = new Date(addedAt);
    const diffMs = cartOpenedAt - addedDate;
    const diffMins = diffMs / (1000 * 60);
    // Consider item "new" if added within the last 10 minutes
    return diffMs >= 0 && diffMins <= 10;
  };

  // ✅ NEW: Sort cart items — new items first, then by most recent
  const getSortedCartItems = (items) => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      const aNew = isNewItem(a.addedAt) ? 0 : 1;
      const bNew = isNewItem(b.addedAt) ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew; // New items first
      // Then sort by most recent
      return new Date(b.addedAt) - new Date(a.addedAt);
    });
  };

  // ✅ NEW: Helper to show "Just now", "5 mins ago", etc.
  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#fff" }}>Registered Users</h2>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>Manage user accounts and access</p>
        </div>
        
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
          <div style={{ position: "relative" }}>
            <Icon icon="lucide:search" width={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px 10px 36px", color: "#fff", fontSize: "0.9rem", width: "280px", outline: "none" }}
            />
          </div>
          <button type="submit" style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "0 16px", cursor: "pointer", fontWeight: 600 }}>Search</button>
        </form>
      </div>

      {/* Table Container */}
      <div style={{ background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No users found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", background: "#0f172a" }}>
                  <th style={thStyle}>USER</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>JOINED</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} style={{ borderBottom: "1px solid #1e293b", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#334155"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: user.role === "admin" ? "#f59e0b" : "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0 }}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>{user.name}</div>
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{user.email}</div>
                          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: user.role === "admin" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)", color: user.role === "admin" ? "#fbbf24" : "#60a5fa" }}>
                        {user.role?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "0.9rem" }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                        {/* ✅ NEW: View Cart Button */}
                        <button
                          onClick={() => openCartModal(user)}
                          style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600 }}
                        >
                          <Icon icon="lucide:shopping-cart" width={14} /> Cart
                        </button>
                        <button onClick={() => openEditModal(user)} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <Icon icon="lucide:edit-3" width={14} /> Edit
                        </button>
                        <button onClick={() => setDeleteModal(user)} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600 }}>
                          <Icon icon="lucide:trash-2" width={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ NEW: User Cart Modal */}
      {cartModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setCartModal(null)}>
          <div style={{ background: "#1e293b", borderRadius: "16px", padding: "32px", maxWidth: "550px", width: "90%", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h3 style={{ margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon="lucide:shopping-cart" width={20} color="#34d399" />
                  {cartModal.user.name}'s Cart
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>{cartModal.user.email}</p>
              </div>
              <button onClick={() => setCartModal(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}>
                <Icon icon="lucide:x" width={20} />
              </button>
            </div>

            {loadingCart ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>Loading cart...</div>
            ) : !cartModal.items || cartModal.items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", background: "#0f172a", borderRadius: "8px" }}>
                <Icon icon="lucide:package-open" width={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* ✅ NEW: Show banner if there are new items */}
                {getSortedCartItems(cartModal.items).some(item => isNewItem(item.addedAt)) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "8px", marginBottom: "4px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
                    <span style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 600 }}>
                      New item{getSortedCartItems(cartModal.items).filter(item => isNewItem(item.addedAt)).length > 1 ? "s" : ""} added to cart
                    </span>
                  </div>
                )}
                {getSortedCartItems(cartModal.items).map((item, index) => {
                  const isNew = isNewItem(item.addedAt);
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        display: "flex", 
                        gap: "12px", 
                        background: isNew ? "rgba(16, 185, 129, 0.04)" : "#0f172a", 
                        padding: "12px", 
                        borderRadius: "8px", 
                        border: isNew ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #334155",
                        position: "relative",
                        transition: "all 0.3s ease"
                      }}
                    >
                      {/* ✅ NEW: "NEW" badge indicator */}
                      {isNew && (
                        <div style={{
                          position: "absolute",
                          top: "-1px",
                          right: "-1px",
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "#fff",
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          padding: "2px 8px 2px 6px",
                          borderRadius: "0 8px 0 8px",
                          letterSpacing: "0.08em",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                        }}>
                          <Icon icon="lucide:sparkles" width={9} />
                          NEW
                        </div>
                      )}
                      {/* ✅ FIX: Use populated image first, fallback to cart's stored image */}
                      <img 
                        src={item.product?.images?.[0]?.url || item.image || 'https://via.placeholder.com/60'} 
                        alt={item.product?.name || item.name || "Product"} 
                        style={{ width: "60px", height: "60px", borderRadius: "6px", objectFit: "cover", background: "#334155" }}
                      />
                      <div style={{ flex: 1 }}>
                        {/* ✅ FIX: Use populated name first, fallback to cart's stored name */}
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {item.product?.name || item.name || "Deleted Product"}
                          {isNew && (
                            <span style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "3px",
                              fontSize: "0.7rem", 
                              fontWeight: 700, 
                              color: "#34d399",
                              background: "rgba(16, 185, 129, 0.12)",
                              padding: "1px 6px",
                              borderRadius: "4px"
                            }}>
                              <Icon icon="lucide:plus-circle" width={10} />
                              Just added
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                            Qty: {item.quantity} × ₦{item.price?.toLocaleString()}
                          </span>
                          <span style={{ color: isNew ? "#34d399" : "#34d399", fontWeight: 700, fontSize: "0.95rem" }}>
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: isNew ? "#34d399" : "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icon icon="lucide:clock" width={12} />
                          Added {timeAgo(item.addedAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* ✅ NEW: Cart Total Sum */}
                <div style={{ marginTop: "12px", paddingTop: "16px", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "1rem" }}>Total</span>
                  <span style={{ color: "#34d399", fontWeight: 700, fontSize: "1.2rem" }}>
                    ₦{cartModal.items.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => !saving && setEditModal(null)}>
          <div style={{ background: "#1e293b", borderRadius: "16px", padding: "32px", maxWidth: "450px", width: "90%", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon icon="lucide:user-cog" width={24} color="#3b82f6" />
            </div>
            <h3 style={{ margin: "0 0 24px", color: "#fff", textAlign: "center" }}>Edit User</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 500 }}>Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} disabled={saving} />
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 500 }}>Email Address</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} disabled={saving} />
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 500 }}>Phone Number</label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} disabled={saving} />
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 500 }}>Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={inputStyle} disabled={saving}>
                  <option value="user" style={{ background: "#0f172a" }}>User</option>
                  <option value="admin" style={{ background: "#0f172a" }}>Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: "6px", fontWeight: 500 }}>New Password <span style={{ color: "#64748b", fontWeight: 400 }}>(Leave blank to keep current)</span></label>
                <input type="password" placeholder="••••••••" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} style={inputStyle} disabled={saving} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => setEditModal(null)} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleEditSubmit} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: saving ? "#94a3b8" : "#3b82f6", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {saving ? <Icon icon="lucide:loader-2" width={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon icon="lucide:check" width={16} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => !deleting && setDeleteModal(null)}>
          <div style={{ background: "#1e293b", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "90%", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon icon="lucide:alert-triangle" width={24} color="#ef4444" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#fff", textAlign: "center" }}>Delete User?</h3>
            <p style={{ margin: "0 0 24px", color: "#94a3b8", textAlign: "center", fontSize: "0.9rem" }}>
              Are you sure you want to delete <strong style={{ color: "#fff" }}>{deleteModal.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setDeleteModal(null)} disabled={deleting} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: deleting ? "#94a3b8" : "#ef4444", color: "#fff", cursor: deleting ? "not-allowed" : "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {deleting ? <Icon icon="lucide:loader-2" width={16} className="spinner" /> : <Icon icon="lucide:trash-2" width={16} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Keyframe animation for pulse dot & spinner */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const thStyle = { padding: "14px 20px", textAlign: "left", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle = { padding: "16px 20px", borderBottom: "1px solid #334155" };
const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };