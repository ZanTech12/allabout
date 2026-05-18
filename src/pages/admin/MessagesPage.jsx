// src/pages/admin/MessagesPage.jsx
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import Modal from "./Modal";
import DeleteConfirm from "./DeleteConfirm";
import Toast from "./Toast";
// We reuse the same CSS to keep the admin dashboard perfectly consistent
import "./ProductsPage.css"; 

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
  bg: "linear-gradient(135deg, #f68b1e 0%, #e8590c 100%)",
  tag: "",
  title: "",
  sub: "",
  price: "",
  img: "",
  link: "/products",
  order: 0,
  isActive: true,
};

export default function MessagesPage() {
  const isMobile = useIsMobile();
  const fileInputRef = useRef(null); // Ref for gallery file input
  const cameraInputRef = useRef(null); // Ref for camera input

  /* ── Existing state ── */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // Upload state
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, name: "" });

  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/messages");
      setMessages(res.data.data || res.data);
    } catch (error) {
      showMessage("error", "Failed to load hero slides");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingMessage(null);
    setShowForm(false);
  };

  const parseBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "true" || val === "1";
    return false;
  };

  const handleEdit = (msg) => {
    setForm({
      bg: msg.bg || EMPTY_FORM.bg,
      tag: msg.tag || "",
      title: msg.title || "",
      sub: msg.sub || "",
      price: msg.price || "",
      img: msg.img || "",
      link: msg.link || "/products",
      order: msg.order?.toString() || "0",
      isActive: parseBool(msg.isActive),
    });
    setEditingMessage(msg);
    setShowForm(true);
  };

  /* ── Backend Image Upload Handler ── */
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrls = response.data.urls;

      if (Array.isArray(uploadedUrls) && uploadedUrls.length > 0) {
        // Messages schema uses a single image string, so we grab the first URL
        setForm((prev) => ({
          ...prev,
          img: uploadedUrls[0], 
        }));
        showMessage("success", "Image uploaded successfully");
      } else {
        throw new Error("No URLs returned from server");
      }
    } catch (error) {
      console.error(error);
      showMessage(
        "error",
        error.response?.data?.message || "Image upload failed. Please try again."
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        order: parseInt(form.order) || 0,
        isActive: Boolean(form.isActive),
      };

      if (editingMessage) {
        await api.put(`/messages/${editingMessage._id}`, payload);
        showMessage("success", "Slide updated successfully");
      } else {
        await api.post("/messages", payload);
        showMessage("success", "Slide created successfully");
      }
      resetForm();
      fetchData();
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/messages/${deleteConfirm.id}`);
      showMessage("success", "Slide deleted successfully");
      setDeleteConfirm({ id: null, name: "" });
      fetchData();
    } catch (error) {
      showMessage("error", "Failed to delete slide");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (msg) => {
    try {
      await api.patch(`/messages/${msg._id}/toggle`);
      fetchData();
    } catch (error) {
      showMessage("error", "Failed to update status");
    }
  };

  /* ── Filtered messages ── */
  const filteredMessages = messages.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      m.title?.toLowerCase().includes(q) ||
      m.tag?.toLowerCase().includes(q) ||
      m.sub?.toLowerCase().includes(q)
    );
  });

  const activeCount = messages.filter((m) => parseBool(m.isActive)).length;

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

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 prod-header">
        <div className="prod-header__info">
          <h2 className="prod-header__title">Hero Slides</h2>
          <p className="prod-header__count mb-0">
            <strong>{messages.length}</strong> slides total
            {!isMobile && (
              <span className="ms-3 text-muted" style={{ fontSize: "0.85rem" }}>
                <span className="me-2">✅ {activeCount} Active</span>
                <span>🚫 {messages.length - activeCount} Inactive</span>
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
          <Icon icon="lucide:plus" width={18} /> Add Slide
        </button>
      </div>

      <div className="prod-search">
        <Icon icon="lucide:search" width={18} className="prod-search__icon" />
        <input
          type="text"
          placeholder="Search slides by title, tag, or subtitle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="prod-search__input"
        />
        {searchTerm && (
          <button className="prod-search__clear" onClick={() => setSearchTerm("")} aria-label="Clear search">
            <Icon icon="lucide:x" width={16} />
          </button>
        )}
      </div>

      {/* ═══════════ FORM MODAL ═══════════ */}
      <Modal isOpen={showForm} onClose={resetForm} title={editingMessage ? "Edit Slide" : "Add New Slide"}>
        <form onSubmit={handleSubmit} className="prod-form">
          <div className="row g-3">
            <div className="col-12 mt-1">
              <div className="prod-form__section-title">Slide Content</div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Tag Label *</label>
              <input
                required
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. MEGA SALE"
                maxLength={30}
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. Up to 70% OFF"
                maxLength={100}
              />
            </div>
            <div className="col-12 col-sm-8">
              <label className="prod-form__label">Subtitle</label>
              <input
                value={form.sub}
                onChange={(e) => setForm({ ...form, sub: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. On all electronics & gadgets"
              />
            </div>
            <div className="col-12 col-sm-4">
              <label className="prod-form__label">Price Text</label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. From ₦5,000"
              />
            </div>

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">Appearance & Media</div>
            </div>
            <div className="col-12">
              <label className="prod-form__label">Background Gradient *</label>
              <input
                required
                value={form.bg}
                onChange={(e) => setForm({ ...form, bg: e.target.value })}
                className="form-control prod-form__input"
                placeholder="linear-gradient(135deg, #f68b1e 0%, #e8590c 100%)"
              />
              <div 
                className="mt-2 rounded border" 
                style={{ background: form.bg, height: '40px' }}
              />
            </div>
            
            {/* ── Image Link + Upload Section ── */}
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="prod-form__label mb-0">Image</label>
                <div className="d-flex gap-2">
                  {/* Hidden camera input */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="prod-form__add-img-btn"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Icon icon="lucide:loader-2" width={14} className="prod-form__spin" />
                    ) : (
                      <Icon icon="lucide:camera" width={14} />
                    )}
                    Camera
                  </button>

                  {/* Hidden gallery input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  {/* Gallery Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="prod-form__add-img-btn"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Icon icon="lucide:loader-2" width={14} className="prod-form__spin" />
                    ) : (
                      <Icon icon="lucide:image-plus" width={14} />
                    )}
                    Gallery
                  </button>
                </div>
              </div>

              {/* The Link / URL Input Field */}
              <input
                value={form.img}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
                className="form-control prod-form__input"
                placeholder="Paste image URL here or use Camera/Gallery buttons"
                disabled={uploadingImage}
              />

              {/* Image Preview */}
              {form.img && (
                <div className="prod-form__img-preview mt-2">
                  <img src={form.img} alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => setForm({ ...form, img: "" })} 
                    className="prod-form__img-remove"
                    disabled={uploadingImage}
                  >
                    <Icon icon="lucide:x" width={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">Settings</div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">CTA Link</label>
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="form-control prod-form__input"
                placeholder="/products"
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Display Order</label>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="form-control prod-form__input"
                placeholder="0"
              />
            </div>
            
            <div className="col-12 mt-2">
              <div className="row g-3 prod-form__flags">
                <div className={`col-12 ${isMobile ? "" : "col-sm-6"}`}>
                  <label className={`prod-flag-toggle w-100 ${form.isActive ? "prod-flag-toggle--active" : ""}`}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="d-none"
                    />
                    <div className="prod-flag-toggle__content">
                      <Icon icon={form.isActive ? "lucide:eye" : "lucide:eye-off"} width={16} className="prod-flag-toggle__icon" />
                      <div>
                        <span className="prod-flag-toggle__label">Active</span>
                        <span className="prod-flag-toggle__desc">Show on homepage</span>
                      </div>
                      <div className="prod-flag-toggle__check">
                        <Icon icon={form.isActive ? "lucide:check-circle" : "lucide:circle"} width={18} />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={`d-flex ${isMobile ? "flex-column-reverse" : "justify-content-end"} gap-2 pt-4 mt-4 prod-form__actions`} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            <button type="button" onClick={resetForm} className={`prod-form__cancel ${isMobile ? "w-100" : ""}`}>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving || uploadingImage} 
              className={`prod-form__submit ${saving ? "prod-form__submit--saving" : ""} ${isMobile ? "w-100 justify-content-center" : ""}`}
            >
              {saving && <Icon icon="lucide:loader-2" width={16} className="prod-form__spin me-1" />}
              {editingMessage ? "Update Slide" : "Create Slide"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={deleteConfirm.id !== null}
        onClose={() => setDeleteConfirm({ id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Slide"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        loading={saving}
      />

      {/* ═══════════ MOBILE CARD VIEW ═══════════ */}
      <div className="d-flex flex-column gap-3 prod-mobile-list d-lg-none">
        {filteredMessages.map((m) => (
          <div key={m._id} className="d-flex gap-3 p-3 prod-mobile-card">
            <div
              className="prod-mobile-card__img object-fit-cover"
              style={{
                background: m.bg,
                backgroundImage: m.img ? `url(${m.img})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                minWidth: "80px",
                height: "80px",
                borderRadius: "8px",
              }}
            />
            <div className="d-flex flex-column flex-grow-1 min-w-0 prod-mobile-card__body">
              <h3 className="prod-mobile-card__name text-truncate">{m.title}</h3>
              <p className="prod-mobile-card__category mb-1">
                {m.tag} {m.price ? `· ${m.price}` : ""}
              </p>
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                <span className={`prod-badge ${parseBool(m.isActive) ? "prod-badge--stock-ok" : "prod-badge--stock-out"}`}>
                  {parseBool(m.isActive) ? "Active" : "Inactive"}
                </span>
                <span className="prod-badge prod-badge--new">#{m.order || 0}</span>
              </div>
              <div className="d-flex gap-2 mt-auto">
                <button onClick={() => handleToggleActive(m)} className="btn prod-mobile-card__btn prod-mobile-card__btn--edit flex-grow-1">
                  <Icon icon={parseBool(m.isActive) ? "lucide:eye-off" : "lucide:eye"} width={14} className="me-1" />
                  {parseBool(m.isActive) ? "Hide" : "Show"}
                </button>
                <button onClick={() => handleEdit(m)} className="btn prod-mobile-card__btn prod-mobile-card__btn--edit flex-grow-1">
                  <Icon icon="lucide:pencil" width={14} className="me-1" />Edit
                </button>
                <button onClick={() => setDeleteConfirm({ id: m._id, name: m.title })} className="btn prod-mobile-card__btn prod-mobile-card__btn--delete flex-grow-1">
                  <Icon icon="lucide:trash-2" width={14} className="me-1" />Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:image-off" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">No slides found</p>
            <p className="prod-empty__desc">Try adjusting your search or add a new slide</p>
          </div>
        )}
      </div>

      {/* ═══════════ DESKTOP TABLE VIEW ═══════════ */}
      <div className="prod-table-wrap d-none d-lg-block">
        <table className="prod-table">
          <thead className="prod-table__head">
            <tr>
              <th>Slide</th>
              <th>Content</th>
              <th>Order</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((m) => (
              <tr key={m._id} className="prod-table__row">
                <td className="prod-table__cell">
                  <div className="d-flex align-items-center gap-3 prod-table__product">
                    <div
                      className="prod-table__product-img object-fit-cover"
                      style={{
                        background: m.bg,
                        backgroundImage: m.img ? `url(${m.img})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        width: "60px",
                        height: "45px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <div className="prod-table__product-info">
                      <span className="prod-table__product-name d-block text-truncate">{m.title}</span>
                      <span className="prod-table__product-brand d-block">{m.tag}</span>
                    </div>
                  </div>
                </td>
                <td className="prod-table__cell">
                  <span className="d-block text-truncate" style={{ maxWidth: "200px" }}>{m.sub || "—"}</span>
                  {m.price && <small className="text-muted d-block mt-1">{m.price}</small>}
                </td>
                <td className="prod-table__cell">
                  <span className="prod-badge prod-badge--new">#{m.order || 0}</span>
                </td>
                <td className="prod-table__cell">
                  <span className={`prod-badge ${parseBool(m.isActive) ? "prod-badge--stock-ok" : "prod-badge--stock-out"}`}>
                    {parseBool(m.isActive) ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="prod-table__cell">
                  <div className="d-flex justify-content-end gap-1 prod-table__actions">
                    <button
                      onClick={() => handleToggleActive(m)}
                      className={`prod-table__action-btn ${parseBool(m.isActive) ? "prod-table__action-btn--delete" : "prod-table__action-btn--edit"}`}
                      title={parseBool(m.isActive) ? "Deactivate" : "Activate"}
                    >
                      <Icon icon={parseBool(m.isActive) ? "lucide:eye-off" : "lucide:eye"} width={16} />
                    </button>
                    <button onClick={() => handleEdit(m)} className="prod-table__action-btn prod-table__action-btn--edit" title="Edit">
                      <Icon icon="lucide:pencil" width={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ id: m._id, name: m.title })} className="prod-table__action-btn prod-table__action-btn--delete" title="Delete">
                      <Icon icon="lucide:trash-2" width={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMessages.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:image-off" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">No slides found</p>
            <p className="prod-empty__desc">Try adjusting your search or add a new slide</p>
          </div>
        )}
      </div>
    </div>
  );
}