import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import Modal from "./Modal";
import DeleteConfirm from "./DeleteConfirm";
import Toast from "./Toast";
import "./ProductsPage.css"; // ✅ Reusing the same CSS!

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

const EMPTY_FORM = {
  expiresAt: "",
};

export default function InviteTokensPage() {
  const isMobile = useIsMobile();

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, token: "" });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api.get("/invites");
      setTokens(res.data);
    } catch (error) {
      showMessage("error", "Failed to load invite tokens");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  /* ── Token Status Helpers ── */
  const getTokenStatus = (t) => {
    if (t.usedBy) return "Used";
    if (!t.isActive || new Date(t.expiresAt) < new Date()) return "Expired";
    return "Active";
  };

  const getStatusBadgeClass = (status) => {
    if (status === "Active") return "prod-badge--stock-ok"; // Green
    if (status === "Used") return "prod-badge--stock-low"; // Yellow/Orange
    return "prod-badge--stock-out"; // Red
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ── Form Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/invites", { expiresAt: form.expiresAt });
      showMessage("success", "Invite token generated successfully");
      resetForm();
      fetchTokens();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to generate token"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete Token ── */
  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/invites/${deleteConfirm.id}`);
      showMessage("success", "Token revoked successfully");
      setDeleteConfirm({ id: null, token: "" });
      fetchTokens();
    } catch (error) {
      showMessage("error", "Failed to revoke token");
    } finally {
      setSaving(false);
    }
  };

  /* ── Copy Token to Clipboard ── */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => showMessage("success", "Token copied to clipboard!"),
      () => showMessage("error", "Failed to copy token")
    );
  };

  /* ── Filtered Tokens ── */
  const filteredTokens = tokens.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      t.token?.toLowerCase().includes(q) ||
      getTokenStatus(t).toLowerCase().includes(q) ||
      (t.usedBy?.email && t.usedBy.email.toLowerCase().includes(q));
    return matchesSearch;
  });

  const activeTokens = tokens.filter((t) => getTokenStatus(t) === "Active").length;

  if (loading) {
    return (
      <div className="prod-loading">
        <Icon icon="lucide:loader-2" width={32} className="prod-loading__icon" />
      </div>
    );
  }

  return (
    <div className="prod-page">
      <Toast message={message} />

      {/* ── Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 prod-header">
        <div className="prod-header__info">
          <h2 className="prod-header__title">Engineer Invite Tokens</h2>
          <p className="prod-header__count mb-0">
            <strong>{tokens.length}</strong> tokens total
            {!isMobile && (
              <span className="ms-3 text-muted" style={{ fontSize: "0.85rem" }}>
                <span className="me-2">🟢 {activeTokens} Active</span>
                <span>🔴 {tokens.length - activeTokens} Used/Expired</span>
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className={`prod-add-btn ${isMobile ? "w-100 justify-content-center" : ""}`}
        >
          <Icon icon="lucide:plus" width={18} /> Generate Token
        </button>
      </div>

      {/* ── Search ── */}
      <div className="prod-search">
        <Icon icon="lucide:search" width={18} className="prod-search__icon" />
        <input
          type="text"
          placeholder="Search by token code, status, or user email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="prod-search__input"
        />
        {searchTerm && (
          <button
            className="prod-search__clear"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
          >
            <Icon icon="lucide:x" width={16} />
          </button>
        )}
      </div>

      {/* ── Create Token Modal ── */}
      <Modal isOpen={showForm} onClose={resetForm} title="Generate New Invite Token">
        <form onSubmit={handleSubmit} className="prod-form">
          <div className="row g-3">
            <div className="col-12 mt-1">
              <div className="prod-form__section-title">Token Settings</div>
            </div>
            
            <div className="col-12">
              <label className="prod-form__label">Expiry Date & Time *</label>
              <input
                required
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="form-control prod-form__input"
                min={new Date().toISOString().slice(0, 16)} // Prevent past dates
              />
              <small className="text-muted mt-1 d-block" style={{ fontSize: "0.8rem" }}>
                The token will become invalid after this date. Time is based on your local timezone.
              </small>
            </div>

            <div className="col-12">
              <div className="d-flex align-items-center gap-2 p-3" style={{ background: "#f0fdf4", borderRadius: "10px", border: "1px dashed #bbf7d0" }}>
                <Icon icon="lucide:info" width={18} style={{ color: "#059669" }} />
                <span style={{ fontSize: "0.85rem", color: "#14532d" }}>
                  The actual invite code will be generated automatically upon creation.
                </span>
              </div>
            </div>
          </div>

          <div
            className={`d-flex ${isMobile ? "flex-column-reverse" : "justify-content-end"} gap-2 pt-4 mt-4 prod-form__actions`}
            style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}
          >
            <button
              type="button"
              onClick={resetForm}
              className={`prod-form__cancel ${isMobile ? "w-100" : ""}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`prod-form__submit ${saving ? "prod-form__submit--saving" : ""} ${isMobile ? "w-100 justify-content-center" : ""}`}
            >
              {saving && <Icon icon="lucide:loader-2" width={16} className="prod-form__spin me-1" />}
              Generate Token
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <DeleteConfirm
        isOpen={deleteConfirm.id !== null}
        onClose={() => setDeleteConfirm({ id: null, token: "" })}
        onConfirm={handleDelete}
        title="Revoke Invite Token"
        message={`Are you sure you want to revoke token "${deleteConfirm.token}"? This action cannot be undone.`}
        loading={saving}
      />

      {/* ── Mobile Card View ── */}
      <div className="d-flex flex-column gap-3 prod-mobile-list d-lg-none">
        {filteredTokens.map((t) => {
          const status = getTokenStatus(t);
          return (
            <div key={t._id} className="d-flex gap-3 p-3 prod-mobile-card">
              <div className="d-flex flex-column flex-grow-1 min-w-0 prod-mobile-card__body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h3 className="prod-mobile-card__name text-truncate mb-0" style={{ fontFamily: "monospace, serif", fontSize: "1.05rem", color: "#0f172a" }}>
                    {t.token}
                  </h3>
                  <span className={`prod-badge ${getStatusBadgeClass(status)}`}>
                    {status}
                  </span>
                </div>
                
                <p className="prod-mobile-card__category mb-1">
                  <Icon icon="lucide:clock" width={12} className="me-1" />
                  Expires: {formatDate(t.expiresAt)}
                </p>

                {t.usedBy && (
                  <p className="prod-mobile-card__category mb-2">
                    <Icon icon="lucide:user-check" width={12} className="me-1" />
                    Used by: {t.usedBy.name || t.usedBy.email}
                  </p>
                )}

                <div className="d-flex gap-2 mt-auto">
                  <button
                    onClick={() => copyToClipboard(t.token)}
                    className="btn prod-mobile-card__btn prod-mobile-card__btn--edit flex-grow-1"
                    disabled={status !== "Active"}
                  >
                    <Icon icon="lucide:copy" width={14} className="me-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: t._id, token: t.token })}
                    className="btn prod-mobile-card__btn prod-mobile-card__btn--delete flex-grow-1"
                  >
                    <Icon icon="lucide:trash-2" width={14} className="me-1" />
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTokens.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:key" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">No tokens found</p>
            <p className="prod-empty__desc">Try adjusting your search or generate a new token</p>
          </div>
        )}
      </div>

      {/* ── Desktop Table View ── */}
      <div className="prod-table-wrap d-none d-lg-block">
        <table className="prod-table">
          <thead className="prod-table__head">
            <tr>
              <th>Token Code</th>
              <th>Status</th>
              <th>Expires At</th>
              <th>Used By</th>
              <th>Created At</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map((t) => {
              const status = getTokenStatus(t);
              return (
                <tr key={t._id} className="prod-table__row">
                  <td className="prod-table__cell">
                    <span style={{ fontFamily: "monospace, serif", fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
                      {t.token}
                    </span>
                  </td>
                  <td className="prod-table__cell">
                    <span className={`prod-badge ${getStatusBadgeClass(status)}`}>
                      {status === "Active" && "🟢 "}
                      {status === "Used" && "🟡 "}
                      {status === "Expired" && "🔴 "}
                      {status}
                    </span>
                  </td>
                  <td className="prod-table__cell">
                    <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {formatDate(t.expiresAt)}
                    </span>
                  </td>
                  <td className="prod-table__cell">
                    {t.usedBy ? (
                      <span style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 500 }}>
                        {t.usedBy.email || t.usedBy.name || "Unknown"}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#ced4da" }}>—</span>
                    )}
                  </td>
                  <td className="prod-table__cell">
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      {formatDate(t.createdAt)}
                    </span>
                  </td>
                  <td className="prod-table__cell">
                    <div className="d-flex justify-content-end gap-1 prod-table__actions">
                      <button
                        onClick={() => copyToClipboard(t.token)}
                        className="prod-table__action-btn prod-table__action-btn--edit"
                        title="Copy Token"
                        disabled={status !== "Active"}
                        style={status !== "Active" ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                      >
                        <Icon icon="lucide:copy" width={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: t._id, token: t.token })}
                        className="prod-table__action-btn prod-table__action-btn--delete"
                        title="Revoke Token"
                      >
                        <Icon icon="lucide:trash-2" width={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTokens.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:key" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">No tokens found</p>
            <p className="prod-empty__desc">Try adjusting your search or generate a new token</p>
          </div>
        )}
      </div>
    </div>
  );
}