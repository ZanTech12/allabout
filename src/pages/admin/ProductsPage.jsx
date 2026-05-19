import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
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

  /* ── Role helpers ── */
  const isAdminOrEngineer =
    user?.role === "admin" || user?.role === "engineer";
  const isSalesRep = user?.role === "sales_rep";

  // ✅ Can this user edit ALL prices (Selling, Discount, Eng) for a specific product?
  // Admins and Sales Reps can edit any product's prices.
  const canEditProductPrices = (product) => {
    if (!user) return false;
    if (isAdminOrEngineer || isSalesRep) return true;
    return false;
  };

  /* ── Price Parsing & Formatting Helpers ── */
  // Strips commas and fixes JavaScript floating-point precision issues
  const parsePrice = (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const cleanVal = String(val).replace(/,/g, ""); // Remove commas in case user types "17,500"
    const num = parseFloat(cleanVal);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  };

  // Consistently formats numbers as currency with 2 decimal places
  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ── Read filter params from URL ── */
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

  /* ── Build active filter chips ── */
  const activeFilters = [];
  if (filterCategory)
    activeFilters.push({
      key: "category",
      label: filterCategory,
      icon: "lucide:folder",
    });
  if (filterSub)
    activeFilters.push({ key: "sub", label: filterSub, icon: "lucide:tag" });
  if (filterFlash)
    activeFilters.push({
      key: "flash",
      label: "Flash Sale",
      icon: "lucide:zap",
    });
  if (filterFeatured)
    activeFilters.push({
      key: "featured",
      label: "Featured",
      icon: "lucide:star",
    });
  if (filterNew)
    activeFilters.push({
      key: "new",
      label: "New Arrivals",
      icon: "lucide:sparkles",
    });
  if (filterDiscounted)
    activeFilters.push({
      key: "discounted",
      label: "Discounted",
      icon: "lucide:trending-down",
    });
  if (filterOfficial)
    activeFilters.push({
      key: "official",
      label: "Official Stores",
      icon: "lucide:badge-check",
    });

  const clearFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  };

  const clearAllFilters = () => setSearchParams({});

  /* ── Existing state ── */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ id: null, name: "" });

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchData();
    fetchSalesReps();
  }, []);

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
      console.error("Failed to fetch sales reps:", error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingProduct(null);
    setShowForm(false);
  };

  const parseBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") return val === "true" || val === "1";
    return false;
  };

  /* ── Image array helpers ── */
  const addImageField = () => {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
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
        setForm((prev) => {
          const existingValidImages = prev.images.filter(
            (img) => img && img.trim()
          );
          return {
            ...prev,
            images: [...existingValidImages, ...uploadedUrls],
          };
        });
        showMessage(
          "success",
          `${uploadedUrls.length} image(s) uploaded successfully`
        );
      } else {
        throw new Error("No URLs returned from server");
      }
    } catch (error) {
      console.error(error);
      showMessage(
        "error",
        error.response?.data?.message ||
          "Image upload failed. Please try again."
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Helper: get the primary image for display ── */
  const getPrimaryImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return (
        product.images.find((img) => img && img.trim()) || product.images[0]
      );
    }
    return product.image || "";
  };

  /* ── Helper: display assigned rep name ── */
  const getAssignedRepName = (product) => {
    if (!product.assignedSalesRep) return null;
    if (typeof product.assignedSalesRep === "object") {
      return product.assignedSalesRep.name || product.assignedSalesRep.email;
    }
    return null;
  };

  /* ── Helper: is this product assigned to the current sales rep? ── */
  const isAssignedToMe = (product) => {
    if (!isSalesRep) return false;
    const assignedId =
      product?.assignedSalesRep?._id?.toString() ||
      (typeof product?.assignedSalesRep === "string"
        ? product.assignedSalesRep.toString()
        : null);
    return assignedId && assignedId === user._id.toString();
  };

  const handleEdit = (product) => {
    let images = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      images = [...product.images];
    } else if (product.image) {
      images = [product.image];
    } else {
      images = [""];
    }

    const assignedRepId = product.assignedSalesRep
      ? product.assignedSalesRep._id?.toString() ||
        (typeof product.assignedSalesRep === "string"
          ? product.assignedSalesRep
          : "")
      : "";

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
      assignedSalesRep: assignedRepId,
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
        image: cleanedImages[0] || "",
        images: cleanedImages,
        price: parsePrice(form.price),
        discountPrice: form.discountPrice ? parsePrice(form.discountPrice) : null,
        engineeringPrice: form.engineeringPrice ? parsePrice(form.engineeringPrice) : null,
        countInStock: parseInt(form.countInStock) || 0,
        isFeatured: Boolean(form.isFeatured),
        isNewArrival: Boolean(form.isNewArrival),
        isFlashSale: Boolean(form.isFlashSale),
      };
      delete payload.image;

      if (isAdminOrEngineer || isSalesRep) {
        payload.assignedSalesRep = form.assignedSalesRep || null;
      } else {
        delete payload.assignedSalesRep;
      }

      if (!canEditProductPrices(editingProduct)) {
        delete payload.price;
        delete payload.discountPrice;
        delete payload.engineeringPrice;
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showMessage("success", "Product updated successfully");
      } else {
        await api.post("/products", payload);
        showMessage("success", "Product created successfully");
      }
      resetForm();
      fetchData();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data?.message || "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/products/${deleteConfirm.id}`);
      showMessage("success", "Product deleted successfully");
      setDeleteConfirm({ id: null, name: "" });
      fetchData();
    } catch (error) {
      showMessage("error", "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  /* ── Filtered products ── */
  const filteredProducts = products.filter((p) => {
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

  const getFilterTitle = () => {
    if (filterFlash) return "Flash Sale Products";
    if (filterFeatured) return "Featured / Top Deals";
    if (filterNew) return "New Arrivals";
    if (filterDiscounted) return "Biggest Price Drops";
    if (filterOfficial) return "Official Store Products";
    if (filterCategory)
      return filterSub ? `${filterCategory} › ${filterSub}` : filterCategory;
    return null;
  };

  const getStockBadgeClass = (count) =>
    count === 0
      ? "prod-badge--stock-out"
      : count < 10
      ? "prod-badge--stock-low"
      : "prod-badge--stock-ok";
  const getStockDotClass = (count) =>
    count === 0
      ? "prod-table__stock-dot--out"
      : count < 10
      ? "prod-table__stock-dot--low"
      : "prod-table__stock-dot--ok";
  const getStockTextClass = (count) =>
    count === 0
      ? "prod-table__stock--out"
      : count < 10
      ? "prod-table__stock--low"
      : "prod-table__stock--ok";
  const getStockLabel = (count) =>
    count === 0 ? "Out of stock" : `${count} in stock`;
  const getFlagCount = (flag) =>
    products.filter((p) => parseBool(p[flag])).length;

  const formatEngPrice = (p) => {
    if (!canEditProductPrices(p)) return null;
    if (p.engineeringPrice && p.engineeringPrice > 0) {
      return `₦${formatCurrency(p.engineeringPrice)}`;
    }
    return null;
  };

  const currentShowEngPriceField = isAdminOrEngineer || isSalesRep;

  if (loading) {
    return (
      <div className="prod-loading">
        <Icon
          icon="lucide:loader-2"
          width={32}
          className="prod-loading__icon"
        />
      </div>
    );
  }

  const filterTitle = getFilterTitle();

  return (
    <div className="prod-page">
      <Toast message={message} />

      {hasAnyFilter && (
        <div className="prod-filter-bar">
          <div className="prod-filter-bar__inner">
            <div className="prod-filter-bar__left">
              {filterTitle && (
                <div className="prod-filter-bar__title">
                  <Icon icon="lucide:filter" width={16} />
                  <span>{filterTitle}</span>
                </div>
              )}
              <div className="prod-filter-bar__chips">
                {activeFilters.map((f) => (
                  <span key={f.key} className="prod-filter-chip">
                    <Icon icon={f.icon} width={13} />
                    <span>{f.label}</span>
                    <button
                      onClick={() => clearFilter(f.key)}
                      className="prod-filter-chip__close"
                      aria-label={`Remove ${f.label} filter`}
                    >
                      <Icon icon="lucide:x" width={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="prod-filter-bar__clear"
            >
              <Icon icon="lucide:x-circle" width={15} />
              Clear filters
            </button>
          </div>
          <div className="prod-filter-bar__count">
            Showing <strong>{filteredProducts.length}</strong> of{" "}
            {products.length} products
          </div>
        </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 prod-header">
        <div className="prod-header__info">
          <h2 className="prod-header__title">
            {filterTitle || "Products"}
          </h2>
          <p className="prod-header__count mb-0">
            <strong>{products.length}</strong> products total
            {!isMobile && (
              <span
                className="ms-3 text-muted"
                style={{ fontSize: "0.85rem" }}
              >
                <span className="me-2">
                  ★ {getFlagCount("isFeatured")} Featured
                </span>
                <span className="me-2">
                  ✨ {getFlagCount("isNewArrival")} New
                </span>
                <span>⚡ {getFlagCount("isFlashSale")} Flash Sale</span>
              </span>
            )}
          </p>
        </div>
        
        {(isAdminOrEngineer || isSalesRep) && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={`prod-add-btn ${isMobile ? "w-100 justify-content-center" : ""}`}
          >
            <Icon icon="lucide:plus" width={18} /> Add Product
          </button>
        )}
      </div>

      <div className="prod-search">
        <Icon icon="lucide:search" width={18} className="prod-search__icon" />
        <input
          type="text"
          placeholder="Search by name, category, or brand..."
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

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form onSubmit={handleSubmit} className="prod-form">
          <div className="row g-3">
            <div className="col-12 mt-1">
              <div className="prod-form__section-title">
                Product Information
              </div>
            </div>
            <div className="col-12">
              <label className="prod-form__label">Product Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. iPhone 15 Pro Max"
              />
            </div>
            <div className="col-12">
              <label className="prod-form__label">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="form-control prod-form__textarea"
                placeholder="Describe the product features..."
                rows="3"
              />
            </div>

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">
                Organization & Pricing
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="form-select prod-form__select"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Brand</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. Apple, Nike"
              />
            </div>

            {(isAdminOrEngineer || isSalesRep) && (
              <div className="col-12 col-sm-6">
                <label className="prod-form__label">
                  Assigned Sales Rep{" "}
                  <span
                    className="text-muted fw-normal"
                    style={{ fontSize: "0.78rem" }}
                  >
                    (Can edit prices)
                  </span>
                </label>
                <select
                  value={form.assignedSalesRep}
                  onChange={(e) =>
                    setForm({ ...form, assignedSalesRep: e.target.value })
                  }
                  className="form-select prod-form__select"
                >
                  <option value="">None</option>
                  {salesReps.map((rep) => (
                    <option key={rep._id} value={rep._id}>
                      {rep.name}
                      {rep.email ? ` (${rep.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSalesRep && editingProduct && isAssignedToMe(editingProduct) && (
              <div className="col-12 col-sm-6 d-flex align-items-end">
                <div
                  className="d-flex align-items-center gap-2 w-100"
                  style={{
                    padding: "0.6rem 0.9rem",
                    background: "#e6fcf5",
                    border: "1px solid #96f2d7",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#087f5b",
                    fontWeight: 500,
                  }}
                >
                  <Icon icon="lucide:user-check" width={16} />
                  You are assigned to this product
                </div>
              </div>
            )}

            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Selling Price (₦) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="form-control prod-form__input"
                placeholder="0.00"
                disabled={!canEditProductPrices(editingProduct)} 
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Discount Price (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={(e) =>
                  setForm({ ...form, discountPrice: e.target.value })
                }
                className="form-control prod-form__input"
                placeholder="Leave empty if none"
                disabled={!canEditProductPrices(editingProduct)}
              />
            </div>

            {currentShowEngPriceField && (
              <div className="col-12 col-sm-6">
                <label className="prod-form__label">
                  Engineering Price (₦){" "}
                  <span
                    className="text-muted fw-normal"
                    style={{ fontSize: "0.78rem" }}
                  >
                    (Cost / Internal)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.engineeringPrice}
                  onChange={(e) =>
                    setForm({ ...form, engineeringPrice: e.target.value })
                  }
                  className="form-control prod-form__input"
                  placeholder="Internal cost price"
                />
              </div>
            )}

            {currentShowEngPriceField && (
              <div className="col-12 col-sm-6">
                <label className="prod-form__label">
                  Margin{" "}
                  <span
                    className="text-muted fw-normal"
                    style={{ fontSize: "0.78rem" }}
                  >
                    (Auto-calculated)
                  </span>
                </label>
                <div
                  className="form-control prod-form__input d-flex align-items-center"
                  style={{
                    background:
                      form.engineeringPrice && form.price
                        ? "#f0fff4"
                        : "#f8f9fa",
                    borderColor:
                      form.engineeringPrice && form.price
                        ? "#b2f5ea"
                        : "#e9ecef",
                    color:
                      form.engineeringPrice && form.price
                        ? "#276749"
                        : "#adb5bd",
                    cursor: "default",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {form.engineeringPrice && form.price
                    ? (() => {
                        const eng = parsePrice(form.engineeringPrice);
                        const sell = parsePrice(form.price);
                        const effectiveSell = form.discountPrice
                          ? parsePrice(form.discountPrice)
                          : sell;
                        if (eng > 0 && effectiveSell > 0) {
                          const marginAmt = Math.round((effectiveSell - eng) * 100) / 100;
                          const marginPct = (
                            (marginAmt / effectiveSell) *
                            100
                          ).toFixed(1);
                          return `₦${formatCurrency(marginAmt)} (${marginPct}%)`;
                        }
                        return "—";
                      })()
                    : "Enter selling & engineering price"}
                </div>
              </div>
            )}

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">
                Inventory & Media
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">Stock Count *</label>
              <input
                required
                type="number"
                min="0"
                value={form.countInStock}
                onChange={(e) =>
                  setForm({ ...form, countInStock: e.target.value })
                }
                className="form-control prod-form__input"
                placeholder="0"
              />
            </div>
            <div className="col-12 col-sm-6">
              <label className="prod-form__label">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="form-control prod-form__input"
                placeholder="e.g. IPH15-PM-256"
              />
            </div>

            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="prod-form__label mb-0">
                  Images *{" "}
                  <span
                    className="text-muted fw-normal"
                    style={{ fontSize: "0.8rem" }}
                  >
                    (
                    {
                      form.images.filter((img) => img && img.trim()).length
                    }{" "}
                    {form.images.filter((img) => img && img.trim())
                      .length === 1
                      ? "image"
                      : "images"}
                    )
                  </span>
                </label>
                <div className="d-flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="prod-form__add-img-btn"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Icon
                        icon="lucide:loader-2"
                        width={14}
                        className="prod-form__spin"
                      />
                    ) : (
                      <Icon icon="lucide:upload" width={14} />
                    )}
                    {uploadingImage ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="prod-form__add-img-btn"
                    disabled={uploadingImage}
                  >
                    <Icon icon="lucide:plus" width={14} /> Add URL
                  </button>
                </div>
              </div>

              <div className="prod-form__images-list">
                {form.images.map((img, index) => (
                  <div key={index} className="prod-form__image-row">
                    <span className="prod-form__image-index">
                      {index + 1}
                    </span>
                    <input
                      required={
                        index === 0 &&
                        form.images.filter((i) => i && i.trim()).length ===
                          0
                      }
                      value={img}
                      onChange={(e) =>
                        updateImageField(index, e.target.value)
                      }
                      className="form-control prod-form__input"
                      placeholder={
                        index === 0
                          ? "Primary image — https://example.com/image.jpg"
                          : "https://example.com/image.jpg"
                      }
                      disabled={uploadingImage}
                    />
                    {form.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="prod-form__image-remove"
                        title="Remove this image"
                        disabled={uploadingImage}
                      >
                        <Icon icon="lucide:trash-2" width={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {form.images.some((img) => img && img.trim()) && (
                <div className="prod-form__img-previews mt-3">
                  {form.images.map((img, index) =>
                    img && img.trim() ? (
                      <div
                        key={index}
                        className="prod-form__img-preview-item"
                      >
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        {index === 0 && (
                          <span className="prod-form__img-badge-primary">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="prod-form__img-remove"
                          title="Remove image"
                        >
                          <Icon icon="lucide:x" width={12} />
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>

            <div className="col-12 mt-4">
              <div className="prod-form__section-title">
                Display on Home Page
              </div>
              <p
                className="text-muted mb-3"
                style={{ fontSize: "0.85rem" }}
              >
                Select where this product should appear
              </p>
            </div>
            <div className="col-12">
              <div className="row g-3 prod-form__flags">
                {[
                  {
                    key: "isFeatured",
                    label: "Top Deals",
                    icon: "lucide:star",
                    desc: "Featured deals section",
                  },
                  {
                    key: "isNewArrival",
                    label: "New Arrivals",
                    icon: "lucide:sparkles",
                    desc: "New arrivals section",
                  },
                  {
                    key: "isFlashSale",
                    label: "Flash Sale",
                    icon: "lucide:zap",
                    desc: "Countdown timer section",
                  },
                ].map((flag) => (
                  <div
                    key={flag.key}
                    className={`col-12 ${isMobile ? "" : "col-sm-4"}`}
                  >
                    <label
                      className={`prod-flag-toggle w-100 ${
                        form[flag.key] ? "prod-flag-toggle--active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form[flag.key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [flag.key]: e.target.checked,
                          })
                        }
                        className="d-none"
                      />
                      <div className="prod-flag-toggle__content">
                        <Icon
                          icon={flag.icon}
                          width={16}
                          className="prod-flag-toggle__icon"
                        />
                        <div>
                          <span className="prod-flag-toggle__label">
                            {flag.label}
                          </span>
                          <span className="prod-flag-toggle__desc">
                            {flag.desc}
                          </span>
                        </div>
                        <div className="prod-flag-toggle__check">
                          <Icon
                            icon={
                              form[flag.key]
                                ? "lucide:check-circle"
                                : "lucide:circle"
                            }
                            width={18}
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`d-flex ${
              isMobile ? "flex-column-reverse" : "justify-content-end"
            } gap-2 pt-4 mt-4 prod-form__actions`}
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
              disabled={saving || uploadingImage}
              className={`prod-form__submit ${
                saving ? "prod-form__submit--saving" : ""
              } ${isMobile ? "w-100 justify-content-center" : ""}`}
            >
              {saving && (
                <Icon
                  icon="lucide:loader-2"
                  width={16}
                  className="prod-form__spin me-1"
                />
              )}
              {editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={deleteConfirm.id !== null}
        onClose={() => setDeleteConfirm({ id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        loading={saving}
      />

      {/* Mobile Card View */}
      <div className="d-flex flex-column gap-3 prod-mobile-list d-lg-none">
        {filteredProducts.map((p) => (
          <div key={p._id} className="d-flex gap-3 p-3 prod-mobile-card">
            <img
              src={
                getPrimaryImage(p) ||
                `https://picsum.photos/seed/${p._id}/80/80`
              }
              className="prod-mobile-card__img object-fit-cover"
              alt={p.name}
            />
            <div className="d-flex flex-column flex-grow-1 min-w-0 prod-mobile-card__body">
              <h3 className="prod-mobile-card__name text-truncate">
                {p.name}
              </h3>
              <p className="prod-mobile-card__category mb-1">
                {p.category}
                {p.brand ? ` · ${p.brand}` : ""}
              </p>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <span className="prod-mobile-card__price-current">
                  ₦{formatCurrency(p.discountPrice || p.price)}
                </span>
                {p.discountPrice && (
                  <span className="prod-mobile-card__price-old">
                    ₦{formatCurrency(p.price)}
                  </span>
                )}
              </div>
              {formatEngPrice(p) && (
                <div className="d-flex align-items-center gap-1 mb-1">
                  <Icon
                    icon="lucide:wrench"
                    width={12}
                    style={{ color: "#868e96" }}
                  />
                  <span
                    style={{ fontSize: "0.75rem", color: "#868e96" }}
                  >
                    Eng: {formatEngPrice(p)}
                  </span>
                </div>
              )}
              {getAssignedRepName(p) && (
                <div className="d-flex align-items-center gap-1 mb-1">
                  <Icon
                    icon="lucide:user"
                    width={12}
                    style={{ color: "#868e96" }}
                  />
                  <span
                    style={{ fontSize: "0.75rem", color: "#868e96" }}
                  >
                    {isAssignedToMe(p)
                      ? "Assigned to you"
                      : `Rep: ${getAssignedRepName(p)}`}
                  </span>
                </div>
              )}
              <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                <span
                  className={`prod-badge ${getStockBadgeClass(
                    p.countInStock
                  )}`}
                >
                  {getStockLabel(p.countInStock)}
                </span>
                {parseBool(p.isFeatured) && (
                  <span className="prod-badge prod-badge--featured">
                    ★ Featured
                  </span>
                )}
                {parseBool(p.isNewArrival) && (
                  <span className="prod-badge prod-badge--new">New</span>
                )}
                {parseBool(p.isFlashSale) && (
                  <span className="prod-badge prod-badge--flash">
                    ⚡ Sale
                  </span>
                )}
                {isAssignedToMe(p) && (
                  <span
                    className="prod-badge"
                    style={{
                      background: "#e6fcf5",
                      color: "#087f5b",
                      border: "1px solid #96f2d7",
                    }}
                  >
                    <Icon
                      icon="lucide:user-check"
                      width={11}
                      style={{ marginRight: 3 }}
                    />
                    You
                  </span>
                )}
              </div>
              <div className="d-flex gap-2 mt-auto">
                <button
                  onClick={() => handleEdit(p)}
                  className="btn prod-mobile-card__btn prod-mobile-card__btn--edit flex-grow-1"
                >
                  <Icon
                    icon="lucide:pencil"
                    width={14}
                    className="me-1"
                  />
                  Edit
                </button>
                {(isAdminOrEngineer || isSalesRep) && (
                  <button
                    onClick={() =>
                      setDeleteConfirm({ id: p._id, name: p.name })
                    }
                    className="btn prod-mobile-card__btn prod-mobile-card__btn--delete flex-grow-1"
                  >
                    <Icon
                      icon="lucide:trash-2"
                      width={14}
                      className="me-1"
                    />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="prod-empty">
            <Icon
              icon="lucide:package"
              width={48}
              className="prod-empty__icon"
            />
            <p className="prod-empty__title">
              {hasAnyFilter
                ? "No products match this filter"
                : "No products found"}
            </p>
            <p className="prod-empty__desc">
              {hasAnyFilter
                ? "Try removing some filters"
                : "Try adjusting your search or add a new product"}
            </p>
            {hasAnyFilter && (
              <button
                onClick={clearAllFilters}
                className="prod-add-btn mt-3"
              >
                <Icon icon="lucide:x-circle" width={16} />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="prod-table-wrap d-none d-lg-block">
        <table className="prod-table">
          <thead className="prod-table__head">
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Selling Price</th>
              {(isAdminOrEngineer || isSalesRep) && (
                <>
                  <th>Eng. Price</th>
                  <th>Margin</th>
                </>
              )}
              <th>Stock</th>
              <th>Assigned To</th>
              <th>Display On</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const canSeeEng = canEditProductPrices(p);
              const engPrice =
                canSeeEng && p.engineeringPrice
                  ? Number(p.engineeringPrice)
                  : 0;
              const sellPrice = p.discountPrice
                ? Number(p.discountPrice)
                : Number(p.price) || 0;
              // Fix for floating point inaccuracies on table margin calculation as well
              const marginAmt =
                engPrice > 0 && sellPrice > 0 ? Math.round((sellPrice - engPrice) * 100) / 100 : null;
              const marginPct =
                marginAmt !== null && sellPrice > 0
                  ? ((marginAmt / sellPrice) * 100).toFixed(1)
                  : null;

              return (
                <tr key={p._id} className="prod-table__row">
                  <td className="prod-table__cell">
                    <div className="d-flex align-items-center gap-3 prod-table__product">
                      <img
                        src={
                          getPrimaryImage(p) ||
                          `https://picsum.photos/seed/${p._id}/50/50`
                        }
                        className="prod-table__product-img object-fit-cover"
                        alt={p.name}
                      />
                      <div className="prod-table__product-info">
                        <span className="prod-table__product-name d-block text-truncate">
                          {p.name}
                        </span>
                        {p.brand && (
                          <span className="prod-table__product-brand d-block">
                            {p.brand}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="prod-table__cell">{p.category}</td>
                  <td className="prod-table__cell">
                    <span className="prod-table__price-current d-block">
                      ₦{formatCurrency(p.discountPrice || p.price)}
                    </span>
                    {p.discountPrice && (
                      <span className="prod-table__price-old d-block">
                        ₦{formatCurrency(p.price)}
                      </span>
                    )}
                  </td>
                  {(isAdminOrEngineer || isSalesRep) && (
                    <>
                      <td className="prod-table__cell">
                        {canSeeEng && formatEngPrice(p) ? (
                          <span
                            style={{
                              fontSize: "0.84rem",
                              color: "#495057",
                              fontWeight: 500,
                            }}
                          >
                            {formatEngPrice(p)}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#ced4da",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="prod-table__cell">
                        {canSeeEng && marginAmt !== null ? (
                          <span
                            style={{
                              fontSize: "0.84rem",
                              fontWeight: 600,
                              color:
                                marginAmt >= 0 ? "#2b8a3e" : "#e03131",
                            }}
                          >
                            ₦{formatCurrency(marginAmt)}
                            <span
                              style={{
                                fontWeight: 400,
                                color: "#868e96",
                                marginLeft: 4,
                                fontSize: "0.76rem",
                              }}
                            >
                              ({marginPct}%)
                            </span>
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#ced4da",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="prod-table__cell">
                    <span
                      className={`d-inline-flex align-items-center gap-2 prod-table__stock ${getStockTextClass(
                        p.countInStock
                      )}`}
                    >
                      <span
                        className={`prod-table__stock-dot ${getStockDotClass(
                          p.countInStock
                        )}`}
                      />
                      {p.countInStock}
                    </span>
                  </td>
                  <td className="prod-table__cell">
                    {isAssignedToMe(p) ? (
                      <span
                        className="prod-badge"
                        style={{
                          background: "#e6fcf5",
                          color: "#087f5b",
                          border: "1px solid #96f2d7",
                          fontSize: "0.75rem",
                        }}
                      >
                        <Icon
                          icon="lucide:user-check"
                          width={11}
                          style={{ marginRight: 3 }}
                        />
                        You
                      </span>
                    ) : getAssignedRepName(p) ? (
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "#495057",
                        }}
                      >
                        {getAssignedRepName(p)}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#ced4da",
                        }}
                      >
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="prod-table__cell">
                    <div className="d-flex flex-wrap gap-1 prod-table__flags">
                      {parseBool(p.isFeatured) && (
                        <span className="prod-badge prod-flag-badge prod-badge--featured">
                          ★ Featured
                        </span>
                      )}
                      {parseBool(p.isNewArrival) && (
                        <span className="prod-badge prod-flag-badge prod-badge--new">
                          New
                        </span>
                      )}
                      {parseBool(p.isFlashSale) && (
                        <span className="prod-badge prod-flag-badge prod-badge--flash">
                          ⚡ Sale
                        </span>
                      )}
                      {!parseBool(p.isFeatured) &&
                        !parseBool(p.isNewArrival) &&
                        !parseBool(p.isFlashSale) && (
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                          >
                            None
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="prod-table__cell">
                    <div className="d-flex justify-content-end gap-1 prod-table__actions">
                      <button
                        onClick={() => handleEdit(p)}
                        className="prod-table__action-btn prod-table__action-btn--edit"
                        title="Edit"
                      >
                        <Icon icon="lucide:pencil" width={16} />
                      </button>
                      {(isAdminOrEngineer || isSalesRep) && (
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: p._id,
                              name: p.name,
                            })
                          }
                          className="prod-table__action-btn prod-table__action-btn--delete"
                          title="Delete"
                        >
                          <Icon icon="lucide:trash-2" width={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="prod-empty">
            <Icon
              icon="lucide:package"
              width={48}
              className="prod-empty__icon"
            />
            <p className="prod-empty__title">
              {hasAnyFilter
                ? "No products match this filter"
                : "No products found"}
            </p>
            <p className="prod-empty__desc">
              {hasAnyFilter
                ? "Try removing some filters"
                : "Try adjusting your search or add a new product"}
            </p>
            {hasAnyFilter && (
              <button
                onClick={clearAllFilters}
                className="prod-add-btn mt-3"
              >
                <Icon icon="lucide:x-circle" width={16} />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}