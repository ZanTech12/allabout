import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Modal from "./Modal";
import DeleteConfirm from "./DeleteConfirm";
import Toast from "./Toast";
import imageCompression from "browser-image-compression";
import "./ProductsPage.css";

function useIsMobile(breakpoint = 992) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < breakpoint
      : false
  );

  useEffect(() => {
    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsMobile(window.innerWidth < breakpoint);
      }, 150);
    };
    window.addEventListener("resize", handler);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handler);
    };
  }, [breakpoint]);

  return isMobile;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  engineeringPrice: "",
  category: "",
  images: [""],
  countInStock: "",
  brand: "",
  sku: "",
  isFeatured: false,
  isNewArrival: false,
  isFlashSale: false,
  assignedSalesRep: "",
};

export default function ProductsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  const isAdminOrEngineer = user?.role === "admin" || user?.role === "engineer";
  const isSalesRep = user?.role === "sales_rep";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // ✅ NEW STATE

  const [message, setMessage] = useState({ type: "", text: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, name: "" });
  const [form, setForm] = useState(EMPTY_FORM);

  const filterCategory = searchParams.get("category") || "";
  const filterFlash = searchParams.get("flash") === "true";
  const filterFeatured = searchParams.get("featured") === "true";
  const filterNew = searchParams.get("new") === "true";
  const filterDiscounted = searchParams.get("discounted") === "true";
  const filterOfficial = searchParams.get("official") === "true";
  const filterSub = searchParams.get("sub") || "";

  const hasAnyFilter =
    filterCategory ||
    filterFlash ||
    filterFeatured ||
    filterNew ||
    filterDiscounted ||
    filterOfficial ||
    filterSub;

  useEffect(() => {
    fetchData();
    fetchSalesReps();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (showForm && isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showForm, isMobile]);

  const parseBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "true" || val === "1";
    return false;
  };

  const parsePrice = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/,/g, "");
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products/admin/all"),
        api.get("/categories"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data.categories || catRes.data);
    } catch (error) {
      showMessage("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReps = async () => {
    if (!isAdminOrEngineer && !isSalesRep) return;
    try {
      const res = await api.get("/users", { params: { role: "sales_rep" } });
      const users = res.data.users || res.data || [];
      const reps = users.filter((u) => u.role === "sales_rep");
      setSalesReps(reps);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingProduct(null);
    setShowForm(false);
  };

  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const removeImageField = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const updateImageField = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = value;
      return { ...prev, images: updated };
    });
  };

  // ═══════════════════════════════════════════════
  // ✅ UPDATED IMAGE UPLOAD HANDLER WITH COMPRESSION + PROGRESS
  // ═══════════════════════════════════════════════
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    setUploadProgress(0); // ✅ Reset progress at start

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
            };

            const compressedBlob = await imageCompression(file, options);

            return new File(
              [compressedBlob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              { type: "image/jpeg", lastModified: Date.now() }
            );

          } catch (compressionError) {
            console.error("Compression failed, falling back to original:", compressionError);
            return file;
          }
        })
      );

      const formData = new FormData();
      compressedFiles.forEach((file) => {
        formData.append("images", file);
      });

      // ✅ Track upload progress via axios onUploadProgress
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      const uploadedUrls = response.data.urls;
      if (Array.isArray(uploadedUrls)) {
        setForm((prev) => ({
          ...prev,
          images: [
            ...prev.images.filter((img) => img && img.trim()),
            ...uploadedUrls,
          ],
        }));
        showMessage("success", `${uploadedUrls.length} image(s) compressed & uploaded`);
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Upload failed");
    } finally {
      setUploadingImage(false);
      setUploadProgress(0); // ✅ Reset progress when done
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getPrimaryImage = (product) => {
    if (Array.isArray(product.images)) {
      return product.images.find((img) => img && img.trim()) || "";
    }
    return product.image || "";
  };

  const handleEdit = (product) => {
    let images = [""];
    if (Array.isArray(product.images) && product.images.length) {
      images = [...product.images];
    } else if (product.image) {
      images = [product.image];
    }

    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      discountPrice: product.discountPrice?.toString() || "",
      engineeringPrice: product.engineeringPrice?.toString() || "",
      category: product.category || "",
      images,
      countInStock: product.countInStock?.toString() || "",
      brand: product.brand || "",
      sku: product.sku || "",
      isFeatured: parseBool(product.isFeatured),
      isNewArrival: parseBool(product.isNewArrival),
      isFlashSale: parseBool(product.isFlashSale),
      assignedSalesRep:
        product.assignedSalesRep?._id ||
        product.assignedSalesRep ||
        "",
    });

    setEditingProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanedImages = form.images.filter((img) => img && img.trim());
      const payload = {
        ...form,
        images: cleanedImages,
        price: parsePrice(form.price),
        discountPrice: form.discountPrice ? parsePrice(form.discountPrice) : null,
        engineeringPrice: form.engineeringPrice ? parsePrice(form.engineeringPrice) : null,
        countInStock: parseInt(form.countInStock) || 0,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showMessage("success", "Product updated");
      } else {
        await api.post("/products", payload);
        showMessage("success", "Product created");
      }
      resetForm();
      fetchData();
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/products/${deleteConfirm.id}`);
      showMessage("success", "Product deleted");
      setDeleteConfirm({ id: null, name: "" });
      fetchData();
    } catch (error) {
      showMessage("error", "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const clearFilter = (key) => {
    searchParams.delete(key);
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterFlash && !parseBool(p.isFlashSale)) return false;
      if (filterFeatured && !parseBool(p.isFeatured)) return false;
      if (filterNew && !parseBool(p.isNewArrival)) return false;
      if (filterDiscounted && !(p.discountPrice && p.price)) return false;
      return true;
    });
  }, [products, searchTerm, filterCategory, filterFlash, filterFeatured, filterNew, filterDiscounted]);

  const handleImgError = (e, fallbackText) => {
    e.target.onerror = null;
    e.target.src = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23e9ecef"><rect width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23adb5bd" font-family="sans-serif" font-size="14">${fallbackText || 'No image'}</text></svg>`
    )}`;
  };

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filterCategory) chips.push({ key: "category", label: filterCategory });
    if (filterFlash) chips.push({ key: "flash", label: "Flash Sale" });
    if (filterFeatured) chips.push({ key: "featured", label: "Featured" });
    if (filterNew) chips.push({ key: "new", label: "New Arrival" });
    if (filterDiscounted) chips.push({ key: "discounted", label: "Discounted" });
    if (filterOfficial) chips.push({ key: "official", label: "Official" });
    if (filterSub) chips.push({ key: "sub", label: filterSub });
    return chips;
  }, [filterCategory, filterFlash, filterFeatured, filterNew, filterDiscounted, filterOfficial, filterSub]);

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

      {/* ═══ HEADER ═══ */}
      <div className="prod-header">
        <div className="prod-header__info">
          <h2 className="prod-header__title">Products</h2>
          <p className="prod-header__count">
            {filteredProducts.length} Product{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {(isAdminOrEngineer || isSalesRep) && (
          <button
            className="prod-add-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Icon icon="lucide:plus" width={18} />
            <span className="prod-add-btn__text">Add Product</span>
          </button>
        )}
      </div>

      {/* ═══ SEARCH ═══ */}
      <div className="prod-search">
        <Icon icon="lucide:search" width={18} className="prod-search__icon" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="prod-search__input"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
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

      {/* ═══ FILTER CHIPS ═══ */}
      {activeFilterChips.length > 0 && (
        <div className="prod-filters">
          <div className="prod-filters__chips">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                className="prod-filter-chip"
                onClick={() => clearFilter(chip.key)}
              >
                <span>{chip.label}</span>
                <Icon icon="lucide:x" width={14} />
              </button>
            ))}
          </div>
          <button className="prod-filters__clear" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* ═══ PRODUCT FORM MODAL ═══ */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="prod-form-scroll">
          <form onSubmit={handleSubmit} className="prod-form" noValidate>
            {/* Product Name */}
            <div className="prod-form__group">
              <label className="prod-form__label">Product Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="prod-form__input"
                placeholder="Enter product name"
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div className="prod-form__group">
              <label className="prod-form__label">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="prod-form__textarea"
                placeholder="Describe the product"
              />
            </div>

            {/* Category + Brand row */}
            <div className="prod-form__row">
              <div className="prod-form__group">
                <label className="prod-form__label">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="prod-form__select"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="prod-form__group">
                <label className="prod-form__label">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="prod-form__input"
                  placeholder="Brand name"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Price row */}
            <div className="prod-form__row">
              <div className="prod-form__group">
                <label className="prod-form__label">Selling Price</label>
                <div className="prod-form__input-wrap">
                  <span className="prod-form__input-prefix">₦</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="prod-form__input prod-form__input--prefixed"
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="prod-form__group">
                <label className="prod-form__label">Discount Price</label>
                <div className="prod-form__input-wrap">
                  <span className="prod-form__input-prefix">₦</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    className="prod-form__input prod-form__input--prefixed"
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {/* Engineering Price + Stock row */}
            <div className="prod-form__row">
              <div className="prod-form__group">
                <label className="prod-form__label">Engineering Price</label>
                <div className="prod-form__input-wrap">
                  <span className="prod-form__input-prefix">₦</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.engineeringPrice}
                    onChange={(e) => setForm({ ...form, engineeringPrice: e.target.value })}
                    className="prod-form__input prod-form__input--prefixed"
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="prod-form__group">
                <label className="prod-form__label">Stock</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.countInStock}
                  onChange={(e) => setForm({ ...form, countInStock: e.target.value })}
                  className="prod-form__input"
                  placeholder="0"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* ═══ IMAGES ═══ */}
            <div className="prod-form__group">
              <div className="prod-form__images-header">
                <label className="prod-form__label">Images</label>
                <div className="prod-form__images-actions">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="prod-form__img-btn"
                    disabled={uploadingImage}
                  >
                    <Icon icon={uploadingImage ? "lucide:loader-2" : "lucide:upload"} width={14} />
                    {/* ✅ UPDATED: Show percentage during upload */}
                    {uploadingImage
                      ? uploadProgress > 0
                        ? `Uploading ${uploadProgress}%`
                        : "Compressing..."
                      : "Upload"}
                  </button>
                  {/* ✅ NEW: Progress bar under the button */}
                  {uploadingImage && (
                    <div className="prod-form__upload-progress">
                      <div
                        className="prod-form__upload-progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addImageField}
                    className="prod-form__img-btn"
                  >
                    <Icon icon="lucide:link" width={14} />
                    Add URL
                  </button>
                </div>
              </div>

              <div className="prod-form__images-list">
                {form.images.map((img, index) => (
                  <div key={index} className="prod-form__image-field">
                    <input
                      value={img}
                      onChange={(e) => updateImageField(index, e.target.value)}
                      className="prod-form__input"
                      placeholder="Image URL"
                      autoComplete="off"
                    />
                    {img && img.startsWith("http") && (
                      <img
                        src={img}
                        alt=""
                        className="prod-form__image-thumb"
                        onError={(e) => handleImgError(e)}
                      />
                    )}
                    {form.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="prod-form__image-remove"
                        aria-label="Remove image"
                      >
                        <Icon icon="lucide:trash-2" width={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="prod-form__flags">
              <label className="prod-form__flag">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="prod-form__checkbox"
                />
                <span className="prod-form__flag-label">Featured</span>
              </label>

              <label className="prod-form__flag">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                  className="prod-form__checkbox"
                />
                <span className="prod-form__flag-label">New Arrival</span>
              </label>

              <label className="prod-form__flag">
                <input
                  type="checkbox"
                  checked={form.isFlashSale}
                  onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })}
                  className="prod-form__checkbox"
                />
                <span className="prod-form__flag-label">Flash Sale</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="prod-form__actions">
              <button type="button" onClick={resetForm} className="prod-form__cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="prod-form__submit-btn"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ═══ DELETE CONFIRM ═══ */}
      <DeleteConfirm
        isOpen={deleteConfirm.id !== null}
        onClose={() => setDeleteConfirm({ id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Delete "${deleteConfirm.name}"?`}
        loading={saving}
      />

      {/* ═══ EMPTY STATE ═══ */}
      {filteredProducts.length === 0 && (
        <div className="prod-empty">
          <Icon icon="lucide:package-open" width={48} className="prod-empty__icon" />
          <h3 className="prod-empty__title">
            {hasAnyFilter || searchTerm
              ? "No products match your filters"
              : "No products yet"}
          </h3>
          <p className="prod-empty__text">
            {hasAnyFilter || searchTerm
              ? "Try adjusting your search or filters."
              : "Add your first product to get started."}
          </p>
          {(hasAnyFilter || searchTerm) && (
            <button className="prod-empty__btn" onClick={() => { setSearchTerm(""); clearAllFilters(); }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ═══ PRODUCT LIST ═══ */}
      {filteredProducts.length > 0 && isMobile && (
        <div className="prod-mobile-list">
          {filteredProducts.map((p) => (
            <div key={p._id} className="prod-mobile-card">
              <div className="prod-mobile-card__img-wrap">
                <img
                  loading="lazy"
                  src={
                    getPrimaryImage(p) ||
                    `data:image/svg+xml,${encodeURIComponent(
                      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23e9ecef"><rect width="200" height="200"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23adb5bd" font-family="sans-serif" font-size="12">No image</text></svg>'
                    )}`
                  }
                  alt={p.name}
                  className="prod-mobile-card__img"
                  onError={(e) => handleImgError(e, p.name?.charAt(0) || "?")}
                />
                <div className="prod-mobile-card__badges">
                  {parseBool(p.isFeatured) && (
                    <span className="prod-badge prod-badge--featured">Featured</span>
                  )}
                  {parseBool(p.isFlashSale) && (
                    <span className="prod-badge prod-badge--flash">Flash</span>
                  )}
                  {parseBool(p.isNewArrival) && (
                    <span className="prod-badge prod-badge--new">New</span>
                  )}
                </div>
              </div>

              <div className="prod-mobile-card__body">
                <h3 className="prod-mobile-card__name">{p.name}</h3>
                <p className="prod-mobile-card__category">{p.category}</p>

                <div className="prod-mobile-card__prices">
                  {p.discountPrice && p.price && (
                    <span className="prod-mobile-card__old-price">
                      ₦{formatCurrency(p.price)}
                    </span>
                  )}
                  <strong className="prod-mobile-card__price">
                    ₦{formatCurrency(p.discountPrice || p.price)}
                  </strong>
                </div>

                <div className="prod-mobile-card__stock">
                  <span
                    className={`prod-stock-dot ${
                      p.countInStock > 0
                        ? "prod-stock-dot--in"
                        : "prod-stock-dot--out"
                    }`}
                  />
                  <span>
                    {p.countInStock > 0
                      ? `${p.countInStock} in stock`
                      : "Out of stock"}
                  </span>
                </div>

                <div className="prod-mobile-card__actions">
                  {(isAdminOrEngineer || isSalesRep) && (
                    <button
                      onClick={() => handleEdit(p)}
                      className="prod-card-btn prod-card-btn--edit"
                    >
                      <Icon icon="lucide:pencil" width={14} />
                      Edit
                    </button>
                  )}
                  {isAdminOrEngineer && (
                    <button
                      onClick={() =>
                        setDeleteConfirm({ id: p._id, name: p.name })
                      }
                      className="prod-card-btn prod-card-btn--delete"
                    >
                      <Icon icon="lucide:trash-2" width={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length > 0 && !isMobile && (
        <div className="prod-table-wrap">
          <table className="prod-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="prod-table__product">
                      <img
                        loading="lazy"
                        src={
                          getPrimaryImage(p) ||
                          `data:image/svg+xml,${encodeURIComponent(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="%23e9ecef"><rect width="50" height="50"/></svg>'
                          )}`
                        }
                        alt={p.name}
                        className="prod-table__img"
                        onError={(e) => handleImgError(e, p.name?.charAt(0) || "?")}
                      />
                      <div className="prod-table__product-info">
                        <span className="prod-table__product-name">{p.name}</span>
                        {p.brand && (
                          <span className="prod-table__product-brand">{p.brand}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>
                    <div className="prod-table__prices">
                      {p.discountPrice && p.price && (
                        <span className="prod-table__old-price">
                          ₦{formatCurrency(p.price)}
                        </span>
                      )}
                      <span className="prod-table__price">
                        ₦{formatCurrency(p.discountPrice || p.price)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`prod-stock-badge ${
                        p.countInStock > 0
                          ? "prod-stock-badge--in"
                          : "prod-stock-badge--out"
                      }`}
                    >
                      {p.countInStock > 0 ? p.countInStock : "Out"}
                    </span>
                  </td>
                  <td>
                    <div className="prod-table__actions">
                      {(isAdminOrEngineer || isSalesRep) && (
                        <button
                          onClick={() => handleEdit(p)}
                          className="prod-card-btn prod-card-btn--edit"
                        >
                          <Icon icon="lucide:pencil" width={14} />
                          Edit
                        </button>
                      )}
                      {isAdminOrEngineer && (
                        <button
                          onClick={() =>
                            setDeleteConfirm({ id: p._id, name: p.name })
                          }
                          className="prod-card-btn prod-card-btn--delete"
                        >
                          <Icon icon="lucide:trash-2" width={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}