import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import Modal from "./Modal";
import DeleteConfirm from "./DeleteConfirm";
import Toast from "./Toast";
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

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  /* ── Read filter params from URL ── */
  const filterCategory = searchParams.get("category") || "";
  const filterFlash = searchParams.get("flash") === "true";
  const filterFeatured = searchParams.get("featured") === "true";
  const filterNew = searchParams.get("new") === "true";
  const filterDiscounted = searchParams.get("discounted") === "true";
  const filterOfficial = searchParams.get("official") === "true";
  const filterSub = searchParams.get("sub") || "";

  const hasAnyFilter = filterCategory || filterFlash || filterFeatured || filterNew || filterDiscounted || filterOfficial || filterSub;

  /* ── Build active filter chips ── */
  const activeFilters = [];
  if (filterCategory) activeFilters.push({ key: "category", label: filterCategory, icon: "lucide:folder" });
  if (filterSub) activeFilters.push({ key: "sub", label: filterSub, icon: "lucide:tag" });
  if (filterFlash) activeFilters.push({ key: "flash", label: "Flash Sale", icon: "lucide:zap" });
  if (filterFeatured) activeFilters.push({ key: "featured", label: "Featured", icon: "lucide:star" });
  if (filterNew) activeFilters.push({ key: "new", label: "New Arrivals", icon: "lucide:sparkles" });
  if (filterDiscounted) activeFilters.push({ key: "discounted", label: "Discounted", icon: "lucide:trending-down" });
  if (filterOfficial) activeFilters.push({ key: "official", label: "Official Stores", icon: "lucide:badge-check" });

  const clearFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  };

  const clearAllFilters = () => setSearchParams({});

  /* ── Existing state ── */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, name: "" });

  const [form, setForm] = useState({
    name: "", description: "", price: "", discountPrice: "", category: "", image: "",
    countInStock: "", brand: "", sku: "", isFeatured: false, isNewArrival: false, isFlashSale: false,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([api.get("/products"), api.get("/categories")]);
      setProducts(prodRes.data);
      setCategories(catRes.data.categories || catRes.data);
    } catch (error) {
      showMessage("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", discountPrice: "", category: "", image: "", countInStock: "", brand: "", sku: "", isFeatured: false, isNewArrival: false, isFlashSale: false });
    setEditingProduct(null);
    setShowForm(false);
  };

  const parseBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "true" || val === "1";
    return false;
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || "", description: product.description || "", price: product.price?.toString() || "",
      discountPrice: product.discountPrice?.toString() || "", category: product.category || "", image: product.image || "",
      countInStock: product.countInStock?.toString() || "", brand: product.brand || "", sku: product.sku || "",
      isFeatured: parseBool(product.isFeatured), isNewArrival: parseBool(product.isNewArrival), isFlashSale: parseBool(product.isFlashSale),
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form, price: parseFloat(form.price) || 0, discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        countInStock: parseInt(form.countInStock) || 0, isFeatured: Boolean(form.isFeatured), isNewArrival: Boolean(form.isNewArrival), isFlashSale: Boolean(form.isFlashSale),
      };
      if (editingProduct) { await api.put(`/products/${editingProduct._id}`, payload); showMessage("success", "Product updated successfully"); }
      else { await api.post("/products", payload); showMessage("success", "Product created successfully"); }
      resetForm(); fetchData();
    } catch (error) { showMessage("error", error.response?.data?.message || "Failed to save product"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/products/${deleteConfirm.id}`); showMessage("success", "Product deleted successfully");
      setDeleteConfirm({ id: null, name: "" }); fetchData();
    } catch (error) { showMessage("error", "Failed to delete product"); } finally { setSaving(false); }
  };

  /* ── Filtered products ── */
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterFlash && !parseBool(p.isFlashSale)) return false;
    if (filterFeatured && !parseBool(p.isFeatured)) return false;
    if (filterNew && !parseBool(p.isNewArrival)) return false;
    if (filterDiscounted && !(p.discountPrice && p.price)) return false;
    return true;
  });

  const getFilterTitle = () => {
    if (filterFlash) return "Flash Sale Products";
    if (filterFeatured) return "Featured / Top Deals";
    if (filterNew) return "New Arrivals";
    if (filterDiscounted) return "Biggest Price Drops";
    if (filterOfficial) return "Official Store Products";
    if (filterCategory) return filterSub ? `${filterCategory} › ${filterSub}` : filterCategory;
    return null;
  };

  const getStockBadgeClass = (count) => count === 0 ? "prod-badge--stock-out" : count < 10 ? "prod-badge--stock-low" : "prod-badge--stock-ok";
  const getStockDotClass = (count) => count === 0 ? "prod-table__stock-dot--out" : count < 10 ? "prod-table__stock-dot--low" : "prod-table__stock-dot--ok";
  const getStockTextClass = (count) => count === 0 ? "prod-table__stock--out" : count < 10 ? "prod-table__stock--low" : "prod-table__stock--ok";
  const getStockLabel = (count) => count === 0 ? "Out of stock" : `${count} in stock`;
  const getFlagCount = (flag) => products.filter((p) => parseBool(p[flag])).length;

  if (loading) {
    return <div className="prod-loading"><Icon icon="lucide:loader-2" width={32} className="prod-loading__icon" /></div>;
  }

  const filterTitle = getFilterTitle();

  return (
    <div className="prod-page">
      <Toast message={message} />

      {hasAnyFilter && (
        <div className="prod-filter-bar">
          <div className="prod-filter-bar__inner">
            <div className="prod-filter-bar__left">
              {filterTitle && <div className="prod-filter-bar__title"><Icon icon="lucide:filter" width={16} /><span>{filterTitle}</span></div>}
              <div className="prod-filter-bar__chips">
                {activeFilters.map((f) => (
                  <span key={f.key} className="prod-filter-chip">
                    <Icon icon={f.icon} width={13} /><span>{f.label}</span>
                    <button onClick={() => clearFilter(f.key)} className="prod-filter-chip__close" aria-label={`Remove ${f.label} filter`}><Icon icon="lucide:x" width={13} /></button>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={clearAllFilters} className="prod-filter-bar__clear"><Icon icon="lucide:x-circle" width={15} />Clear filters</button>
          </div>
          <div className="prod-filter-bar__count">Showing <strong>{filteredProducts.length}</strong> of {products.length} products</div>
        </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 prod-header">
        <div className="prod-header__info">
          <h2 className="prod-header__title">{filterTitle || "Products"}</h2>
          <p className="prod-header__count mb-0">
            <strong>{products.length}</strong> products total
            {!isMobile && (
              <span className="ms-3 text-muted" style={{ fontSize: "0.85rem" }}>
                <span className="me-2">★ {getFlagCount("isFeatured")} Featured</span>
                <span className="me-2">✨ {getFlagCount("isNewArrival")} New</span>
                <span>⚡ {getFlagCount("isFlashSale")} Flash Sale</span>
              </span>
            )}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className={`prod-add-btn ${isMobile ? 'w-100 justify-content-center' : ''}`}>
          <Icon icon="lucide:plus" width={18} /> Add Product
        </button>
      </div>

      <div className="prod-search">
        <Icon icon="lucide:search" width={18} className="prod-search__icon" />
        <input type="text" placeholder="Search by name, category, or brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="prod-search__input" />
        {searchTerm && <button className="prod-search__clear" onClick={() => setSearchTerm("")} aria-label="Clear search"><Icon icon="lucide:x" width={16} /></button>}
      </div>

      <Modal isOpen={showForm} onClose={resetForm} title={editingProduct ? "Edit Product" : "Add New Product"}>
        <form onSubmit={handleSubmit} className="prod-form">
          <div className="row g-3">
            <div className="col-12 mt-1"><div className="prod-form__section-title">Product Information</div></div>
            <div className="col-12">
              <label className="prod-form__label">Product Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-control prod-form__input" placeholder="e.g. iPhone 15 Pro Max" />
            </div>
            <div className="col-12">
              <label className="prod-form__label">Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-control prod-form__textarea" placeholder="Describe the product features..." rows="3" />
            </div>

            <div className="col-12 mt-4"><div className="prod-form__section-title">Organization & Pricing</div></div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Category *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-select prod-form__select">
                <option value="">Select Category</option>
                {categories.map((cat) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="form-control prod-form__input" placeholder="e.g. Apple, Nike" />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Selling Price (₦) *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="form-control prod-form__input" placeholder="0.00" />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Discount Price (₦)</label>
              <input type="number" min="0" step="0.01" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} className="form-control prod-form__input" placeholder="Leave empty if none" />
            </div>

            <div className="col-12 mt-4"><div className="prod-form__section-title">Inventory & Media</div></div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Stock Count *</label>
              <input required type="number" min="0" value={form.countInStock} onChange={(e) => setForm({ ...form, countInStock: e.target.value })} className="form-control prod-form__input" placeholder="0" />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="form-control prod-form__input" placeholder="e.g. IPH15-PM-256" />
            </div>
            <div className="col-12">
              <label className="prod-form__label">Image URL *</label>
              <input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="form-control prod-form__input" placeholder="https://example.com/image.jpg" />
              {form.image && (
                <div className="prod-form__img-preview mt-2">
                  <img src={form.image} alt="Preview" />
                  <button type="button" onClick={() => setForm({ ...form, image: "" })} className="prod-form__img-remove"><Icon icon="lucide:x" width={12} /></button>
                </div>
              )}
            </div>

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">Display on Home Page</div>
              <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>Select where this product should appear</p>
            </div>
            <div className="col-12">
              <div className="row g-3 prod-form__flags">
                {[
                  { key: "isFeatured", label: "Top Deals", icon: "lucide:star", desc: "Featured deals section" },
                  { key: "isNewArrival", label: "New Arrivals", icon: "lucide:sparkles", desc: "New arrivals section" },
                  { key: "isFlashSale", label: "Flash Sale", icon: "lucide:zap", desc: "Countdown timer section" },
                ].map((flag) => (
                  <div key={flag.key} className={`col-12 ${isMobile ? '' : 'col-sm-4'}`}>
                    <label className={`prod-flag-toggle w-100 ${form[flag.key] ? "prod-flag-toggle--active" : ""}`}>
                      <input type="checkbox" checked={form[flag.key]} onChange={(e) => setForm({ ...form, [flag.key]: e.target.checked })} className="d-none" />
                      <div className="prod-flag-toggle__content">
                        <Icon icon={flag.icon} width={16} className="prod-flag-toggle__icon" />
                        <div>
                          <span className="prod-flag-toggle__label">{flag.label}</span>
                          <span className="prod-flag-toggle__desc">{flag.desc}</span>
                        </div>
                        <div className="prod-flag-toggle__check"><Icon icon={form[flag.key] ? "lucide:check-circle" : "lucide:circle"} width={18} /></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`d-flex ${isMobile ? 'flex-column-reverse' : 'justify-content-end'} gap-2 pt-4 mt-4 prod-form__actions`} style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            <button type="button" onClick={resetForm} className={`prod-form__cancel ${isMobile ? 'w-100' : ''}`}>Cancel</button>
            <button type="submit" disabled={saving} className={`prod-form__submit ${saving ? "prod-form__submit--saving" : ""} ${isMobile ? 'w-100 justify-content-center' : ''}`}>
              {saving && <Icon icon="lucide:loader-2" width={16} className="prod-form__spin me-1" />}
              {editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm isOpen={deleteConfirm.id !== null} onClose={() => setDeleteConfirm({ id: null, name: "" })} onConfirm={handleDelete} title="Delete Product" message={`Are you sure you want to delete "${deleteConfirm.name}"?`} loading={saving} />

      {/* Mobile Card View */}
      <div className="d-flex flex-column gap-3 prod-mobile-list d-lg-none">
        {filteredProducts.map((p) => (
          <div key={p._id} className="d-flex gap-3 p-3 prod-mobile-card">
            <img src={p.image || `https://picsum.photos/seed/${p._id}/80/80`} className="prod-mobile-card__img object-fit-cover" alt={p.name} />
            <div className="d-flex flex-column flex-grow-1 min-w-0 prod-mobile-card__body">
              <h3 className="prod-mobile-card__name text-truncate">{p.name}</h3>
              <p className="prod-mobile-card__category mb-1">{p.category}{p.brand ? ` · ${p.brand}` : ""}</p>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="prod-mobile-card__price-current">₦{(p.discountPrice || p.price)?.toLocaleString()}</span>
                {p.discountPrice && <span className="prod-mobile-card__price-old">₦{p.price?.toLocaleString()}</span>}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                <span className={`prod-badge ${getStockBadgeClass(p.countInStock)}`}>{getStockLabel(p.countInStock)}</span>
                {parseBool(p.isFeatured) && <span className="prod-badge prod-badge--featured">★ Featured</span>}
                {parseBool(p.isNewArrival) && <span className="prod-badge prod-badge--new">New</span>}
                {parseBool(p.isFlashSale) && <span className="prod-badge prod-badge--flash">⚡ Sale</span>}
              </div>
              <div className="d-flex gap-2 mt-auto">
                <button onClick={() => handleEdit(p)} className="btn prod-mobile-card__btn prod-mobile-card__btn--edit flex-grow-1"><Icon icon="lucide:pencil" width={14} className="me-1" />Edit</button>
                <button onClick={() => setDeleteConfirm({ id: p._id, name: p.name })} className="btn prod-mobile-card__btn prod-mobile-card__btn--delete flex-grow-1"><Icon icon="lucide:trash-2" width={14} className="me-1" />Delete</button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:package" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">{hasAnyFilter ? "No products match this filter" : "No products found"}</p>
            <p className="prod-empty__desc">{hasAnyFilter ? "Try removing some filters" : "Try adjusting your search or add a new product"}</p>
            {hasAnyFilter && <button onClick={clearAllFilters} className="prod-add-btn mt-3"><Icon icon="lucide:x-circle" width={16} />Clear All Filters</button>}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="prod-table-wrap d-none d-lg-block">
        <table className="prod-table">
          <thead className="prod-table__head">
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Display On</th><th className="text-end">Actions</th></tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id} className="prod-table__row">
                <td className="prod-table__cell">
                  <div className="d-flex align-items-center gap-3 prod-table__product">
                    <img src={p.image || `https://picsum.photos/seed/${p._id}/50/50`} className="prod-table__product-img object-fit-cover" alt={p.name} />
                    <div className="prod-table__product-info">
                      <span className="prod-table__product-name d-block text-truncate">{p.name}</span>
                      {p.brand && <span className="prod-table__product-brand d-block">{p.brand}</span>}
                    </div>
                  </div>
                </td>
                <td className="prod-table__cell">{p.category}</td>
                <td className="prod-table__cell">
                  <span className="prod-table__price-current d-block">₦{(p.discountPrice || p.price)?.toLocaleString()}</span>
                  {p.discountPrice && <span className="prod-table__price-old d-block">₦{p.price?.toLocaleString()}</span>}
                </td>
                <td className="prod-table__cell">
                  <span className={`d-inline-flex align-items-center gap-2 prod-table__stock ${getStockTextClass(p.countInStock)}`}>
                    <span className={`prod-table__stock-dot ${getStockDotClass(p.countInStock)}`} />{p.countInStock}
                  </span>
                </td>
                <td className="prod-table__cell">
                  <div className="d-flex flex-wrap gap-1 prod-table__flags">
                    {parseBool(p.isFeatured) && <span className="prod-badge prod-flag-badge prod-badge--featured">★ Featured</span>}
                    {parseBool(p.isNewArrival) && <span className="prod-badge prod-flag-badge prod-badge--new">New</span>}
                    {parseBool(p.isFlashSale) && <span className="prod-badge prod-flag-badge prod-badge--flash">⚡ Sale</span>}
                    {!parseBool(p.isFeatured) && !parseBool(p.isNewArrival) && !parseBool(p.isFlashSale) && <span className="text-muted" style={{ fontSize: "0.8rem" }}>None</span>}
                  </div>
                </td>
                <td className="prod-table__cell">
                  <div className="d-flex justify-content-end gap-1 prod-table__actions">
                    <button onClick={() => handleEdit(p)} className="prod-table__action-btn prod-table__action-btn--edit" title="Edit"><Icon icon="lucide:pencil" width={16} /></button>
                    <button onClick={() => setDeleteConfirm({ id: p._id, name: p.name })} className="prod-table__action-btn prod-table__action-btn--delete" title="Delete"><Icon icon="lucide:trash-2" width={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="prod-empty">
            <Icon icon="lucide:package" width={48} className="prod-empty__icon" />
            <p className="prod-empty__title">{hasAnyFilter ? "No products match this filter" : "No products found"}</p>
            <p className="prod-empty__desc">{hasAnyFilter ? "Try removing some filters" : "Try adjusting your search or add a new product"}</p>
            {hasAnyFilter && <button onClick={clearAllFilters} className="prod-add-btn mt-3"><Icon icon="lucide:x-circle" width={16} />Clear All Filters</button>}
          </div>
        )}
      </div>
    </div>
  );
}