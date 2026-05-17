// src/pages/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import "./ProductDetail.css";

// ✅ Helper to safely get all product images as an array
const getProductImages = (p) => {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const valid = p.images.filter((img) => img && img.trim());
    if (valid.length > 0) return valid;
  }
  if (p.image && p.image.trim()) return [p.image];
  return [];
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        setActiveImg(0); // Reset image index on product change
      } catch (err) {
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const getCartQty = () => {
    const item = cart.find((c) => c.product === product?._id);
    return item ? item.quantity : 0;
  };

  const discountPct = () => {
    if (!product?.discountPrice || !product?.price) return 0;
    return Math.round(
      ((product.price - product.discountPrice) / product.price) * 100
    );
  };

  const handleAddToCart = () => {
    if (!product || product.countInStock === 0) return;
    
    // ✅ Get images array for the cart item
    const allImages = getProductImages(product);

    for (let i = 0; i < qty; i++) {
      addToCart({
        _id: product._id,
        name: product.name,
        image: allImages[0] || `https://picsum.photos/seed/${product._id}/300/300`, // ✅ Use primary image from array
        price: product.price,
        discountPrice: product.discountPrice,
        countInStock: product.countInStock,
      });
    }

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const currentPrice = product?.discountPrice && product?.discountPrice < product?.price 
    ? product.discountPrice 
    : product?.price;

  // ✅ Image gallery navigation handlers
  const allImages = product ? getProductImages(product) : [];
  const hasMultipleImages = allImages.length > 1;
  
  // Fallback if no images exist at all
  const images = allImages.length > 0 
    ? allImages 
    : [`https://picsum.photos/seed/${product?._id || 'default'}/600/600`];

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setActiveImg((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImg = (e) => {
    e.stopPropagation();
    setActiveImg((prev) => (prev + 1) % images.length);
  };

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-skeleton pd-skeleton--img" />
        <div className="pd-skeleton-right">
          <div className="pd-skeleton pd-skeleton--title" />
          <div className="pd-skeleton pd-skeleton--text" />
          <div className="pd-skeleton pd-skeleton--price" />
          <div className="pd-skeleton pd-skeleton--btn" />
          <div className="pd-skeleton pd-skeleton--text" />
          <div className="pd-skeleton pd-skeleton--text" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-error">
        <Icon icon="lucide:alert-circle" width={48} />
        <h2>{error || "Product not found"}</h2>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/products" className="pd-error-btn">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <nav className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <Icon icon="lucide:chevron-right" width={14} />
        <Link to="/products">Products</Link>
        <Icon icon="lucide:chevron-right" width={14} />
        {product.category && (
          <>
            <Link to="/products">{product.category}</Link>
            <Icon icon="lucide:chevron-right" width={14} />
          </>
        )}
        <span className="pd-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="pd-container">
        {/* Left: Images */}
        <div className="pd-gallery">
          <div className="pd-gallery-thumbs">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`pd-thumb ${activeImg === idx ? "pd-thumb--active" : ""}`}
                onClick={() => setActiveImg(idx)}
              >
                <img src={img} alt="" />
              </div>
            ))}
          </div>
          <div className="pd-main-img">
            {discountPct() > 0 && (
              <span className="pd-discount-badge">-{discountPct()}%</span>
            )}
            {product.countInStock === 0 && (
              <span className="pd-oos-badge">OUT OF STOCK</span>
            )}
            
            <img src={images[activeImg]} alt={product.name} />

            {/* ✅ NEW: Image Navigation Arrows & Counter */}
            {hasMultipleImages && (
              <>
                <button 
                  className="pd-gallery-nav pd-gallery-nav--prev" 
                  onClick={handlePrevImg} 
                  aria-label="Previous image"
                >
                  <Icon icon="lucide:chevron-left" width={24} />
                </button>
                <button 
                  className="pd-gallery-nav pd-gallery-nav--next" 
                  onClick={handleNextImg} 
                  aria-label="Next image"
                >
                  <Icon icon="lucide:chevron-right" width={24} />
                </button>
                <span className="pd-img-counter">
                  {activeImg + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="pd-info">
          <h1 className="pd-name">{product.name}</h1>

          <div className="pd-brand">
            <Icon icon="lucide:store" width={14} />
            <span>Sold by <strong>MallHub</strong></span>
          </div>

          <div className="pd-rating-row">
            <div className="pd-stars">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  icon="lucide:star"
                  width={16}
                  style={{
                    color: i < 4 ? "#ffc107" : "#ddd",
                    fill: i < 4 ? "#ffc107" : "none",
                  }}
                />
              ))}
            </div>
            <span className="pd-rating-text">(128 ratings, 54 reviews)</span>
          </div>

          <div className="pd-price-block">
            <span className="pd-price">₦{currentPrice?.toLocaleString()}</span>
            {product.discountPrice && product.price && product.discountPrice < product.price && (
              <>
                <span className="pd-old-price">
                  ₦{product.price.toLocaleString()}
                </span>
                <span className="pd-save-badge">
                  Save ₦{(product.price - product.discountPrice).toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* Flash sale bar if discounted */}
          {product.discountPrice && product.price && product.discountPrice < product.price && (
            <div className="pd-flash-bar">
              <span className="pd-flash-bar__label">Flash Deal</span>
              <div className="pd-flash-bar__track">
                <div
                  className="pd-flash-bar__fill"
                  style={{ width: `${100 - discountPct()}%` }}
                />
              </div>
              <span className="pd-flash-bar__pct">{discountPct()}% OFF</span>
            </div>
          )}

          {/* Quantity + Add to Cart (Desktop & Mobile Sticky) */}
          <div className="pd-actions">
            <div className="pd-qty-control">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="pd-qty-btn"
              >
                <Icon icon="lucide:minus" width={16} />
              </button>
              <span className="pd-qty-num">{qty}</span>
              <button
                onClick={() =>
                  setQty((q) => Math.min(product.countInStock || 10, q + 1))
                }
                disabled={qty >= (product.countInStock || 10)}
                className="pd-qty-btn"
              >
                <Icon icon="lucide:plus" width={16} />
              </button>
            </div>

            <button
              className={`pd-add-btn ${
                addedFeedback ? "pd-add-btn--added" : ""
              } ${product.countInStock === 0 ? "pd-add-btn--disabled" : ""}`}
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
            >
              {addedFeedback ? (
                <>
                  <Icon icon="lucide:check" width={18} />
                  Added!
                </>
              ) : product.countInStock === 0 ? (
                <>
                  <Icon icon="lucide:x" width={18} />
                  Out of Stock
                </>
              ) : (
                <>
                  <Icon icon="lucide:shopping-cart" width={18} />
                  {getCartQty() > 0
                    ? `Add More (${getCartQty()} in cart)`
                    : "Add to Cart"}
                </>
              )}
            </button>
          </div>

          {getCartQty() > 0 && (
            <Link to="/cart" className="pd-go-cart">
              <Icon icon="lucide:shopping-bag" width={16} />
              View Cart ({getCartQty()} items) — ₦
              {(currentPrice * getCartQty()).toLocaleString()}
            </Link>
          )}

          {/* Delivery info */}
          <div className="pd-delivery-info">
            <div className="pd-delivery-row">
              <Icon icon="lucide:truck" width={18} />
              <div>
                <p className="pd-delivery-label">Delivery</p>
                <p className="pd-delivery-text">
                  Free delivery on orders over ₦15,000. Otherwise ₦2,500.
                </p>
              </div>
            </div>
            <div className="pd-delivery-row">
              <Icon icon="lucide:rotate-ccw" width={18} />
              <div>
                <p className="pd-delivery-label">Returns</p>
                <p className="pd-delivery-text">
                  Free return within 30 days if item is defective.
                </p>
              </div>
            </div>
            <div className="pd-delivery-row">
              <Icon icon="lucide:shield-check" width={18} />
              <div>
                <p className="pd-delivery-label">Guarantee</p>
                <p className="pd-delivery-text">
                  100% authentic product with manufacturer warranty.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pd-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ NEW: Scoped CSS for Image Gallery Navigation */}
      <style>{`
        .pd-main-img {
          position: relative;
        }

        .pd-gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
          opacity: 0;
          transition: opacity 0.2s ease, background 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          color: #343a40;
        }

        .pd-main-img:hover .pd-gallery-nav {
          opacity: 1;
        }

        /* Always show on touch devices */
        @media (hover: none) and (pointer: coarse) {
          .pd-gallery-nav {
            opacity: 0.85;
          }
        }

        .pd-gallery-nav:hover {
          background: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .pd-gallery-nav:active {
          transform: translateY(-50%) scale(0.93);
        }

        .pd-gallery-nav--prev {
          left: 12px;
        }

        .pd-gallery-nav--next {
          right: 12px;
        }

        .pd-img-counter {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          z-index: 3;
          letter-spacing: 0.5px;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
}