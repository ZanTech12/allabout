import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import Modal from "./Modal";
import DeleteConfirm from "./DeleteConfirm";
import Toast from "./Toast";
import "./CategoriesPage.css";

const ICON_OPTIONS = [
  "lucide:smartphone", "lucide:monitor", "lucide:shirt", "lucide:sofa",
  "lucide:refrigerator", "lucide:sparkles", "lucide:apple", "lucide:heart-pulse",
  "lucide:laptop", "lucide:gamepad-2", "lucide:baby", "lucide:dumbbell",
  "lucide:car", "lucide:book-open", "lucide:music", "lucide:camera",
  "lucide:headphones", "lucide:watch", "lucide:coffee", "lucide:package",
  "lucide:home", "lucide:utensils", "lucide:pill", "lucide:scissors",
];

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, name: "" });
  const isMobile = useIsMobile();
  
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ isActive: true });

  const [form, setForm] = useState({
    name: "", icon: "lucide:package", image: "", description: "",
    showInSidebar: true, showInCatalog: true, showInHome: true,
    sortOrder: 0, isActive: true,
  });

  const fetchCategories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
      if (filters.isActive) params.append("isActive", "true");

      const res = await api.get(`/categories?${params.toString()}`);
      
      if (res.data.pagination) {
        setCategories(res.data.categories);
        setPagination(prev => ({ ...prev, page: res.data.pagination.page, total: res.data.pagination.total, pages: res.data.pagination.pages }));
      } else {
        setCategories(res.data.categories || res.data);
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.isActive]);

  useEffect(() => { fetchCategories(1); }, [fetchCategories]);

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: "", text: "" }), 3000); };

  const resetForm = () => {
    setForm({ name: "", icon: "lucide:package", image: "", description: "", showInSidebar: true, showInCatalog: true, showInHome: true, sortOrder: 0, isActive: true });
    setEditingCategory(null); setShowForm(false);
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon || "lucide:package", image: cat.image || "", description: cat.description || "", showInSidebar: cat.showInSidebar !== false, showInCatalog: cat.showInCatalog !== false, showInHome: cat.showInHome !== false, sortOrder: cat.sortOrder || 0, isActive: cat.isActive !== false });
    setEditingCategory(cat); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showMessage("error", "Category name is required");
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), icon: form.icon, image: form.image, description: form.description, showInSidebar: form.showInSidebar, showInCatalog: form.showInCatalog, showInHome: form.showInHome, sortOrder: Number(form.sortOrder), isActive: form.isActive };
      if (editingCategory) { await api.put(`/categories/${editingCategory._id}`, payload); showMessage("success", "Category updated successfully"); }
      else { await api.post("/categories", payload); showMessage("success", "Category created successfully"); }
      resetForm(); fetchCategories(pagination.page);
    } catch (error) { showMessage("error", error.response?.data?.message || "Failed to save category"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setSaving(true);
    try {
      await api.delete(`/categories/${deleteConfirm.id}`); showMessage("success", "Category deleted successfully"); setDeleteConfirm({ id: null, name: "" });
      fetchCategories(categories.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page);
    } catch (error) { showMessage("error", error.response?.data?.message || "Failed to delete category"); } finally { setSaving(false); }
  };

  const handleToggleActive = async (cat) => {
    try { await api.put(`/categories/${cat._id}`, { isActive: !cat.isActive }); showMessage("success", `Category ${cat.isActive ? "deactivated" : "activated"}`); fetchCategories(pagination.page); }
    catch (error) { showMessage("error", error.response?.data?.message || "Failed to update status"); }
  };

  const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.pages) fetchCategories(newPage); };
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  if (loading && categories.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center cat-loading">
        <Icon icon="lucide:loader-2" width={32} className="cat-loading__icon" />
      </div>
    );
  }

  return (
    <div className={`cat-page ${isMobile ? 'cat-page--mobile' : ''}`}>
      <Toast message={message} />

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3 cat-header">
        <div className="cat-header__info">
          <h2 className="cat-header__title">Categories</h2>
          <p className="cat-header__count mb-0">
            {pagination.total} categories total
            {pagination.pages > 1 && <span className="ms-2">• Page {pagination.page} of {pagination.pages}</span>}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={`cat-add-btn ${isMobile ? 'w-100 justify-content-center' : ''}`}>
          <Icon icon="lucide:plus" width={18} /> Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-4 cat-filters-group">
        <button onClick={() => handleFilterChange("isActive", true)} className={`cat-filter-btn flex-grow-1 ${filters.isActive ? "active" : "off"}`}>
          <Icon icon="lucide:check-circle" width={14} className="me-1" /> Active
        </button>
        <button onClick={() => handleFilterChange("isActive", false)} className={`cat-filter-btn flex-grow-1 ${!filters.isActive ? "active-all" : "off"}`}>
          <Icon icon="lucide:circle" width={14} className="me-1" /> All
        </button>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={editingCategory ? "Edit Category" : "Add New Category"}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div className="row g-3">
            
            {/* Section 1: Basic Information */}
            <div className="col-12 mt-1">
              <div className="cat-form__section-title">Basic Information</div>
            </div>
            <div className="col-12">
              <label className="cat-form__label">Category Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-control cat-form__input" placeholder="e.g. Phones & Tablets" />
            </div>

            {/* Section 2: Appearance & Media */}
            <div className="col-12 mt-4">
              <div className="cat-form__section-title">Appearance & Media</div>
            </div>
            <div className="col-12">
              <label className="cat-form__label">Icon</label>
              <div className={`row g-1 p-2 cat-icon-grid ${isMobile ? 'row-cols-5' : 'row-cols-4 row-cols-sm-6 row-cols-md-8'}`}>
                {ICON_OPTIONS.map((icon) => (
                  <div key={icon} className="col">
                    <button type="button" onClick={() => setForm({ ...form, icon })} className={`w-100 d-flex align-items-center justify-content-center cat-icon-tile ${form.icon === icon ? "active" : ""}`}>
                      <Icon icon={icon} width={isMobile ? 18 : 18} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="cat-icon-selected mt-1">Selected: <code>{form.icon}</code></p>
            </div>
            <div className="col-12 col-md-6">
              <label className="cat-form__label">Image URL</label>
              <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="form-control cat-form__input" placeholder="https://..." />
            </div>
            <div className="col-12 col-md-6">
              <label className="cat-form__label">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-control cat-form__textarea" placeholder="Brief description..." rows="2" />
            </div>

            {/* Section 3: Sorting & Visibility */}
            <div className="col-12 mt-4">
              <div className="cat-form__section-title">Sorting & Visibility</div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="cat-form__label">Sort Order</label>
              <input type="number" min="0" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} className="form-control cat-form__input" />
            </div>
            <div className="col-12 col-sm-6"></div> {/* Spacer */}
            <div className="col-12">
              <label className="cat-form__label mb-2">Display Settings</label>
              <div className="row g-2">
                {[
                  { key: "isActive", label: "Active (visible to customers)", type: "green" },
                  { key: "showInSidebar", label: "Show in sidebar", type: "orange" },
                  { key: "showInCatalog", label: "Show in product catalogue", type: "orange" },
                  { key: "showInHome", label: "Show on home page", type: "orange" },
                ].map((setting) => (
                  <div key={setting.key} className="col-12 col-sm-6">
                    <label className={`d-flex align-items-center gap-3 px-3 py-2.5 cat-toggle w-100 ${form[setting.key] ? `cat-toggle--${setting.type}` : "cat-toggle--off"}`}>
                      <input type="checkbox" checked={form[setting.key]} onChange={e => setForm({ ...form, [setting.key]: e.target.checked })} className="visually-hidden" />
                      <div className={`cat-toggle__sphere ${form[setting.key] ? `cat-toggle__sphere--${setting.type}` : ""}`}>
                        {form[setting.key] && <Icon icon="lucide:check" width={14} className="text-white" />}
                      </div>
                      <span className="cat-toggle__label">{setting.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={`d-flex ${isMobile ? 'flex-column-reverse' : 'justify-content-end'} gap-2 pt-3 mt-2 cat-form-actions`}>
            <button type="button" onClick={resetForm} className={`cat-form__cancel ${isMobile ? 'w-100' : ''}`}>Cancel</button>
            <button type="submit" disabled={saving} className={`cat-form__submit ${saving ? "cat-form__submit--saving" : ""} ${isMobile ? 'w-100 justify-content-center' : ''}`}>
              {saving && <Icon icon="lucide:loader-2" width={16} className="cat-form__spin me-1" />}
              {editingCategory ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={deleteConfirm.id !== null} onClose={() => setDeleteConfirm({ id: null, name: "" })} onConfirm={handleDelete} title="Delete Category" message={`Are you sure you want to delete "${deleteConfirm.name}"?`} loading={saving} />

      {/* Loading overlay */}
      {loading && (
        <div className="position-fixed top-0 end-0 p-3 z-3">
          <div className="cat-loading-badge">
            <Icon icon="lucide:loader-2" width={18} className="cat-form__spin" />
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="row g-3">
        {categories.map((cat, index) => (
          <div key={cat._id} className={`col-12 ${isMobile ? 'col-12' : 'col-sm-6 col-lg-4'}`} style={{ animationDelay: `${index * 0.04}s` }}>
            <div className={`d-flex flex-column h-100 cat-card ${cat.isActive === false ? "cat-card--inactive" : ""}`}>
              <div className="d-flex align-items-start gap-3 p-3 flex-grow-1">
                <div className={`cat-card__icon flex-shrink-0 ${cat.isActive === false ? "cat-card__icon--off" : ""}`}>
                  <Icon icon={cat.icon || "lucide:package"} width={isMobile ? 20 : 24} />
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="cat-card__name text-truncate mb-0">{cat.name}</h3>
                    {cat.isActive === false && <span className="cat-badge cat-badge--inactive flex-shrink-0">Inactive</span>}
                  </div>
                  {cat.description && <p className="cat-card__desc mb-1">{cat.description}</p>}
                  {cat.sortOrder > 0 && <p className="cat-card__order mb-0">Order: {cat.sortOrder}</p>}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-1 px-3 pb-2">
                {cat.showInSidebar && <span className="cat-badge cat-badge--blue">Sidebar</span>}
                {cat.showInHome && <span className="cat-badge cat-badge--green">Home</span>}
                {cat.showInCatalog && <span className="cat-badge cat-badge--purple">Catalog</span>}
              </div>

              <div className="d-flex gap-2 p-3 mt-auto border-top cat-card__actions">
                <button onClick={() => handleToggleActive(cat)} className={`btn cat-action-btn flex-grow-1 ${cat.isActive ? "cat-action-btn--disable" : "cat-action-btn--enable"}`}>
                  <Icon icon={cat.isActive ? "lucide:eye-off" : "lucide:eye"} width={isMobile ? 14 : 12} className={isMobile ? "" : "me-1"} />
                  {isMobile ? (cat.isActive ? "Off" : "On") : (cat.isActive ? "Disable" : "Enable")}
                </button>
                <button onClick={() => handleEdit(cat)} className="btn cat-action-btn cat-action-btn--edit flex-grow-1">
                  <Icon icon="lucide:pencil" width={isMobile ? 14 : 12} className={isMobile ? "" : "me-1"} /> Edit
                </button>
                <button onClick={() => setDeleteConfirm({ id: cat._id, name: cat.name })} className="btn cat-action-btn cat-action-btn--delete flex-grow-1">
                  <Icon icon="lucide:trash-2" width={isMobile ? 14 : 12} className={isMobile ? "" : "me-1"} /> {isMobile ? "Del" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="cat-empty">
          <Icon icon="lucide:layout-grid" width={48} className="cat-empty__icon" />
          <p className="cat-empty__title">No categories found</p>
          <p className="cat-empty__desc">
            {filters.isActive ? "No active categories. Try showing all categories." : "Create your first category to get started"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex align-items-center justify-content-center gap-2 mt-4">
          <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="cat-page-btn">
            <Icon icon="lucide:chevron-left" width={16} />
          </button>
          
          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((page) => page === 1 || page === pagination.pages || Math.abs(page - pagination.page) <= (isMobile ? 1 : 2))
            .reduce((acc, page, i, arr) => {
              if (i > 0 && page - arr[i - 1] > 1) acc.push("...");
              acc.push(page);
              return acc;
            }, [])
            .map((item, i) =>
              item === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-secondary">...</span>
              ) : (
                <button key={item} onClick={() => handlePageChange(item)} className={`cat-page-btn ${pagination.page === item ? "active" : ""}`}>
                  {item}
                </button>
              )
            )}

          <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="cat-page-btn">
            <Icon icon="lucide:chevron-right" width={16} />
          </button>
        </div>
      )}
    </div>
  );
}
