import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import "./Home.css";

const DEFAULT_SLIDES = [
  { bg: "linear-gradient(135deg, #f68b1e 0%, #e8590c 100%)", tag: "MEGA SALE", title: "Up to 70% OFF", sub: "On all electronics & gadgets", price: "Prices from ₦5,000", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80" },
  { bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", tag: "TECH WEEK", title: "Phones & Laptops", sub: "Best deals on top brands", price: "Starting from ₦25,000", img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80" },
  { bg: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)", tag: "NEW ARRIVALS", title: "Laptops & MacBooks", sub: "Latest models in stock", price: "From ₦85,000", img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80" },
  { bg: "linear-gradient(135deg, #00b894 0%, #00cec9 100%)", tag: "EXCLUSIVE", title: "Home Appliances", sub: "Official store prices", price: "From ₦15,000", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80" },
];

const DEFAULT_SIDE_PROMOS = [
  { bg: "linear-gradient(135deg, #1a1a2e, #2d3436)", tag: "Official Store", title: "Apple", price: "From ₦250k", img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&q=80" },
  { bg: "linear-gradient(135deg, #0984e3, #74b9ff)", tag: "Tech Week", title: "Laptops", price: "From ₦85k", img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=80" },
  { bg: "linear-gradient(135deg, #6c5ce7, #a29bfe)", tag: "Premium Build", title: "MacBooks", price: "From ₦450k", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80" },
];

const DEFAULT_SERVICES = [
  { icon: "lucide:truck", label: "Free Delivery", sub: "Orders ₦15k+" },
  { icon: "lucide:rotate-ccw", label: "Free Returns", sub: "Within 30 days" },
  { icon: "lucide:shield-check", label: "Secure Payment", sub: "100% protected" },
  { icon: "lucide:headphones", label: "24/7 Support", sub: "Dedicated help" },
];

const DEFAULT_SEARCHES = [
  { term: "iPhone 15", price: "From ₦450k" }, { term: "Samsung Galaxy", price: "From ₦120k" },
  { term: "AirPods", price: "From ₦35k" }, { term: "PS5", price: "From ₦280k" },
  { term: "Laptop", price: "From ₦85k" }, { term: "MacBook Air", price: "From ₦450k" },
  { term: "Gaming Laptop", price: "From ₦120k" }, { term: "Bluetooth Speaker", price: "From ₦5k" },
  { term: "Smart Watch", price: "From ₦8k" }, { term: "Monitor", price: "From ₦45k" },
  { term: "Power Bank", price: "From ₦3k" }, { term: "USB Cable", price: "From ₦500" },
  { term: "Gaming Chair", price: "From ₦45k" },
];

const DEFAULT_STORES = [
  { name: "Apple", color: "#555", price: "₦250k – ₦1.2M", initial: "A" },
  { name: "Samsung", color: "#1428a0", price: "₦45k – ₦800k", initial: "S" },
  { name: "ASUS", color: "#000000", price: "₦85k – ₦900k", initial: "A" },
  { name: "MSI", color: "#ff0000", price: "₦120k – ₦1.5M", initial: "M" },
  { name: "Sony", color: "#000", price: "₦30k – ₦500k", initial: "S" },
  { name: "LG", color: "#a50034", price: "₦50k – ₦600k", initial: "L" },
  { name: "HP", color: "#0096d6", price: "₦85k – ₦450k", initial: "H" },
  { name: "Dell", color: "#007db8", price: "₦90k – ₦550k", initial: "D" },
  { name: "Lenovo", color: "#e2231a", price: "₦75k – ₦400k", initial: "L" },
  { name: "Oraimo", color: "#f68b1e", price: "₦2k – ₦45k", initial: "O" },
];

const SUBCATEGORY_ICON_MAP = {
  "Smartphones": "lucide:smartphone", "Tablets": "lucide:tablet-smartphone", "Phone Cases": "lucide:shield",
  "Screen Protectors": "lucide:monitor-smartphone", "Chargers & Cables": "lucide:plug-zap", "Power Banks": "lucide:battery-charging",
  "Televisions": "lucide:tv", "Audio & Speakers": "lucide:speaker", "Cameras": "lucide:camera",
  "Wearable Tech": "lucide:watch", "Cables & Adapters": "lucide:cable", "Batteries": "lucide:battery-full",
  "MacBooks": "lucide:laptop", "Gaming Laptops": "lucide:gamepad-2", "Workstations": "lucide:monitor",
  "Mini PCs": "lucide:cpu", "Laptop Bags": "lucide:briefcase", "Laptop Stands": "lucide:monitor-up",
  "Furniture": "lucide:sofa", "Kitchen & Dining": "lucide:utensils-crossed", "Storage & Organization": "lucide:archive",
  "Office Supplies": "lucide:pen-tool", "Lighting": "lucide:lamp", "Home Decor": "lucide:flower-2",
  "Kitchen Appliances": "lucide:cooking-pot", "Laundry": "lucide:washing-machine", "Cooling & Heating": "lucide:fan",
  "Small Appliances": "lucide:blender", "Generators": "lucide:zap", "Air Conditioners": "lucide:snowflake",
  "Skincare": "lucide:droplets", "Hair Care": "lucide:scissors", "Makeup": "lucide:palette",
  "Fragrances": "lucide:flask-conical", "Personal Care": "lucide:heart-pulse", "Health Devices": "lucide:activity",
  "Food Cupboard": "lucide:package", "Beverages": "lucide:cup-soda", "Snacks": "lucide:cookie",
  "Cooking Essentials": "lucide:flame", "Household Cleaning": "lucide:spray-can", "Baby Food": "lucide:milk",
  "Laptops": "lucide:laptop", "Desktops": "lucide:monitor", "Monitors": "lucide:monitor",
  "Networking": "lucide:wifi", "Storage Devices": "lucide:hard-drive", "Accessories": "lucide:mouse",
  "Diapers & Wipes": "lucide:cloud", "Baby Care": "lucide:baby", "Toys": "lucide:gamepad-2",
  "Strollers": "lucide:shopping-cart", "Baby Tech": "lucide:baby",
  "Consoles": "lucide:gamepad-2", "Video Games": "lucide:disc", "Controllers": "lucide:mouse-pointer-2",
  "Gaming Headsets": "lucide:headphones", "Gaming Chairs": "lucide:armchair", "Gaming Accessories": "lucide:cable",
  "Fitness Equipment": "lucide:dumbbell", "Football": "lucide:circle-dot", "Basketball": "lucide:circle",
  "Cycling": "lucide:bike", "Swimming": "lucide:waves", "Outdoor Gear": "lucide:mountain",
  "Car Parts": "lucide:wrench", "Car Electronics": "lucide:cpu", "Car Care": "lucide:droplets",
  "Motorcycle Parts": "lucide:bike", "Tools & Equipment": "lucide:hammer", "Automotive Accessories": "lucide:settings",
};

// ═══════ MOVED OUTSIDE: Pure helper functions ═══════
const parseBool = (val) => {
  if (val === true || val === 1 || val === "true" || val === "1") return true;
  return false;
};

const discountPct = (p) => {
  if (!p.discountPrice || !p.price) return null;
  return Math.round(((p.price - p.discountPrice) / p.price) * 100);
};

const pad = (n) => String(n).padStart(2, "0");

const getSubIcon = (subName) => SUBCATEGORY_ICON_MAP[subName] || "lucide:tag";

const groupByCategory = (list) => {
  const map = {};
  list.forEach((p) => {
    const cat = p.category || "Uncategorized";
    if (!map[cat]) map[cat] = [];
    map[cat].push(p);
  });
  return map;
};

const priceRange = (items, currency) => {
  if (!items.length) return "";
  const prices = items.map((i) => i.price || 0).filter(Boolean);
  if (!prices.length) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${currency}${min.toLocaleString()}` : `${currency}${min.toLocaleString()} – ${currency}${max.toLocaleString()}`;
};

// ═══════ MOVED OUTSIDE: DropdownProductPreview ═══════
const DropdownProductPreview = ({ p, currency, onClose }) => {
  const pct = discountPct(p);
  return (
    <Link to={`/product/${p._id}`} className="jm-mega-product" onClick={onClose}>
      <div className="jm-mega-product__img-wrap">
        <img src={p.image || `https://picsum.photos/seed/mega${p._id}/120/120`} alt={p.name} loading="lazy" />
        {pct && <span className="jm-mega-product__badge">-{pct}%</span>}
      </div>
      <div className="jm-mega-product__info">
        <span className="jm-mega-product__name">{p.name}</span>
        <div className="jm-mega-product__prices">
          <span className="jm-mega-product__price">{currency}{(p.discountPrice || p.price)?.toLocaleString()}</span>
          {p.discountPrice && p.price && (
            <span className="jm-mega-product__old">{currency}{p.price.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ═══════ MOVED OUTSIDE: ProductCard ═══════
const ProductCard = ({ p, prefix = "", showProgress = false, showNew = false, compact = false, flash = false, currency, cartQty, isSyncing, onAddToCart }) => {
  const pct = discountPct(p);
  const itemsLeft = p.countInStock ?? 0;
  const totalStock = p.totalStock ?? p.initialStock ?? null;
  const soldCount = p.soldCount ?? null;
  const soldPct = soldCount != null && totalStock && totalStock > 0
    ? Math.min(100, Math.max(0, Math.round((soldCount / totalStock) * 100)))
    : totalStock != null && totalStock > 0
      ? Math.min(100, Math.max(0, Math.round(((totalStock - itemsLeft) / totalStock) * 100)))
      : 0;
  const isOutOfStock = p.countInStock === 0;
  const isMaxStock = p.countInStock > 0 && cartQty >= p.countInStock;

  return (
    <Link
      to={`/product/${p._id}`}
      className={`jm-product-card ${compact ? "jm-product-card--compact" : ""} ${flash ? "jm-product-card--flash" : ""}`}
      onClick={(e) => {
        if (e.target.closest('.jm-product-card__cart-action')) {
          e.preventDefault();
        }
      }}
    >
      <div className="jm-product-card__img-wrap">
        {pct && <span className="jm-discount-badge" style={flash ? { color: "#fff", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" } : undefined}>-{pct}%</span>}
        {showNew && <span className="jm-new-badge">NEW</span>}
        {isOutOfStock && <span className="jm-oos-badge">OUT OF STOCK</span>}
        <img src={p.image || `https://picsum.photos/seed/${prefix}${p._id}/300/300`} alt={p.name} className="jm-product-card__img" loading="lazy" />
        <div className="jm-product-card__img-overlay" />
      </div>
      <div className="jm-product-card__info">
        <h3 className="jm-product-card__name" style={flash ? { color: "#fff" } : undefined}>{p.name}</h3>
        <div className="jm-product-card__prices">
          <span className="jm-product-card__price" style={flash ? { color: "#fff" } : undefined}>{currency}{(p.discountPrice || p.price)?.toLocaleString()}</span>
          {p.discountPrice && p.price && <span className="jm-product-card__old-price" style={flash ? { color: "rgba(255,255,255,0.55)" } : undefined}>{currency}{p.price.toLocaleString()}</span>}
        </div>
        {p.discountPrice && p.price && (
          <span className="jm-product-card__save" style={flash ? { color: "rgba(255,255,255,0.7)" } : undefined}>You save {currency}{(p.price - p.discountPrice).toLocaleString()}</span>
        )}
        {showProgress && (
          <div className="jm-flash-progress">
            <div className="jm-flash-progress__bar">
              <div className="jm-flash-progress__fill" style={{ width: `${soldPct}%` }} />
            </div>
            <span className="jm-flash-progress__text" style={flash ? { color: "rgba(255,255,255,0.7)" } : undefined}>{itemsLeft} items left</span>
          </div>
        )}
        <div className="jm-product-card__cart-action">
          {isOutOfStock || isMaxStock ? (
            <span className="jm-add-to-cart-btn jm-add-to-cart-btn--disabled">{isMaxStock ? "Max Stock Reached" : "Out of Stock"}</span>
          ) : (
            <button
              className={`jm-add-to-cart-btn ${cartQty > 0 ? "jm-add-to-cart-btn--in-cart" : ""}`}
              style={flash ? { background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" } : undefined}
              onClick={(e) => onAddToCart(e, p)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <><Icon icon="lucide:loader-2" width={14} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</>
              ) : cartQty > 0 ? (
                <><Icon icon="lucide:shopping-cart" width={14} /> In Cart ({cartQty})</>
              ) : (
                <><Icon icon="lucide:plus" width={14} /> Add to Cart</>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

// ═══════ MOVED OUTSIDE: SkeletonCard ═══════
const SkeletonCard = () => (
  <div className="jm-skeleton-card">
    <div className="jm-skeleton jm-skeleton--img" />
    <div className="jm-skeleton jm-skeleton--text" />
    <div className="jm-skeleton jm-skeleton--text jm-skeleton--short" />
    <div className="jm-skeleton jm-skeleton--price" />
  </div>
);

// ═══════ ScrollToTop Component ═══════
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const dashboardContainer = document.getElementById("dashboard-scroll-container");
    if (dashboardContainer) {
      dashboardContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

// ═══════ MAIN HOME COMPONENT ═══════
export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 45, s: 12 });
  const [activeCat, setActiveCat] = useState("");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [mobileCatDrawer, setMobileCatDrawer] = useState(false);
  const [hoveredSidebarCat, setHoveredSidebarCat] = useState(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const catScrollRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileDrawerRef = useRef(null);
  const sidebarRef = useRef(null);

  const { addToCart = () => {}, cart = [], isSyncing = false } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get("search") || "";

  const companyName = siteSettings?.companyName || "MallHub";
  const companyTagline = siteSettings?.companyTagline || "Your One-Stop Online Mall";
  const companyLogo = siteSettings?.logo || "";
  const companyAddress = siteSettings?.address || "";
  const companyPhone = siteSettings?.phone || "";
  const companyPhone2 = siteSettings?.phone2 || "";
  const companyEmail = siteSettings?.email || "";
  const companyWhatsapp = siteSettings?.whatsapp || "";
  const companyFacebook = siteSettings?.facebook || "";
  const companyInstagram = siteSettings?.instagram || "";
  const companyTwitter = siteSettings?.twitter || "";
  const companyTiktok = siteSettings?.tiktok || "";
  const companyYoutube = siteSettings?.youtube || "";
  const currency = siteSettings?.currency || "₦";
  const freeDeliveryThreshold = siteSettings?.freeDeliveryThreshold || 15000;
  const returnDays = siteSettings?.returnDays || 30;
  const supportHours = siteSettings?.supportHours || "24/7";
  const footerText = siteSettings?.footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`;
  const appStoreLink = siteSettings?.appStoreLink || "#";
  const googlePlayLink = siteSettings?.googlePlayLink || "#";
  const aboutUs = siteSettings?.aboutUs || "";

  const heroSlides = siteSettings?.heroSlides?.length > 0 ? siteSettings.heroSlides : DEFAULT_SLIDES;
  const sidePromos = siteSettings?.sidePromos?.length > 0 ? siteSettings.sidePromos : DEFAULT_SIDE_PROMOS;
  const services = siteSettings?.services?.length > 0 ? siteSettings.services : DEFAULT_SERVICES;
  const popularSearches = siteSettings?.popularSearches?.length > 0 ? siteSettings.popularSearches : DEFAULT_SEARCHES;
  const officialStores = siteSettings?.officialStores?.length > 0 ? siteSettings.officialStores : DEFAULT_STORES;

  const sidebarCategories = categories.filter(c => c.showInSidebar !== false);
  const homeCategories = categories.filter(c => c.showInHome !== false);

  const flashSaleProducts = products.filter(p => parseBool(p.isFlashSale));
  const featuredProducts = products.filter(p => parseBool(p.isFeatured));
  const newArrivalProducts = products.filter(p => parseBool(p.isNewArrival));

  const filteredProducts = useMemo(() => {
    if (!activeSearch) return [];
    const q = activeSearch.toLowerCase();
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, activeSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setCatDropdownOpen(false);
      if (mobileDrawerRef.current && !mobileDrawerRef.current.contains(e.target)) setMobileCatDrawer(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setHoveredSidebarCat(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, catRes, setRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
          api.get("/site-settings"),
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data.categories || catRes.data);
        setSiteSettings(setRes.data);
        const cats = groupByCategory(prodRes.data);
        const keys = Object.keys(cats);
        if (keys.length) setActiveCat(keys[0]);
      } catch (error) {
        console.error("Could not fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const productCategories = groupByCategory(products);

  const getCartQty = (productId) => {
    const item = cart.find((c) => c.product === productId || c.product?._id === productId);
    return item ? item.quantity : 0;
  };

  const getCatIcon = (catName) => categories.find(c => c.name === catName)?.icon || "lucide:package";

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    const currentQty = getCartQty(product._id);
    if (product.countInStock > 0 && currentQty >= product.countInStock) return;

    try {
      await addToCart({
        _id: product._id,
        name: product.name,
        image: product.image || `https://picsum.photos/seed/${product._id}/300/300`,
        price: product.discountPrice || product.price,
      }, 1);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  const handleCatSelect = (cat) => {
    setActiveCat(cat);
    setCatDropdownOpen(false);
    setCatSearch("");
    setMobileCatDrawer(false);
  };

  const getSubcategories = (catName) => {
    const found = categories.find(c => c.name === catName);
    if (found?.subcategories?.length > 0) return found.subcategories;
    if (found?.children?.length > 0) return found.children.map(c => c.name || c);
    return null;
  };

  const sidebarItems = sidebarCategories.length > 0
    ? sidebarCategories.map(c => ({ id: c._id, name: c.name, icon: c.icon }))
    : [];

  const filteredCatKeys = Object.keys(productCategories).filter(cat =>
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="jm-home">
      <ScrollToTop />

      {/* ═══════ SEARCH RESULTS VIEW ═══════ */}
      {activeSearch ? (
        <section className="jm-section" style={{ paddingTop: "30px", minHeight: "60vh" }}>
          <div className="jm-section__header">
            <h2 className="jm-section__title">
              Search Results for "{activeSearch}"
            </h2>
            <button
              onClick={() => setSearchParams({})}
              className="jm-section__see-all"
              style={{ background: "none", border: "1px solid #ddd", padding: "6px 16px", borderRadius: "20px", cursor: "pointer" }}
            >
              CLEAR SEARCH
            </button>
          </div>

          {loading ? (
            <div className="jm-product-grid jm-product-grid--4">
              {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="jm-product-grid jm-product-grid--4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  p={p}
                  prefix="search-"
                  currency={currency}
                  cartQty={getCartQty(p._id)}
                  isSyncing={isSyncing}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#868e96" }}>
              <Icon icon="lucide:search-x" width={48} style={{ marginBottom: "16px", opacity: 0.4 }} />
              <h3 style={{ margin: "0 0 8px", color: "#495057" }}>No products found</h3>
              <p style={{ margin: "0 0 20px" }}>We couldn't find any products matching "{activeSearch}"</p>
              <Link to="/" className="jm-hero-cta" style={{ fontSize: "0.85rem", padding: "10px 24px" }} onClick={() => setSearchParams({})}>
                BACK TO SHOPPING
              </Link>
            </div>
          )}
        </section>
      ) : (
      <>
      {/* ═══════ NORMAL HOME PAGE CONTENT ═══════ */}

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="jm-hero-section">
        <div className="jm-hero-sidebar" ref={sidebarRef}>
          <ul className="jm-sidebar-list">
            {sidebarItems.map((cat) => {
              const subs = getSubcategories(cat.name);
              const catProducts = productCategories[cat.name] || [];
              const hasDropdown = subs && subs.length > 0;
              const isHovered = hoveredSidebarCat === cat.id;
              const topProducts = catProducts.slice(0, 4);

              return (
                <li
                  key={cat.id}
                  className={`jm-sidebar-item ${hasDropdown ? "jm-sidebar-item--has-dropdown" : ""}`}
                  onMouseEnter={() => hasDropdown && setHoveredSidebarCat(cat.id)}
                  onMouseLeave={() => setHoveredSidebarCat(null)}
                >
                  <Link to={`/products?category=${cat.name}`} className="jm-sidebar-item__link">
                    <Icon icon={cat.icon || "lucide:chevron-right"} width={14} className="jm-sidebar-item__icon" />
                    <span className="jm-sidebar-item__text">{cat.name}</span>
                    {hasDropdown && <Icon icon="lucide:chevron-right" width={12} className="jm-sidebar-item__expand-icon" />}
                  </Link>

                  {hasDropdown && (
                    <div className={`jm-sidebar-dropdown ${isHovered ? "jm-sidebar-dropdown--open" : ""} ${topProducts.length > 0 ? "jm-sidebar-dropdown--has-products" : ""}`}>
                      <div className="jm-sidebar-dropdown__arrow" />
                      <div className="jm-sidebar-dropdown__panel">
                        <div className="jm-sidebar-dropdown__head">
                          <div className="jm-sidebar-dropdown__head-left">
                            <div className="jm-sidebar-dropdown__head-icon">
                              <Icon icon={cat.icon || getCatIcon(cat.name)} width={16} />
                            </div>
                            <div>
                              <span className="jm-sidebar-dropdown__title">{cat.name}</span>
                              <span className="jm-sidebar-dropdown__count">{catProducts.length} products</span>
                            </div>
                          </div>
                          <Link to={`/products?category=${cat.name}`} className="jm-sidebar-dropdown__viewall" onClick={() => setHoveredSidebarCat(null)}>
                            View All <Icon icon="lucide:arrow-right" width={12} />
                          </Link>
                        </div>

                        <div className="jm-sidebar-dropdown__body">
                          <div className="jm-sidebar-dropdown__subs-col">
                            <div className="jm-sidebar-dropdown__subs-label">Subcategories</div>
                            <div className="jm-sidebar-dropdown__grid">
                              {subs.map((sub, subIdx) => (
                                <Link
                                  key={subIdx}
                                  to={`/products?category=${cat.name}&sub=${encodeURIComponent(sub)}`}
                                  className="jm-sidebar-dropdown__item"
                                  onClick={() => setHoveredSidebarCat(null)}
                                >
                                  <div className="jm-sidebar-dropdown__item-icon">
                                    <Icon icon={getSubIcon(sub)} width={14} />
                                  </div>
                                  <span className="jm-sidebar-dropdown__item-text">{sub}</span>
                                  <Icon icon="lucide:chevron-right" width={12} className="jm-sidebar-dropdown__item-arrow" />
                                </Link>
                              ))}
                            </div>
                          </div>

                          {topProducts.length > 0 && (
                            <div className="jm-sidebar-dropdown__products-col">
                              <div className="jm-sidebar-dropdown__products-label">
                                <Icon icon="lucide:sparkles" width={12} />
                                Top picks
                              </div>
                              <div className="jm-sidebar-dropdown__products-list">
                                {topProducts.map((p) => (
                                  <DropdownProductPreview key={p._id} p={p} currency={currency} onClose={() => setHoveredSidebarCat(null)} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {catProducts.length > 0 && (
                          <div className="jm-sidebar-dropdown__foot">
                            <div className="jm-sidebar-dropdown__foot-info">
                              <Icon icon="lucide:tag" width={12} />
                              <span>Starting from {priceRange(catProducts, currency)}</span>
                            </div>
                            <Link to={`/products?category=${cat.name}`} className="jm-sidebar-dropdown__foot-link" onClick={() => setHoveredSidebarCat(null)}>
                              Browse all <Icon icon="lucide:external-link" width={11} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="jm-hero-carousel">
          {heroSlides.map((slide, idx) => (
            <div key={idx} className="jm-hero-slide" style={{ opacity: idx === currentSlide ? 1 : 0, zIndex: idx === currentSlide ? 1 : 0 }}>
              <div className="jm-hero-slide__bg" style={{ background: slide.bg }} />
              {slide.img && <img src={slide.img} alt="" className="jm-hero-slide__img" loading={idx === 0 ? "eager" : "lazy"} />}
              <div className="jm-hero-slide__overlay" />
              <div className="jm-hero-slide__content">
                {slide.tag && <span className="jm-hero-tag">{slide.tag}</span>}
                <h1 className="jm-hero-title">{slide.title}</h1>
                {slide.sub && <p className="jm-hero-sub">{slide.sub}</p>}
                {slide.price && <p className="jm-hero-price">{slide.price}</p>}
                <Link to={slide.link || "/products"} className="jm-hero-cta">SHOP NOW <Icon icon="lucide:arrow-right" width={16} className="jm-hero-cta__arrow" /></Link>
              </div>
            </div>
          ))}
          <button className="jm-carousel-arrow jm-carousel-arrow--prev" onClick={() => setCurrentSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous"><Icon icon="lucide:chevron-left" width={24} /></button>
          <button className="jm-carousel-arrow jm-carousel-arrow--next" onClick={() => setCurrentSlide((p) => (p + 1) % heroSlides.length)} aria-label="Next"><Icon icon="lucide:chevron-right" width={24} /></button>
          <div className="jm-carousel-dots">
            {heroSlides.map((_, idx) => (
              <button key={idx} className={`jm-carousel-dot ${idx === currentSlide ? "jm-carousel-dot--active" : ""}`} onClick={() => setCurrentSlide(idx)} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </div>

        <div className="jm-hero-stack">
          {sidePromos.map((promo, idx) => (
            <Link to={promo.link || "/products"} key={idx} className="jm-side-promo" style={{ background: promo.bg }}>
              <div className="jm-side-promo__content">
                {promo.tag && <span className="jm-side-promo__tag">{promo.tag}</span>}
                <span className="jm-side-promo__title">{promo.title}</span>
                <span className="jm-side-promo__price">{promo.price}</span>
              </div>
              {promo.img && <img src={promo.img} alt="" className="jm-side-promo__img" />}
            </Link>
          ))}
        </div>
      </section>

      {/* Mobile category trigger */}
      <div className="jm-mobile-cat-trigger-wrap">
        <button className="jm-mobile-cat-trigger" onClick={() => setMobileCatDrawer(true)}>
          <Icon icon="lucide:layout-grid" width={18} />
          <span>Browse Categories</span>
          <Icon icon="lucide:chevron-right" width={16} />
        </button>
      </div>

      {mobileCatDrawer && <div className="jm-mobile-cat-overlay" onClick={() => setMobileCatDrawer(false)} />}

      <div ref={mobileDrawerRef} className={`jm-mobile-cat-drawer ${mobileCatDrawer ? "jm-mobile-cat-drawer--open" : ""}`}>
        <div className="jm-mobile-cat-drawer__header">
          <h3>Categories</h3>
          <button className="jm-mobile-cat-drawer__close" onClick={() => setMobileCatDrawer(false)}><Icon icon="lucide:x" width={20} /></button>
        </div>
        <div className="jm-mobile-cat-drawer__search">
          <Icon icon="lucide:search" width={16} />
          <input type="text" placeholder="Search categories..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
        </div>
        <ul className="jm-mobile-cat-drawer__list">
          {sidebarItems.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map((cat) => {
            const subs = getSubcategories(cat.name);
            const catProducts = productCategories[cat.name] || [];
            const isExpanded = mobileExpandedCat === cat.id;
            const previewProducts = catProducts.slice(0, 3);

            return (
              <li key={cat.id} className="jm-mobile-cat-drawer__item">
                <div className="jm-mobile-cat-drawer__item-header">
                  <Link to={`/products?category=${cat.name}`} onClick={() => setMobileCatDrawer(false)}>
                    <Icon icon={cat.icon || "lucide:chevron-right"} width={16} />
                    <span>{cat.name}</span>
                    {catProducts.length > 0 && <span className="jm-mobile-cat-drawer__badge">{catProducts.length}</span>}
                  </Link>
                  {subs && subs.length > 0 && (
                    <button className="jm-mobile-cat-drawer__expand" onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)} aria-expanded={isExpanded}>
                      <Icon icon="lucide:chevron-down" width={16} />
                    </button>
                  )}
                </div>

                {subs && subs.length > 0 && (
                  <div className={`jm-mobile-cat-drawer__expandable ${isExpanded ? "jm-mobile-cat-drawer__expandable--open" : ""}`}>
                    <div className="jm-mobile-cat-drawer__subs">
                      {subs.map((sub, subIdx) => (
                        <Link to={`/products?category=${cat.name}&sub=${encodeURIComponent(sub)}`} key={subIdx} className="jm-mobile-cat-drawer__sub" onClick={() => setMobileCatDrawer(false)}>
                          <Icon icon={getSubIcon(sub)} width={14} />
                          <span>{sub}</span>
                        </Link>
                      ))}
                    </div>

                    {previewProducts.length > 0 && (
                      <div className="jm-mobile-cat-drawer__products">
                        <div className="jm-mobile-cat-drawer__products-label">Popular in {cat.name}</div>
                        <div className="jm-mobile-cat-drawer__products-list">
                          {previewProducts.map((p) => (
                            <Link to={`/product/${p._id}`} key={p._id} className="jm-mobile-cat-drawer__product" onClick={() => setMobileCatDrawer(false)}>
                              <img src={p.image || `https://picsum.photos/seed/mob${p._id}/100/100`} alt={p.name} />
                              <div className="jm-mobile-cat-drawer__product-info">
                                <span className="jm-mobile-cat-drawer__product-name">{p.name}</span>
                                <span className="jm-mobile-cat-drawer__product-price">{currency}{(p.discountPrice || p.price)?.toLocaleString()}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <Link to={`/products?category=${cat.name}`} className="jm-mobile-cat-drawer__products-seeall" onClick={() => setMobileCatDrawer(false)}>
                          See all {catProducts.length} products <Icon icon="lucide:arrow-right" width={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {sidebarItems.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
            <li className="jm-mobile-cat-drawer__empty">No categories found</li>
          )}
        </ul>
      </div>

      {/* Mobile side promos */}
      <div className="jm-mobile-side-promos">
        {sidePromos.slice(0, 3).map((promo, idx) => (
          <Link to={promo.link || "/products"} key={idx} className="jm-mobile-side-card" style={{ background: promo.bg }}>
            <span className="jm-mobile-side-card__title">{promo.title}</span>
            <span className="jm-mobile-side-card__price">{promo.price}</span>
          </Link>
        ))}
      </div>

      {/* ═══════ SERVICES BAR ═══════ */}
      <section className="jm-services-bar">
        {services.map((s, idx) => (
          <div key={idx} className="jm-service-item">
            <div className="jm-service-item__icon"><Icon icon={s.icon} width={20} /></div>
            <div className="jm-service-item__text">
              <p className="jm-service-item__label">{s.label}</p>
              <p className="jm-service-item__sub">
                {s.label === "Free Delivery" ? `Orders ${currency}${freeDeliveryThreshold.toLocaleString()}+` :
                 s.label === "Free Returns" ? `Within ${returnDays} days` :
                 s.label === "24/7 Support" ? supportHours : s.sub}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══════ CATEGORY ICONS ═══════ */}
      <section className="jm-section">
        <div className="jm-section__header">
          <h2 className="jm-section__title">CATEGORIES</h2>
          <Link to="/products" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
        </div>
        <div className="jm-category-row">
          {homeCategories.length > 0 ? homeCategories.map((cat) => {
            const catProducts = productCategories[cat.name] || [];
            return (
              <Link to={`/products?category=${cat.name}`} key={cat._id} className="jm-category-icon">
                <div className="jm-category-icon__circle">
                  {cat.image ? <img src={cat.image} alt={cat.name} className="jm-category-icon__img" /> : <Icon icon={cat.icon || "lucide:package"} width={26} />}
                </div>
                <span className="jm-category-icon__name">{cat.name}</span>
                {catProducts.length > 0 && <span className="jm-category-icon__price">{priceRange(catProducts, currency)}</span>}
              </Link>
            );
          }) : [
            { name: "Phones", icon: "lucide:smartphone" }, { name: "Laptops", icon: "lucide:laptop" },
            { name: "MacBooks", icon: "lucide:monitor" }, { name: "Home", icon: "lucide:sofa" },
            { name: "Appliances", icon: "lucide:refrigerator" }, { name: "Audio", icon: "lucide:speaker" },
            { name: "Gaming", icon: "lucide:gamepad-2" }, { name: "Health", icon: "lucide:heart-pulse" },
            { name: "Computing", icon: "lucide:cpu" }, { name: "Accessories", icon: "lucide:headphones" },
          ].map((cat) => (
            <Link to="/products" key={cat.name} className="jm-category-icon">
              <div className="jm-category-icon__circle"><Icon icon={cat.icon} width={26} /></div>
              <span className="jm-category-icon__name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ FLASH SALES ═══════ */}
      {!loading && flashSaleProducts.length > 0 && (
        <section className="jm-section jm-flash-section">
          <div className="jm-flash-header">
            <div className="jm-flash-header__left">
              <div className="jm-flash-header__icon-wrap"><Icon icon="lucide:zap" width={22} /></div>
              <div>
                <h2 className="jm-flash-header__title">FLASH SALES</h2>
                <div className="jm-flash-countdown">
                  <span className="jm-countdown-block">{pad(timeLeft.h)}</span><span className="jm-countdown-sep">:</span>
                  <span className="jm-countdown-block">{pad(timeLeft.m)}</span><span className="jm-countdown-sep">:</span>
                  <span className="jm-countdown-block">{pad(timeLeft.s)}</span>
                </div>
              </div>
            </div>
            <Link to="/products?flash=true" className="jm-section__see-all jm-section__see-all--light">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--5">
            {flashSaleProducts.slice(0, 10).map((p) => (
              <ProductCard key={p._id} p={p} prefix="flash-" showProgress flash currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ OFFICIAL STORES ═══════ */}
      <section className="jm-section">
        <div className="jm-section__header">
          <h2 className="jm-section__title">OFFICIAL STORES</h2>
          <Link to="/products?official=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
        </div>
        <div className="jm-stores-scroll">
          {officialStores.map((brand, idx) => (
            <div key={idx} className="jm-store-card">
              <div className="jm-store-card__logo" style={{ background: `${brand.color}15`, color: brand.color }}>
                {brand.image ? <img src={brand.image} alt={brand.name} className="jm-store-card__logo-img" /> : brand.initial}
              </div>
              <span className="jm-store-card__name">{brand.name}</span>
              <span className="jm-store-card__price">{brand.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PROMO BANNERS ═══════ */}
      <section className="jm-promo-grid">
        <div className="jm-promo-banner">
          <img src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80" alt="" className="jm-promo-banner__img" />
          <div className="jm-promo-banner__overlay" />
          <div className="jm-promo-banner__content">
            <span className="jm-promo-banner__tag">Flagship Phones</span>
            <h3 className="jm-promo-banner__title">Latest iPhones</h3>
            <p className="jm-promo-banner__sub">Starting from {currency}450,000</p>
            <span className="jm-promo-banner__cta">SHOP IPHONES</span>
          </div>
        </div>
        <div className="jm-promo-banner">
          <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80" alt="" className="jm-promo-banner__img" />
          <div className="jm-promo-banner__overlay" />
          <div className="jm-promo-banner__content">
            <span className="jm-promo-banner__tag">Android Deals</span>
            <h3 className="jm-promo-banner__title">Samsung & More</h3>
            <p className="jm-promo-banner__sub">Up to 30% off — {currency}120,000 onwards</p>
            <span className="jm-promo-banner__cta jm-promo-banner__cta--white">UP TO 30% OFF</span>
          </div>
        </div>
      </section>

      {/* ═══════ TOP DEALS ═══════ */}
      {!loading && featuredProducts.length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <h2 className="jm-section__title">TOP DEALS FOR YOU</h2>
            <Link to="/products?featured=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--6">
            {featuredProducts.slice(0, 6).map((p) => (
              <ProductCard key={`deal-${p._id}`} p={p} prefix="deal-" compact currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ PRODUCT CATALOGUE WITH DROPDOWN ═══════ */}
      {!loading && Object.keys(productCategories).length > 0 && (
        <section className="jm-catalogue-section">
          <div className="jm-section">
            <div className="jm-section__header">
              <div className="jm-section__header-left">
                <Icon icon="lucide:layout-grid" width={18} className="jm-section__header-icon" />
                <h2 className="jm-section__title">PRODUCT CATALOGUE</h2>
              </div>
            </div>
            <div className="jm-cat-tabs" ref={catScrollRef}>
              {Object.keys(productCategories).map((cat) => (
                <button key={cat} className={`jm-cat-tab ${activeCat === cat ? "jm-cat-tab--active" : ""}`} onClick={() => handleCatSelect(cat)}>
                  {cat}<span className="jm-cat-tab__count">({productCategories[cat].length})</span>
                </button>
              ))}
            </div>
            <div className="jm-cat-dropdown-wrap" ref={dropdownRef}>
              <button className="jm-cat-dropdown-trigger" onClick={() => { setCatDropdownOpen(!catDropdownOpen); setCatSearch(""); }} aria-expanded={catDropdownOpen} aria-haspopup="listbox">
                <div className="jm-cat-dropdown-trigger__left">
                  <div className="jm-cat-dropdown-trigger__icon"><Icon icon={getCatIcon(activeCat)} width={18} /></div>
                  <div className="jm-cat-dropdown-trigger__text">
                    <span className="jm-cat-dropdown-trigger__label">{activeCat}</span>
                    <span className="jm-cat-dropdown-trigger__meta">{productCategories[activeCat]?.length || 0} products · {priceRange(productCategories[activeCat] || [], currency)}</span>
                  </div>
                </div>
                <Icon icon="lucide:chevron-down" width={18} className={`jm-cat-dropdown-trigger__arrow ${catDropdownOpen ? "jm-cat-dropdown-trigger__arrow--open" : ""}`} />
              </button>
              <div className={`jm-cat-dropdown-menu ${catDropdownOpen ? "jm-cat-dropdown-menu--open" : ""}`} role="listbox">
                <div className="jm-cat-dropdown-menu__search">
                  <Icon icon="lucide:search" width={16} />
                  <input type="text" placeholder="Search categories..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} autoFocus={catDropdownOpen} />
                  {catSearch && <button className="jm-cat-dropdown-menu__clear" onClick={() => setCatSearch("")}><Icon icon="lucide:x" width={14} /></button>}
                </div>
                <div className="jm-cat-dropdown-menu__list">
                  {filteredCatKeys.length > 0 ? filteredCatKeys.map((cat) => (
                    <button key={cat} className={`jm-cat-dropdown-menu__item ${activeCat === cat ? "jm-cat-dropdown-menu__item--active" : ""}`} onClick={() => handleCatSelect(cat)} role="option" aria-selected={activeCat === cat}>
                      <div className="jm-cat-dropdown-menu__item-left"><Icon icon={getCatIcon(cat)} width={16} /><span>{cat}</span></div>
                      <div className="jm-cat-dropdown-menu__item-right">
                        <span className="jm-cat-dropdown-menu__item-range">{priceRange(productCategories[cat], currency)}</span>
                        <span className="jm-cat-dropdown-menu__item-count">{productCategories[cat].length}</span>
                        {activeCat === cat && <Icon icon="lucide:check" width={14} className="jm-cat-dropdown-menu__item-check" />}
                      </div>
                    </button>
                  )) : (
                    <div className="jm-cat-dropdown-menu__empty"><Icon icon="lucide:search-x" width={32} /><p>No categories found</p></div>
                  )}
                </div>
                <div className="jm-cat-dropdown-menu__footer">
                  <Link to="/products" className="jm-cat-dropdown-menu__viewall" onClick={() => setCatDropdownOpen(false)}><Icon icon="lucide:grid-3x3" width={14} /> View All Products</Link>
                </div>
              </div>
            </div>
          </div>
          {activeCat && productCategories[activeCat] && (
            <div className="jm-section jm-catalogue-products">
              <div className="jm-section__header">
                <div className="jm-section__header-left">
                  <div className="jm-section__cat-icon"><Icon icon={getCatIcon(activeCat)} width={16} /></div>
                  <div>
                    <h3 className="jm-section__subtitle">{activeCat}</h3>
                    <p className="jm-section__meta">{productCategories[activeCat].length} products · {priceRange(productCategories[activeCat], currency)}</p>
                  </div>
                </div>
                <Link to={`/products?category=${activeCat}`} className="jm-section__see-all">VIEW ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
              </div>
              <div className="jm-product-grid jm-product-grid--4">
                {productCategories[activeCat].slice(0, 8).map((p) => (
                  <ProductCard key={`cat-${p._id}`} p={p} prefix={`cat-${activeCat}-`} currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════ NEW ARRIVALS ═══════ */}
      {!loading && newArrivalProducts.length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <div className="jm-section__header-left">
              <span className="jm-section__dot" />
              <h2 className="jm-section__title">NEW ARRIVALS</h2>
            </div>
            <Link to="/products?new=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--5">
            {newArrivalProducts.slice(0, 10).map((p) => (
              <ProductCard key={`new-${p._id}`} p={p} prefix="new-" showNew currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ BIGGEST PRICE DROPS ═══════ */}
      {!loading && products.filter((p) => p.discountPrice && p.price).length > 0 && (
        <section className="jm-section">
          <div className="jm-section__header">
            <div className="jm-section__header-left">
              <Icon icon="lucide:trending-down" width={18} className="jm-section__header-icon--red" />
              <h2 className="jm-section__title">BIGGEST PRICE DROPS</h2>
            </div>
            <Link to="/products?discounted=true" className="jm-section__see-all">SEE ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-price-drop-grid">
            {products.filter((p) => p.discountPrice && p.price).sort((a, b) => ((b.price - b.discountPrice) / b.price) - ((a.price - a.discountPrice) / a.price)).slice(0, 6).map((p) => {
              const pct = discountPct(p);
              const saved = p.price - p.discountPrice;
              return (
                <Link to={`/product/${p._id}`} key={`drop-${p._id}`} className="jm-price-drop-card">
                  <div className="jm-price-drop-card__img-wrap">
                    <span className="jm-price-drop-card__badge">-{pct}%</span>
                    <img src={p.image || `https://picsum.photos/seed/drop${p._id}/150/150`} alt={p.name} loading="lazy" />
                  </div>
                  <div className="jm-price-drop-card__info">
                    <h4 className="jm-price-drop-card__name">{p.name}</h4>
                    <div className="jm-price-drop-card__prices">
                      <span className="jm-price-drop-card__price">{currency}{p.discountPrice.toLocaleString()}</span>
                      <span className="jm-price-drop-card__old">{currency}{p.price.toLocaleString()}</span>
                    </div>
                    <span className="jm-price-drop-card__save">Save {currency}{saved.toLocaleString()}</span>
                    <div className="jm-price-drop-card__bar-wrap">
                      <div className="jm-price-drop-card__bar">
                        <div className="jm-price-drop-card__bar-fill" style={{ width: `${100 - pct}%` }} />
                      </div>
                      <span className="jm-price-drop-card__bar-text">Now {100 - pct}% of original</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════ ALL CATEGORIES PRODUCT LIST ═══════ */}
      {!loading && Object.entries(productCategories).map(([catName, items]) => (
        <section key={catName} className="jm-section">
          <div className="jm-section__header">
            <div className="jm-section__header-left">
              <div className="jm-section__cat-icon"><Icon icon={getCatIcon(catName)} width={16} /></div>
              <div>
                <h3 className="jm-section__subtitle">{catName}</h3>
                <p className="jm-section__meta">{items.length} product{items.length !== 1 ? "s" : ""} · {priceRange(items, currency)}</p>
              </div>
            </div>
            <Link to={`/products?category=${catName}`} className="jm-section__see-all">VIEW ALL <Icon icon="lucide:chevron-right" width={14} /></Link>
          </div>
          <div className="jm-product-grid jm-product-grid--4">
            {items.slice(0, 4).map((p) => (
              <ProductCard key={`list-${catName}-${p._id}`} p={p} prefix={`list-${catName}-`} currency={currency} cartQty={getCartQty(p._id)} isSyncing={isSyncing} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </section>
      ))}

      {/* ═══════ WHY SHOP WITH US ═══════ */}
      <section className="jm-section jm-trust-section">
        <div className="jm-section__header"><h2 className="jm-section__title">WHY SHOP WITH US</h2></div>
        <div className="jm-trust-grid">
          {[
            { icon: "lucide:truck", title: "Free Delivery", desc: `On orders over ${currency}${freeDeliveryThreshold.toLocaleString()}` },
            { icon: "lucide:shield-check", title: "Genuine Products", desc: "100% authentic items" },
            { icon: "lucide:refresh-cw", title: "Easy Returns", desc: `${returnDays}-day return policy` },
            { icon: "lucide:lock", title: "Secure Payment", desc: "Fully protected data" },
          ].map((item) => (
            <div key={item.title} className="jm-trust-item">
              <div className="jm-trust-item__icon"><Icon icon={item.icon} width={28} /></div>
              <p className="jm-trust-item__title">{item.title}</p>
              <p className="jm-trust-item__desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ APP BANNER ═══════ */}
      <section className="jm-app-banner">
        <div className="jm-app-banner__glow" />
        <div className="jm-app-banner__content">
          <div className="jm-app-banner__text">
            <h3 className="jm-app-banner__title">Download the {companyName} App</h3>
            <p className="jm-app-banner__desc">Get exclusive app-only deals, faster checkout, and real-time order tracking.</p>
            <div className="jm-app-banner__buttons">
              <a href={appStoreLink} target="_blank" rel="noopener noreferrer" className="jm-app-btn"><Icon icon="lucide:smartphone" width={18} /><div><span className="jm-app-btn__small">Download on the</span><span className="jm-app-btn__big">App Store</span></div></a>
              <a href={googlePlayLink} target="_blank" rel="noopener noreferrer" className="jm-app-btn"><Icon icon="lucide:play" width={18} /><div><span className="jm-app-btn__small">Get it on</span><span className="jm-app-btn__big">Google Play</span></div></a>
            </div>
          </div>
          <div className="jm-app-banner__qr"><Icon icon="lucide:qr-code" width={80} /></div>
        </div>
      </section>

      {/* ═══════ POPULAR SEARCHES ═══════ */}
      <section className="jm-section">
        <div className="jm-section__header"><h2 className="jm-section__title">POPULAR SEARCHES</h2></div>
        <div className="jm-search-tags">
          {popularSearches.map((s, idx) => (
            <Link to="/products" key={idx} className="jm-search-tag"><span className="jm-search-tag__term">{s.term}</span><span className="jm-search-tag__price">{s.price}</span></Link>
          ))}
        </div>
      </section>

      {/* ═══════ PAYMENT METHODS ═══════ */}
      <section className="jm-payment-section">
        {[
          { icon: "lucide:credit-card", label: "Visa" }, { icon: "lucide:credit-card", label: "Mastercard" },
          { icon: "lucide:banknote", label: "Bank Transfer" }, { icon: "lucide:smartphone", label: "USSD" },
          { icon: "lucide:wallet", label: "Wallet" }, { icon: "lucide:truck", label: "Cash on Delivery" },
        ].map((p) => (
          <div key={p.label} className="jm-payment-item"><Icon icon={p.icon} width={20} /><span>{p.label}</span></div>
        ))}
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="jm-footer">
        <div className="jm-footer__grid">
          <div className="jm-footer__col">
            <div className="jm-footer__brand">
              {companyLogo ? <img src={companyLogo} alt={companyName} className="jm-footer__logo" style={{ width: "120px", height: "auto", maxWidth: "150px" }} /> : <h3 className="jm-footer__brand-name">{companyName}</h3>}
              <p className="jm-footer__tagline">{companyTagline}</p>
            </div>
            {aboutUs && <p className="jm-footer__about">{aboutUs}</p>}
            {companyAddress && <div className="jm-footer__contact-item"><Icon icon="lucide:map-pin" width={14} /><span>{companyAddress}</span></div>}
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Contact Us</h4>
            {companyPhone && <a href={`tel:${companyPhone}`} className="jm-footer__contact-item"><Icon icon="lucide:phone" width={14} /><span>{companyPhone}</span></a>}
            {companyPhone2 && <a href={`tel:${companyPhone2}`} className="jm-footer__contact-item"><Icon icon="lucide:phone" width={14} /><span>{companyPhone2}</span></a>}
            {companyEmail && <a href={`mailto:${companyEmail}`} className="jm-footer__contact-item"><Icon icon="lucide:mail" width={14} /><span>{companyEmail}</span></a>}
            {companyWhatsapp && <a href={`https://wa.me/${companyWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="jm-footer__contact-item"><Icon icon="lucide:message-circle" width={14} /><span>WhatsApp</span></a>}
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Categories</h4>
            <div className="jm-footer__links">{sidebarItems.slice(0, 8).map((cat) => <Link to={`/products?category=${cat.name}`} key={cat.id} className="jm-footer__link">{cat.name}</Link>)}</div>
          </div>
          <div className="jm-footer__col">
            <h4 className="jm-footer__heading">Follow Us</h4>
            <div className="jm-footer__social">
              {companyFacebook && <a href={companyFacebook} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:facebook" width={18} /></a>}
              {companyInstagram && <a href={companyInstagram} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:instagram" width={18} /></a>}
              {companyTwitter && <a href={companyTwitter} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:twitter" width={18} /></a>}
              {companyTiktok && <a href={companyTiktok} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:music" width={18} /></a>}
              {companyYoutube && <a href={companyYoutube} target="_blank" rel="noopener noreferrer" className="jm-footer__social-link"><Icon icon="lucide:youtube" width={18} /></a>}
            </div>
            <div className="jm-footer__support"><Icon icon="lucide:headphones" width={14} /><span>Support: {supportHours}</span></div>
          </div>
        </div>
        <div className="jm-footer__bottom"><p>{footerText}</p></div>
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ═══════ END NORMAL HOME PAGE CONTENT ═══════ */}
      </>
      )}
    </div>
  );
}