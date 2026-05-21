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

  const isAdminOrEngineer =
    user?.role === "admin" ||
    user?.role === "engineer";

  const isSalesRep =
    user?.role === "sales_rep";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [deleteConfirm, setDeleteConfirm] =
    useState({
      id: null,
      name: "",
    });

  const [form, setForm] =
    useState(EMPTY_FORM);

  const filterCategory =
    searchParams.get("category") || "";

  const filterFlash =
    searchParams.get("flash") === "true";

  const filterFeatured =
    searchParams.get("featured") === "true";

  const filterNew =
    searchParams.get("new") === "true";

  const filterDiscounted =
    searchParams.get("discounted") === "true";

  const filterOfficial =
    searchParams.get("official") === "true";

  const filterSub =
    searchParams.get("sub") || "";

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
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const parseBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val === 1;
    if (typeof val === "string") {
      return val === "true" || val === "1";
    }
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

  const canEditProductPrices = useCallback(
    () => {
      if (!user) return false;

      return (
        isAdminOrEngineer || isSalesRep
      );
    },
    [user, isAdminOrEngineer, isSalesRep]
  );

  const showMessage = (type, text) => {
    setMessage({ type, text });

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setMessage({
        type: "",
        text: "",
      });
    }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const [prodRes, catRes] =
        await Promise.all([
          api.get("/products/admin/all"),
          api.get("/categories"),
        ]);

      setProducts(prodRes.data);

      setCategories(
        catRes.data.categories ||
          catRes.data
      );
    } catch (error) {
      showMessage(
        "error",
        "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReps = async () => {
    if (
      !isAdminOrEngineer &&
      !isSalesRep
    )
      return;

    try {
      const res = await api.get("/users", {
        params: {
          role: "sales_rep",
        },
      });

      const users =
        res.data.users ||
        res.data ||
        [];

      const reps = users.filter(
        (u) => u.role === "sales_rep"
      );

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
      images: prev.images.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateImageField = (
    index,
    value
  ) => {
    setForm((prev) => {
      const updated = [...prev.images];

      updated[index] = value;

      return {
        ...prev,
        images: updated,
      };
    });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;

    if (!files?.length) return;

    setUploadingImage(true);

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append(
        "images",
        files[i]
      );
    }

    try {
      const response = await api.post(
        "/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      const uploadedUrls =
        response.data.urls;

      if (
        Array.isArray(uploadedUrls)
      ) {
        setForm((prev) => ({
          ...prev,
          images: [
            ...prev.images.filter(
              (img) =>
                img &&
                img.trim()
            ),
            ...uploadedUrls,
          ],
        }));

        showMessage(
          "success",
          `${uploadedUrls.length} image(s) uploaded`
        );
      }
    } catch (error) {
      showMessage(
        "error",
        error.response?.data
          ?.message ||
          "Upload failed"
      );
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    }
  };

  const getPrimaryImage = (
    product
  ) => {
    if (
      Array.isArray(product.images)
    ) {
      return (
        product.images.find(
          (img) =>
            img &&
            img.trim()
        ) || ""
      );
    }

    return product.image || "";
  };

  const getAssignedRepName = (
    product
  ) => {
    if (
      !product.assignedSalesRep
    )
      return null;

    if (
      typeof product.assignedSalesRep ===
      "object"
    ) {
      return (
        product.assignedSalesRep
          .name ||
        product.assignedSalesRep
          .email
      );
    }

    return null;
  };

  const isAssignedToMe = (
    product
  ) => {
    if (!isSalesRep) return false;

    const assignedId =
      product
        ?.assignedSalesRep?._id?.toString() ||
      (typeof product?.assignedSalesRep ===
      "string"
        ? product.assignedSalesRep.toString()
        : null);

    return (
      assignedId &&
      assignedId ===
        user._id.toString()
    );
  };

  const handleEdit = (product) => {
    let images = [""];

    if (
      Array.isArray(product.images) &&
      product.images.length
    ) {
      images = [...product.images];
    } else if (product.image) {
      images = [product.image];
    }

    setForm({
      name: product.name || "",
      description:
        product.description || "",
      price:
        product.price?.toString() ||
        "",
      discountPrice:
        product.discountPrice?.toString() ||
        "",
      engineeringPrice:
        product.engineeringPrice?.toString() ||
        "",
      category:
        product.category || "",
      images,
      countInStock:
        product.countInStock?.toString() ||
        "",
      brand:
        product.brand || "",
      sku: product.sku || "",
      isFeatured: parseBool(
        product.isFeatured
      ),
      isNewArrival: parseBool(
        product.isNewArrival
      ),
      isFlashSale: parseBool(
        product.isFlashSale
      ),
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
      const cleanedImages =
        form.images.filter(
          (img) =>
            img &&
            img.trim()
        );

      const payload = {
        ...form,
        images: cleanedImages,
        price: parsePrice(
          form.price
        ),
        discountPrice:
          form.discountPrice
            ? parsePrice(
                form.discountPrice
              )
            : null,
        engineeringPrice:
          form.engineeringPrice
            ? parsePrice(
                form.engineeringPrice
              )
            : null,
        countInStock:
          parseInt(
            form.countInStock
          ) || 0,
      };

      if (
        editingProduct
      ) {
        await api.put(
          `/products/${editingProduct._id}`,
          payload
        );

        showMessage(
          "success",
          "Product updated"
        );
      } else {
        await api.post(
          "/products",
          payload
        );

        showMessage(
          "success",
          "Product created"
        );
      }

      resetForm();

      fetchData();
    } catch (error) {
      showMessage(
        "error",
        error.response?.data
          ?.message ||
          "Failed to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);

    try {
      await api.delete(
        `/products/${deleteConfirm.id}`
      );

      showMessage(
        "success",
        "Product deleted"
      );

      setDeleteConfirm({
        id: null,
        name: "",
      });

      fetchData();
    } catch (error) {
      showMessage(
        "error",
        "Delete failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q =
        searchTerm.toLowerCase();

      const matchesSearch =
        !q ||
        p.name
          ?.toLowerCase()
          .includes(q) ||
        p.category
          ?.toLowerCase()
          .includes(q) ||
        p.brand
          ?.toLowerCase()
          .includes(q);

      if (!matchesSearch)
        return false;

      if (
        filterCategory &&
        p.category !==
          filterCategory
      )
        return false;

      if (
        filterFlash &&
        !parseBool(
          p.isFlashSale
        )
      )
        return false;

      if (
        filterFeatured &&
        !parseBool(
          p.isFeatured
        )
      )
        return false;

      if (
        filterNew &&
        !parseBool(
          p.isNewArrival
        )
      )
        return false;

      if (
        filterDiscounted &&
        !(
          p.discountPrice &&
          p.price
        )
      )
        return false;

      return true;
    });
  }, [
    products,
    searchTerm,
    filterCategory,
    filterFlash,
    filterFeatured,
    filterNew,
    filterDiscounted,
  ]);

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

  return (
    <div className="prod-page">
      <Toast message={message} />

      <div className="prod-header">
        <div>
          <h2 className="prod-header__title">
            Products
          </h2>

          <p className="prod-header__count">
            {
              filteredProducts.length
            }{" "}
            Products
          </p>
        </div>

        {(isAdminOrEngineer ||
          isSalesRep) && (
          <button
            className="prod-add-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Icon
              icon="lucide:plus"
              width={18}
            />

            Add Product
          </button>
        )}
      </div>

      <div className="prod-search">
        <Icon
          icon="lucide:search"
          width={18}
          className="prod-search__icon"
        />

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          className="prod-search__input"
        />
      </div>

      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={
          editingProduct
            ? "Edit Product"
            : "Add Product"
        }
      >
        <form
          onSubmit={handleSubmit}
          className="prod-form"
        >
          <div className="row g-3">
            <div className="col-12">
              <label className="prod-form__label">
                Product Name
              </label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-12">
              <label className="prod-form__label">
                Description
              </label>

              <textarea
                required
                rows="4"
                value={
                  form.description
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Category
              </label>

              <select
                value={
                  form.category
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
                className="form-select"
              >
                <option value="">
                  Select
                </option>

                {categories.map(
                  (cat) => (
                    <option
                      key={cat._id}
                      value={cat.name}
                    >
                      {cat.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Brand
              </label>

              <input
                value={form.brand}
                onChange={(e) =>
                  setForm({
                    ...form,
                    brand:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Selling Price
              </label>

              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Discount Price
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  form.discountPrice
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountPrice:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Engineering Price
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  form.engineeringPrice
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    engineeringPrice:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="prod-form__label">
                Stock
              </label>

              <input
                type="number"
                value={
                  form.countInStock
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    countInStock:
                      e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="prod-form__label">
                  Images
                </label>

                <div className="d-flex gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={
                      handleImageUpload
                    }
                    style={{
                      display: "none",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="prod-form__add-img-btn"
                  >
                    Upload
                  </button>

                  <button
                    type="button"
                    onClick={
                      addImageField
                    }
                    className="prod-form__add-img-btn"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {form.images.map(
                (img, index) => (
                  <div
                    key={index}
                    className="d-flex gap-2 mb-2"
                  >
                    <input
                      value={img}
                      onChange={(e) =>
                        updateImageField(
                          index,
                          e.target.value
                        )
                      }
                      className="form-control"
                    />

                    {form.images
                      .length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeImageField(
                            index
                          )
                        }
                        className="btn btn-danger"
                      >
                        X
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            <div className="col-12 d-flex gap-3 flex-wrap">
              <label>
                <input
                  type="checkbox"
                  checked={
                    form.isFeatured
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isFeatured:
                        e.target
                          .checked,
                    })
                  }
                />{" "}
                Featured
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.isNewArrival
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isNewArrival:
                        e.target
                          .checked,
                    })
                  }
                />{" "}
                New
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.isFlashSale
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isFlashSale:
                        e.target
                          .checked,
                    })
                  }
                />{" "}
                Flash Sale
              </label>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-light"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploadingImage
              }
              className="btn btn-dark"
            >
              {saving
                ? "Saving..."
                : editingProduct
                ? "Update"
                : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <DeleteConfirm
        isOpen={
          deleteConfirm.id !==
          null
        }
        onClose={() =>
          setDeleteConfirm({
            id: null,
            name: "",
          })
        }
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Delete "${deleteConfirm.name}"?`}
        loading={saving}
      />

      {/* CONDITIONAL RENDERING FIX */}
      {isMobile ? (
        <div className="d-flex flex-column gap-3">
          {filteredProducts.map(
            (p) => (
              <div
                key={p._id}
                className="prod-mobile-card"
              >
                <img
                  loading="lazy"
                  src={
                    getPrimaryImage(
                      p
                    ) ||
                    `https://picsum.photos/seed/${p._id}/200/200`
                  }
                  alt={p.name}
                  className="prod-mobile-card__img"
                />

                <div className="prod-mobile-card__body">
                  <h3>{p.name}</h3>

                  <p>
                    {p.category}
                  </p>

                  <strong>
                    ₦
                    {formatCurrency(
                      p.discountPrice ||
                        p.price
                    )}
                  </strong>

                  <div className="d-flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        handleEdit(p)
                      }
                      className="btn btn-sm btn-dark"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        setDeleteConfirm(
                          {
                            id: p._id,
                            name: p.name,
                          }
                        )
                      }
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="prod-table-wrap">
          <table className="prod-table">
            <thead>
              <tr>
                <th>
                  Product
                </th>

                <th>
                  Category
                </th>

                <th>
                  Price
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map(
                (p) => (
                  <tr
                    key={p._id}
                  >
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          loading="lazy"
                          src={
                            getPrimaryImage(
                              p
                            ) ||
                            `https://picsum.photos/seed/${p._id}/50/50`
                          }
                          alt={
                            p.name
                          }
                          width="50"
                          height="50"
                          style={{
                            objectFit:
                              "cover",
                            borderRadius:
                              "8px",
                          }}
                        />

                        <span>
                          {p.name}
                        </span>
                      </div>
                    </td>

                    <td>
                      {
                        p.category
                      }
                    </td>

                    <td>
                      ₦
                      {formatCurrency(
                        p.discountPrice ||
                          p.price
                      )}
                    </td>

                    <td>
                      {
                        p.countInStock
                      }
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() =>
                            handleEdit(
                              p
                            )
                          }
                          className="btn btn-sm btn-dark"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            setDeleteConfirm(
                              {
                                id: p._id,
                                name: p.name,
                              }
                            )
                          }
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}