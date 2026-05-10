// pages/admin/TrackOrder.jsx
import { useState } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";

const STATUS_FLOW = [
  { key: "pending", label: "Pending", icon: "lucide:clock", color: "#fbbf24" },
  { key: "confirmed", label: "Confirmed", icon: "lucide:check-circle", color: "#60a5fa" },
  { key: "processing", label: "Processing", icon: "lucide:package", color: "#a78bfa" },
  { key: "shipped", label: "Shipped", icon: "lucide:truck", color: "#38bdf8" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "lucide:map-pin", color: "#fb923c" },
  { key: "delivered", label: "Delivered", icon: "lucide:badge-check", color: "#34d399" },
];

const ALL_STATUSES = [
  ...STATUS_FLOW.map(s => s.key),
  "cancelled",
  "returned",
];

const TABS = [
  { key: "orderNumber", label: "Order Number", placeholder: "e.g. ORD-M1ABC-X9K2F", icon: "lucide:hash" },
  { key: "trackingNumber", label: "Tracking Number", placeholder: "e.g. TRK...", icon: "lucide:scan-line" },
  { key: "phone", label: "Phone Number", placeholder: "e.g. 08012345678", icon: "lucide:phone" },
  { key: "email", label: "Email Address", placeholder: "e.g. you@example.com", icon: "lucide:mail" },
];

// ✅ NEW: Defines the next logical step for Quick Actions
const getNextStatus = (currentStatus) => {
  const flow = {
    pending: { key: "confirmed", label: "Confirm Order", icon: "lucide:check-circle", color: "#3b82f6" },
    confirmed: { key: "processing", label: "Start Processing", icon: "lucide:package", color: "#8b5cf6" },
    processing: { key: "shipped", label: "Mark Shipped", icon: "lucide:truck", color: "#0ea5e9" },
    shipped: { key: "out_for_delivery", label: "Out for Delivery", icon: "lucide:map-pin", color: "#f97316" },
    out_for_delivery: { key: "delivered", label: "Mark Delivered", icon: "lucide:badge-check", color: "#10b981" },
  };
  return flow[currentStatus] || null;
};

export default function AdminTrackOrder() {
  const [activeTab, setActiveTab] = useState("orderNumber");
  const [inputs, setInputs] = useState({ orderNumber: "", trackingNumber: "", phone: "", email: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", trackingNumber: "", estimatedDelivery: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    const value = inputs[activeTab]?.trim();
    if (!value) {
      setError(`Please enter a ${TABS.find((t) => t.key === activeTab).label.toLowerCase()}.`);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);
    setEditMode(false);
    setSaveSuccess("");
    try {
      const params = { [activeTab]: value };
      const res = await api.get("/orders/track", { params });
      if (res.data.success) {
        setResult(res.data.order);
      } else {
        setError(res.data.message || "Order not found.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const openEditMode = () => {
    if (!result) return;
    setEditForm({
      status: result.status || "",
      trackingNumber: result.trackingNumber || "",
      estimatedDelivery: result.estimatedDelivery
        ? new Date(result.estimatedDelivery).toISOString().split("T")[0]
        : "",
      notes: result.notes || "",
    });
    setEditMode(true);
    setSaveSuccess("");
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setSaveSuccess("");
  };

  // ✅ NEW: Quick Action Handler (Auto-generates tracking number on backend if needed)
  const handleQuickAction = async (nextStatus) => {
    if (!result) return;
    setSaving(true);
    setError("");
    setSaveSuccess("");
    try {
      const payload = { status: nextStatus };
      const res = await api.patch(`/orders/${result._id}/status`, payload);
      if (res.data.success) {
        setResult(res.data.order);
        setSaveSuccess(`Order updated to ${nextStatus.replace(/_/g, ' ')}!`);
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to update.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!result) return;
    setSaving(true);
    setSaveSuccess("");
    try {
      const payload = {};
      if (editForm.status) payload.status = editForm.status;
      if (editForm.trackingNumber.trim()) payload.trackingNumber = editForm.trackingNumber.trim();
      if (editForm.estimatedDelivery) payload.estimatedDelivery = editForm.estimatedDelivery;
      if (editForm.notes.trim()) payload.notes = editForm.notes.trim();

      const res = await api.patch(`/orders/${result._id}/status`, payload);
      if (res.data.success) {
        setResult(res.data.order);
        setEditMode(false);
        setSaveSuccess("Order updated successfully!");
        setTimeout(() => setSaveSuccess(""), 4000);
      } else {
        setError(res.data.message || "Failed to update.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIndex = (status) => STATUS_FLOW.findIndex((s) => s.key === status);
  const isCancelled = result?.status === "cancelled";
  const isReturned = result?.status === "returned";
  const currentIdx = isCancelled || isReturned ? -1 : getStatusIndex(result?.status);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => "₦" + (amount || 0).toLocaleString();

  const getStatusColor = (status) => {
    if (status === "cancelled") return { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.25)" };
    if (status === "returned") return { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" };
    if (status === "delivered") return { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)" };
    const step = STATUS_FLOW.find(s => s.key === status);
    return step ? { bg: `${step.color}18`, text: step.color, border: `${step.color}40` } : { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", border: "rgba(148,163,184,0.25)" };
  };

  const sc = result ? getStatusColor(result.status) : {};

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon icon="lucide:radar" width={24} color="#34d399" />
          Track Customer Order
        </h2>
        <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
          Search any order by number, tracking ID, phone, or email. View and update status.
        </p>
      </div>

      {/* Search Card */}
      <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "24px", marginBottom: "24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "#0f172a", borderRadius: "10px", padding: "4px", marginBottom: "18px", flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, minWidth: "120px", padding: "9px 12px", borderRadius: "8px", border: "none",
                background: activeTab === tab.key ? "#334155" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              <Icon icon={tab.icon} width={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleTrack} style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Icon icon={TABS.find((t) => t.key === activeTab).icon} width={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type={activeTab === "email" ? "email" : "text"}
              placeholder={TABS.find((t) => t.key === activeTab).placeholder}
              value={inputs[activeTab]}
              onChange={(e) => handleInputChange(activeTab, e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px",
                padding: "12px 14px 12px 40px", color: "#fff", fontSize: "0.9rem", outline: "none",
              }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: "12px 24px", borderRadius: "10px", border: "none",
            background: loading ? "#475569" : "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap",
          }}>
            {loading ? (
              <><Icon icon="lucide:loader-2" width={16} style={{ animation: "spin 1s linear infinite" }} /> Searching...</>
            ) : (
              <><Icon icon="lucide:search" width={16} /> Track</>
            )}
          </button>
        </form>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "0.85rem", marginTop: "14px" }}>
            <Icon icon="lucide:alert-circle" width={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "0.85rem", marginTop: "14px" }}>
            <Icon icon="lucide:check-circle" width={16} style={{ flexShrink: 0 }} />
            {saveSuccess}
          </div>
        )}
      </div>

      {/* Not Found */}
      {searched && !loading && !result && !error && (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "#1e293b", borderRadius: "16px", border: "1px solid #334155" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#0f172a", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "#475569" }}>
            <Icon icon="lucide:package-x" width={28} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#e2e8f0", fontSize: "1.1rem" }}>No Order Found</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>Double-check the information and try again.</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Cancelled/Returned Banner */}
          {(isCancelled || isReturned) && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontSize: "0.88rem" }}>
              <Icon icon={isCancelled ? "lucide:x-circle" : "lucide:rotate-ccw"} width={20} />
              <span>This order was <strong>{isCancelled ? "cancelled" : "returned"}</strong>{result.cancelReason ? ` — "${result.cancelReason}"` : ""}</span>
            </div>
          )}

          {/* Order Header */}
          <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 4px" }}>Order <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{result.orderNumber}</span></p>
                <p style={{ fontSize: "0.8rem", color: "#475569", margin: "0" }}>Placed {formatDate(result.createdAt)}</p>
                {result.guestEmail && <p style={{ fontSize: "0.8rem", color: "#475569", margin: "4px 0 0" }}>Customer: <span style={{ color: "#94a3b8" }}>{result.guestEmail}</span></p>}
                {result.trackingNumber && (
                  <p style={{ fontSize: "0.85rem", color: "#38bdf8", margin: "6px 0 0", fontWeight: 700, background: "rgba(56,189,248,0.08)", padding: "4px 10px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon icon="lucide:scan-line" width={13} /> {result.trackingNumber}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                  <Icon icon={isCancelled ? "lucide:x-circle" : isReturned ? "lucide:rotate-ccw" : result.status === "delivered" ? "lucide:badge-check" : "lucide:clock"} width={14} />
                  {result.status === "out_for_delivery" ? "Out for Delivery" : result.status?.charAt(0).toUpperCase() + result.status?.slice(1)}
                </span>
                
                {/* ✅ NEW: Quick Action Button */}
                {!editMode && getNextStatus(result.status) && (
                  <button 
                    onClick={() => handleQuickAction(getNextStatus(result.status).key)} 
                    disabled={saving}
                    style={{ 
                      display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 16px", borderRadius: "8px", 
                      border: "none", background: getNextStatus(result.status).color, color: "#fff", 
                      fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", 
                      transition: "all 0.2s", opacity: saving ? 0.7 : 1, 
                      boxShadow: `0 2px 10px ${getNextStatus(result.status).color}44` 
                    }}
                  >
                    {saving ? <Icon icon="lucide:loader-2" width={14} style={{ animation: "spin 1s linear infinite" }} /> : <Icon icon={getNextStatus(result.status).icon} width={14} />}
                    {getNextStatus(result.status).label}
                  </button>
                )}

                {!editMode && (
                  <button onClick={openEditMode} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(148,163,184,0.25)", background: "rgba(148,163,184,0.08)", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                    <Icon icon="lucide:edit-3" width={14} /> Manual Update
                  </button>
                )}
              </div>
            </div>

            {/* Progress Stepper */}
            <div style={{ marginBottom: "4px" }}>
              <div style={{ height: "5px", background: "#0f172a", borderRadius: "5px", overflow: "hidden", marginBottom: "24px" }}>
                <div style={{ height: "100%", borderRadius: "5px", background: isCancelled || isReturned ? "linear-gradient(90deg, #fca5a5, #ef4444)" : "linear-gradient(90deg, #10b981, #059669)", width: `${result.progress || 0}%`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {STATUS_FLOW.map((step, idx) => {
                  let dotStyle = { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", border: "2px solid #1e293b", color: "#475569", transition: "all 0.3s", fontSize: "0.75rem" };
                  let labelColor = "#475569";
                  if (isCancelled || isReturned) {
                    if (idx === 0) { dotStyle = { ...dotStyle, background: "rgba(239,68,68,0.15)", borderColor: "#fca5a5", color: "#ef4444" }; labelColor = "#ef4444"; }
                  } else if (idx < currentIdx) {
                    dotStyle = { ...dotStyle, background: "linear-gradient(135deg, #10b981, #059669)", borderColor: "transparent", color: "#fff", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" };
                    labelColor = "#94a3b8";
                  } else if (idx === currentIdx) {
                    dotStyle = { ...dotStyle, borderColor: step.color, color: step.color, boxShadow: `0 0 0 3px ${step.color}25` };
                    labelColor = "#e2e8f0";
                  }
                  return (
                    <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={dotStyle}>
                        {(isCancelled || isReturned) ? (idx === 0 ? <Icon icon="lucide:x" width={14} /> : <Icon icon={step.icon} width={14} />) : idx < currentIdx ? <Icon icon="lucide:check" width={14} /> : <Icon icon={step.icon} width={14} />}
                      </div>
                      <span style={{ fontSize: "0.62rem", fontWeight: 600, color: labelColor, marginTop: "6px", textAlign: "center", lineHeight: "1.15" }}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.estimatedDelivery && result.status !== "delivered" && !isCancelled && !isReturned && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", color: "#38bdf8", fontSize: "0.82rem", fontWeight: 600, marginTop: "16px" }}>
                <Icon icon="lucide:calendar-clock" width={16} />
                Est. delivery: {formatDate(result.estimatedDelivery)}
                {result.estimatedDaysLeft != null && result.estimatedDaysLeft > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.7 }}>{result.estimatedDaysLeft}d left</span>
                )}
              </div>
            )}
            {result.status === "delivered" && result.deliveredAt && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)", color: "#34d399", fontSize: "0.82rem", fontWeight: 600, marginTop: "16px" }}>
                <Icon icon="lucide:badge-check" width={16} /> Delivered {formatDate(result.deliveredAt)}
              </div>
            )}
          </div>

          {/* Edit Form */}
          {editMode && (
            <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #3b82f6", padding: "24px", boxShadow: "0 0 0 1px rgba(59,130,246,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon="lucide:settings-2" width={18} color="#60a5fa" /> Manual Update
                </h3>
                <button onClick={cancelEditMode} style={{ background: "transparent", border: "1px solid #334155", borderRadius: "8px", padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
              </div>
              <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600 }}>Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={selectStyle} disabled={saving}>
                    <option value="">Select status</option>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s} style={{ background: "#0f172a" }}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600 }}>Tracking Number</label>
                  <input type="text" value={editForm.trackingNumber} onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })} placeholder="Leave blank to auto-generate" style={inputStyle} disabled={saving} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600 }}>Estimated Delivery</label>
                  <input type="date" value={editForm.estimatedDelivery} onChange={(e) => setEditForm({ ...editForm, estimatedDelivery: e.target.value })} style={inputStyle} disabled={saving} />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600 }}>Internal Notes</label>
                  <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Visible to admin only" style={inputStyle} disabled={saving} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button type="button" onClick={cancelEditMode} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#e2e8f0", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>Discard</button>
                  <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: saving ? "#475569" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    {saving ? <><Icon icon="lucide:loader-2" width={16} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><Icon icon="lucide:check" width={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", padding: "16px" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "5px" }}><Icon icon="lucide:map-pin" width={13} /> Shipping Address</p>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0", margin: "0" }}>{result.shippingAddress?.fullName || "—"}</p>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "3px 0 0" }}>{result.shippingAddress?.street || "—"}{result.shippingAddress?.city ? `, ${result.shippingAddress.city}` : ""}{result.shippingAddress?.state ? `, ${result.shippingAddress.state}` : ""}</p>
              {result.shippingAddress?.phone && <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0" }}>{result.shippingAddress.phone}</p>}
            </div>
            <div style={{ background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", padding: "16px" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "5px" }}><Icon icon="lucide:credit-card" width={13} /> Payment</p>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#e2e8f0", margin: "0", textTransform: "capitalize" }}>{result.paymentMethod || "—"}</p>
              {result.paystackReference && <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0" }}>Ref: {result.paystackReference}</p>}
              {result.notes && <p style={{ fontSize: "0.78rem", color: "#fbbf24", margin: "4px 0 0" }}>Note: {result.notes}</p>}
            </div>
          </div>

          {/* Items */}
          <div style={{ background: "#1e293b", borderRadius: "16px", border: "1px solid #334155", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon icon="lucide:package" width={17} color="#94a3b8" />
              <h3 style={{ margin: 0, color: "#e2e8f0", fontSize: "0.95rem", fontWeight: 700 }}>Order Items</h3>
              <span style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>{result.items?.length || 0}</span>
            </div>

            {result.items?.map((item, idx) => {
              const product = item.product;
              const imgSrc = product?.images?.[0]?.url || product?.image?.url || product?.image || item.image || item.imageSrc || "https://via.placeholder.com/56";
              const name = product?.name || item.name || item.productName || "Product";
              const unitPrice = product?.discountPrice || product?.price || item.price || item.unitPrice || 0;
              const lineTotal = unitPrice * (item.quantity || 1);

              return (
                <div key={idx} style={{ display: "flex", gap: "12px", padding: "14px 20px", borderBottom: idx < result.items.length - 1 ? "1px solid #0f172a" : "none" }}>
                  <img src={imgSrc} alt={name} style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", background: "#0f172a", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.88rem", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
                    <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>Qty: {item.quantity} × {formatCurrency(unitPrice)}</p>
                  </div>
                  <p style={{ color: "#34d399", fontWeight: 700, fontSize: "0.9rem", margin: 0, whiteSpace: "nowrap" }}>{formatCurrency(lineTotal)}</p>
                </div>
              );
            })}

            {/* Totals */}
            <div style={{ padding: "14px 20px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                <span>Subtotal</span><span>{formatCurrency(result.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                <span>Shipping</span><span>{result.shippingCost ? formatCurrency(result.shippingCost) : "Free"}</span>
              </div>
              {result.tax > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                  <span>Tax</span><span>{formatCurrency(result.tax)}</span>
                </div>
              )}
              {result.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#64748b" }}>
                  <span>Discount</span><span>-{formatCurrency(result.discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 800, color: "#e2e8f0", paddingTop: "8px", borderTop: "1px solid #1e293b", marginTop: "4px" }}>
                <span>Total</span><span style={{ color: "#34d399" }}>{formatCurrency(result.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Order ID (debug info) */}
          <div style={{ padding: "10px 16px", background: "#0f172a", borderRadius: "8px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", color: "#475569" }}>ID: <span style={{ color: "#64748b", fontFamily: "monospace" }}>{result._id}</span></span>
            <span style={{ fontSize: "0.72rem", color: "#475569" }}>User ID: <span style={{ color: "#64748b", fontFamily: "monospace" }}>{result.user || "N/A"}</span></span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px",
  padding: "10px 12px", color: "#fff", fontSize: "0.88rem", outline: "none", boxSizing: "border-box",
};
const selectStyle = {
  ...inputStyle, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
};