// pages/TrackOrder.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../api/axios";

const STATUS_FLOW = [
  { key: "pending", label: "Pending", icon: "lucide:clock", desc: "Order received" },
  { key: "confirmed", label: "Confirmed", icon: "lucide:check-circle", desc: "Order verified" },
  { key: "processing", label: "Processing", icon: "lucide:package", desc: "Being prepared" },
  { key: "shipped", label: "Shipped", icon: "lucide:truck", desc: "On the way" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "lucide:map-pin", desc: "Almost there" },
  { key: "delivered", label: "Delivered", icon: "lucide:badge-check", desc: "Order complete" },
];

const TABS = [
  { key: "orderNumber", label: "Order Number", placeholder: "e.g. ORD-M1ABC-X9K2F", icon: "lucide:hash" },
  { key: "trackingNumber", label: "Tracking Number", placeholder: "e.g. TRK...", icon: "lucide:scan-line" },
  { key: "phone", label: "Phone Number", placeholder: "e.g. 08012345678", icon: "lucide:phone" },
  { key: "email", label: "Email Address", placeholder: "e.g. you@example.com", icon: "lucide:mail" },
];

export default function TrackOrder() {
  const [activeTab, setActiveTab] = useState("orderNumber");
  const [inputs, setInputs] = useState({ orderNumber: "", trackingNumber: "", phone: "", email: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    const value = inputs[activeTab]?.trim();
    if (!value) {
      setError(`Please enter your ${TABS.find((t) => t.key === activeTab).label.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);

    try {
      const params = { [activeTab]: value };
      const res = await api.get("/orders/track", { params });

      if (res.data.success) {
        setResult(res.data.order);
      } else {
        setError(res.data.message || "Order not found.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status) => STATUS_FLOW.findIndex((s) => s.key === status);
  const isCancelled = result?.status === "cancelled";
  const isReturned = result?.status === "returned";
  const currentIdx = isCancelled || isReturned ? -1 : getStatusIndex(result?.status);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return "₦" + (amount || 0).toLocaleString();
  };

  return (
    <>
      <style>{`
        .to__page { min-height: 100vh; background: #f8f9fb; padding-bottom: 80px; }

        /* ── Hero ── */
        .to__hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 60px 16px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .to__hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        .to__hero-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: rgba(255,255,255,0.15); backdrop-filter: blur(12px);
          display: inline-flex; align-items: center; justify-content: center;
          margin-bottom: 20px; border: 2px solid rgba(255,255,255,0.2); position: relative;
        }
        .to__hero-icon::after {
          content: ''; position: absolute; inset: -4px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08); animation: toRing 3s ease-in-out infinite;
        }
        @keyframes toRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        .to__hero h1 { margin: 0 0 8px; font-size: 2rem; font-weight: 800; color: #fff; position: relative; letter-spacing: -0.5px; }
        .to__hero p { margin: 0; color: rgba(255,255,255,0.75); font-size: 1rem; max-width: 460px; margin: 0 auto; position: relative; }

        /* ── Search Card ── */
        .to__search-card {
          max-width: 620px; margin: -44px auto 0; background: #fff; border-radius: 20px;
          box-shadow: 0 12px 48px rgba(102,126,234,0.15), 0 2px 8px rgba(0,0,0,0.04);
          padding: 24px; position: relative; z-index: 10; border: 1px solid rgba(102,126,234,0.08);
        }

        /* ── Tabs ── */
        .to__tabs { display: flex; gap: 4px; background: #f1f3f5; border-radius: 12px; padding: 4px; margin-bottom: 20px; overflow-x: auto; }
        .to__tab {
          flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 8px; border-radius: 10px; border: none; background: transparent;
          color: #868e96; font-size: 0.78rem; font-weight: 600; cursor: pointer;
          transition: all 0.25s ease; white-space: nowrap;
        }
        .to__tab:hover { color: #495057; background: rgba(255,255,255,0.6); }
        .to__tab--active { background: #fff; color: #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .to__tab-icon { display: none; }

        /* ── Form ── */
        .to__form { display: flex; gap: 10px; }
        .to__input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
        .to__input-icon { position: absolute; left: 14px; color: #adb5bd; pointer-events: none; transition: color 0.25s; }
        .to__input {
          width: 100%; border: 2px solid #e9ecef; border-radius: 14px; padding: 14px 16px 14px 44px;
          font-size: 0.92rem; color: #212529; outline: none; background: #f8f9fa;
          transition: all 0.25s ease; box-sizing: border-box;
        }
        .to__input:focus { border-color: #667eea; background: #fff; box-shadow: 0 0 0 4px rgba(102,126,234,0.1); }
        .to__input:focus + .to__input-icon, .to__input:focus ~ .to__input-icon { color: #667eea; }
        .to__input::placeholder { color: #adb5bd; }
        .to__btn {
          padding: 14px 28px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #667eea, #764ba2); color: #fff;
          font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px; white-space: nowrap;
          box-shadow: 0 4px 16px rgba(102,126,234,0.3);
        }
        .to__btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(102,126,234,0.4); }
        .to__btn:active { transform: translateY(0); }
        .to__btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
        .to__btn-spin { animation: toSpin 1s linear infinite; }
        @keyframes toSpin { to { transform: rotate(360deg); } }

        /* ── Error ── */
        .to__error {
          display: flex; align-items: flex-start; gap: 10px; padding: 14px 18px;
          border-radius: 12px; background: #fff5f5; border: 1px solid #fecaca;
          color: #c92a2a; font-size: 0.88rem; margin-top: 16px;
        }

        /* ── Not Found ── */
        .to__not-found { text-align: center; padding: 48px 24px; margin-top: 32px; }
        .to__not-found-icon {
          width: 80px; height: 80px; border-radius: 50%; background: #f1f3f5;
          display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #adb5bd;
        }
        .to__not-found h3 { margin: 0 0 6px; color: #343a40; font-size: 1.15rem; }
        .to__not-found p { margin: 0 0 20px; color: #868e96; font-size: 0.9rem; }
        .to__support-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px;
          border-radius: 12px; background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff; text-decoration: none; font-size: 0.88rem; font-weight: 600;
          transition: opacity 0.2s;
        }
        .to__support-btn:hover { opacity: 0.9; }

        /* ═══════════════════════════════════════════
           RESULTS
           ═══════════════════════════════════════════ */
        .to__results { max-width: 780px; margin: 32px auto 0; display: flex; flex-direction: column; gap: 20px; padding: 0 16px; }

        /* ── Order Header Card ── */
        .to__order-header { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f1f3f5; }
        .to__order-header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .to__order-num { font-size: 0.78rem; color: #868e96; font-weight: 500; margin: 0 0 4px; }
        .to__order-num span { color: #495057; font-weight: 700; }
        .to__order-date { font-size: 0.8rem; color: #adb5bd; margin: 0; }
        .to__tracking-num span { color: #667eea; font-weight: 600; }
        .to__status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 50px; font-size: 0.82rem; font-weight: 700; }
        .to__status-badge--active { background: rgba(102,126,234,0.1); color: #667eea; border: 1px solid rgba(102,126,234,0.2); }
        .to__status-badge--delivered { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
        .to__status-badge--cancelled { background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.2); }
        .to__status-badge--returned { background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.2); }

        /* ── Progress Stepper ── */
        .to__stepper { margin-top: 4px; }
        .to__progress-bar-wrap { height: 6px; background: #f1f3f5; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
        .to__progress-bar { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .to__progress-bar--cancelled { background: linear-gradient(90deg, #fca5a5, #ef4444); }

        .to__steps { display: flex; justify-content: space-between; position: relative; }
        .to__step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 1; }
        .to__step-dot-wrap {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: #f1f3f5; border: 3px solid #dee2e6; transition: all 0.4s ease; margin-bottom: 8px; position: relative;
        }
        .to__step--done .to__step-dot-wrap { background: linear-gradient(135deg, #667eea, #764ba2); border-color: transparent; color: #fff; box-shadow: 0 4px 12px rgba(102,126,234,0.3); }
        .to__step--current .to__step-dot-wrap { border-color: #667eea; background: #fff; color: #667eea; box-shadow: 0 0 0 4px rgba(102,126,234,0.15); animation: toStepPulse 2s ease-in-out infinite; }
        @keyframes toStepPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(102,126,234,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(102,126,234,0.08); }
        }
        .to__step--cancelled .to__step-dot-wrap { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }
        .to__step-label { font-size: 0.7rem; font-weight: 600; color: #adb5bd; text-align: center; line-height: 1.2; transition: color 0.3s; }
        .to__step--done .to__step-label, .to__step--current .to__step-label { color: #495057; }
        .to__step--cancelled .to__step-label { color: #ef4444; }

        /* ── Info Grid ── */
        .to__info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .to__info-card { background: #f8f9fb; border-radius: 14px; padding: 16px; border: 1px solid #f1f3f5; }
        .to__info-card-label { font-size: 0.72rem; font-weight: 600; color: #adb5bd; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; display: flex; align-items: center; gap: 6px; }
        .to__info-card-value { font-size: 0.92rem; font-weight: 600; color: #212529; margin: 0; word-break: break-word; }
        .to__info-card-value--sm { font-size: 0.84rem; font-weight: 500; color: #495057; }
        .to__info-card-sub { font-size: 0.75rem; color: #adb5bd; margin: 4px 0 0; }

        /* ── Items Card ── */
        .to__items-card { background: #fff; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f1f3f5; overflow: hidden; }
        .to__items-title { padding: 20px 24px 0; font-size: 1rem; font-weight: 700; color: #212529; margin: 0; display: flex; align-items: center; gap: 8px; }
        .to__items-count { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
        .to__item { display: flex; gap: 14px; padding: 16px 24px; border-bottom: 1px solid #f8f9fa; transition: background 0.2s; }
        .to__item:last-child { border-bottom: none; }
        .to__item:hover { background: #fafbfc; }
        .to__item-img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background: #f1f3f5; flex-shrink: 0; }
        .to__item-info { flex: 1; min-width: 0; }
        .to__item-name { font-size: 0.9rem; font-weight: 600; color: #212529; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .to__item-meta { font-size: 0.8rem; color: #868e96; margin: 0; }
        .to__item-price { font-size: 0.92rem; font-weight: 700; color: #212529; margin: 0; white-space: nowrap; align-self: center; }

        /* ── Totals ── */
        .to__totals { padding: 16px 24px; background: #f8f9fb; border-top: 1px solid #f1f3f5; display: flex; flex-direction: column; gap: 6px; }
        .to__total-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #868e96; }
        .to__total-row--final { padding-top: 10px; border-top: 1px solid #e9ecef; margin-top: 4px; font-size: 1.05rem; font-weight: 800; color: #212529; }
        .to__total-row--final span:last-child { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* ── Cancelled Banner ── */
        .to__cancelled-banner { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-radius: 14px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.88rem; }
        .to__cancelled-banner p { margin: 0; }
        .to__cancelled-banner strong { color: #dc2626; }

        /* ── Est. Delivery ── */
        .to__est-delivery { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg, rgba(102,126,234,0.06), rgba(118,75,162,0.06)); border: 1px solid rgba(102,126,234,0.12); color: #5b21b6; font-size: 0.84rem; font-weight: 600; }
        .to__est-delivery--delivered { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.12); color: #059669; }
        .to__est-days { margin-left: auto; font-size: 0.78rem; opacity: 0.8; }

        /* ── Back Link ── */
        .to__back-link { text-align: center; padding-top: 8px; }
        .to__back-link a { display: inline-flex; align-items: center; gap: 6px; color: #667eea; text-decoration: none; font-size: 0.88rem; font-weight: 600; transition: opacity 0.2s; }
        .to__back-link a:hover { opacity: 0.8; }

        /* ═══════════════════════════════════════════
           RESPONSIVE
           ═══════════════════════════════════════════ */
        @media (max-width: 640px) {
          .to__hero { padding: 48px 16px 64px; }
          .to__hero h1 { font-size: 1.5rem; }
          .to__hero p { font-size: 0.88rem; }
          .to__search-card { margin-top: -36px; padding: 18px; border-radius: 16px; }
          .to__tabs { gap: 2px; padding: 3px; }
          .to__tab { padding: 8px 4px; font-size: 0.7rem; }
          .to__tab-icon { display: inline-flex; }
          .to__tab-label { display: none; } /* Hide text, show icons on mobile */
          .to__form { flex-direction: column; }
          .to__btn { justify-content: center; padding: 14px; border-radius: 14px; }
          .to__results { padding: 0 12px; }
          .to__order-header { padding: 18px; border-radius: 16px; }
          .to__item { padding: 12px 18px; }
          .to__item-img { width: 50px; height: 50px; }
          .to__info-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .to__step-dot-wrap { width: 32px; height: 32px; }
          .to__step-dot-wrap svg { width: 14px !important; height: 14px !important; }
          .to__step-label { display: none; } /* Hide stepper labels on very small screens to prevent awkward wrap */
          .to__progress-bar-wrap { margin-bottom: 16px; }
          
          .to__est-delivery { flex-direction: column; align-items: flex-start; gap: 4px; }
          .to__est-days { margin-left: 0; }

          .to__totals { padding: 12px 16px; }
          .to__total-row--final { font-size: 0.95rem; }
        }
      `}</style>

      <div className="to__page">
        {/* Hero */}
        <div className="to__hero">
          <div className="to__hero-icon">
            <Icon icon="lucide:map-pin" width={32} color="#fff" />
          </div>
          <h1>Track Your Order</h1>
          <p>Enter your order number, tracking number, phone, or email to get real-time updates on your delivery.</p>
        </div>

        {/* Search Card */}
        <div className="to__search-card">
          <div className="to__tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`to__tab ${activeTab === tab.key ? "to__tab--active" : ""}`}
              >
                <Icon icon={tab.icon} width={15} className="to__tab-icon" />
                <span className="to__tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleTrack} className="to__form">
            <div className="to__input-wrap">
              <input
                type={activeTab === "email" ? "email" : "text"}
                className="to__input"
                placeholder={TABS.find((t) => t.key === activeTab).placeholder}
                value={inputs[activeTab]}
                onChange={(e) => handleInputChange(activeTab, e.target.value)}
                disabled={loading}
                autoFocus
              />
              <Icon icon={TABS.find((t) => t.key === activeTab).icon} width={18} className="to__input-icon" />
            </div>
            <button type="submit" className="to__btn" disabled={loading}>
              {loading ? (
                <>
                  <Icon icon="lucide:loader-2" width={18} className="to__btn-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Icon icon="lucide:search" width={18} />
                  Track
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="to__error">
              <Icon icon="lucide:alert-circle" width={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Not Found (searched but no result) */}
        {searched && !loading && !result && !error && (
          <div className="to__results">
            <div className="to__not-found">
              <div className="to__not-found-icon">
                <Icon icon="lucide:package-x" width={36} />
              </div>
              <h3>No Order Found</h3>
              <p>We couldn't locate an order with that information. Please double-check and try again.</p>
              <Link to="/help" className="to__support-btn">
                <Icon icon="lucide:help-circle" width={16} />
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="to__results">
            {/* Cancelled / Returned Banner */}
            {(isCancelled || isReturned) && (
              <div className="to__cancelled-banner">
                <Icon icon={isCancelled ? "lucide:x-circle" : "lucide:rotate-ccw"} width={22} style={{ flexShrink: 0 }} />
                <p>
                  This order has been <strong>{isCancelled ? "cancelled" : "returned"}</strong>.
                  {result.cancelReason && ` Reason: "${result.cancelReason}"`}
                </p>
              </div>
            )}

            {/* Order Header + Stepper */}
            <div className="to__order-header">
              <div className="to__order-header-top">
                <div>
                  <p className="to__order-num">Order <span>{result.orderNumber}</span></p>
                  <p className="to__order-date">Placed on {formatDate(result.createdAt)}</p>
                  {result.trackingNumber && (
                    <p className="to__order-date to__tracking-num">
                      Tracking: <span>{result.trackingNumber}</span>
                    </p>
                  )}
                </div>
                <div>
                  <span className={`to__status-badge ${
                    isCancelled ? "to__status-badge--cancelled" :
                    isReturned ? "to__status-badge--returned" :
                    result.status === "delivered" ? "to__status-badge--delivered" :
                    "to__status-badge--active"
                  }`}>
                    <Icon
                      icon={
                        isCancelled ? "lucide:x-circle" :
                        isReturned ? "lucide:rotate-ccw" :
                        result.status === "delivered" ? "lucide:badge-check" :
                        "lucide:clock"
                      }
                      width={14}
                    />
                    {result.status === "out_for_delivery" ? "Out for Delivery" : result.status?.charAt(0).toUpperCase() + result.status?.slice(1)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="to__stepper">
                <div className="to__progress-bar-wrap">
                  <div
                    className={`to__progress-bar ${isCancelled ? "to__progress-bar--cancelled" : ""}`}
                    style={{ width: `${result.progress || 0}%` }}
                  />
                </div>

                {/* Steps */}
                <div className="to__steps">
                  {STATUS_FLOW.map((step, idx) => {
                    let stepClass = "";
                    if (isCancelled || isReturned) {
                      stepClass = idx === 0 ? "to__step--cancelled" : "";
                    } else if (idx < currentIdx) {
                      stepClass = "to__step--done";
                    } else if (idx === currentIdx) {
                      stepClass = "to__step--current";
                    }

                    return (
                      <div key={step.key} className={`to__step ${stepClass}`}>
                        <div className="to__step-dot-wrap">
                          {(isCancelled || isReturned) ? (
                            idx === 0 ? <Icon icon="lucide:x" width={16} /> : <Icon icon={step.icon} width={16} />
                          ) : idx < currentIdx ? (
                            <Icon icon="lucide:check" width={16} />
                          ) : (
                            <Icon icon={step.icon} width={16} />
                          )}
                        </div>
                        <span className="to__step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Delivery */}
              {result.estimatedDelivery && result.status !== "delivered" && !isCancelled && !isReturned && (
                <div className="to__est-delivery" style={{ marginTop: 20 }}>
                  <Icon icon="lucide:calendar-clock" width={18} />
                  <span>Estimated delivery: {formatDate(result.estimatedDelivery)}</span>
                  {result.estimatedDaysLeft != null && result.estimatedDaysLeft > 0 && (
                    <span className="to__est-days">
                      {result.estimatedDaysLeft} day{result.estimatedDaysLeft > 1 ? "s" : ""} left
                    </span>
                  )}
                </div>
              )}
              {result.status === "delivered" && result.deliveredAt && (
                <div className="to__est-delivery to__est-delivery--delivered" style={{ marginTop: 20 }}>
                  <Icon icon="lucide:badge-check" width={18} />
                  Delivered on {formatDate(result.deliveredAt)}
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="to__info-grid">
              {/* Shipping Address */}
              <div className="to__info-card">
                <p className="to__info-card-label">
                  <Icon icon="lucide:map-pin" width={14} /> Shipping Address
                </p>
                <p className="to__info-card-value to__info-card-value--sm">
                  {result.shippingAddress?.fullName || "—"}
                </p>
                <p className="to__info-card-value to__info-card-value--sm" style={{ marginTop: 2 }}>
                  {result.shippingAddress?.street || "—"}
                  {result.shippingAddress?.city && `, ${result.shippingAddress.city}`}
                  {result.shippingAddress?.state && `, ${result.shippingAddress.state}`}
                </p>
                {result.shippingAddress?.phone && (
                  <p className="to__info-card-sub">{result.shippingAddress.phone}</p>
                )}
              </div>

              {/* Payment */}
              <div className="to__info-card">
                <p className="to__info-card-label">
                  <Icon icon="lucide:credit-card" width={14} /> Payment
                </p>
                <p className="to__info-card-value" style={{ textTransform: "capitalize" }}>
                  {result.paymentMethod || "—"}
                </p>
                {result.paystackReference && (
                  <p className="to__info-card-sub">Ref: {result.paystackReference}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="to__items-card">
              <h3 className="to__items-title">
                <Icon icon="lucide:package" width={18} />
                Order Items
                <span className="to__items-count">{result.items?.length || 0}</span>
              </h3>

              {result.items?.map((item, idx) => {
                const imgSrc = item.product?.image?.url || item.product?.image || item.image;
                const name = item.product?.name || item.name || "Product";
                const unitPrice = item.product?.discountPrice || item.product?.price || item.price;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <div key={idx} className="to__item">
                    <img
                      src={imgSrc || "https://via.placeholder.com/64"}
                      alt={name}
                      className="to__item-img"
                    />
                    <div className="to__item-info">
                      <p className="to__item-name">{name}</p>
                      <p className="to__item-meta">Qty: {item.quantity} × {formatCurrency(unitPrice)}</p>
                    </div>
                    <p className="to__item-price">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="to__totals">
                <div className="to__total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(result.subtotal)}</span>
                </div>
                <div className="to__total-row">
                  <span>Shipping</span>
                  <span>{result.shippingCost ? formatCurrency(result.shippingCost) : "Free"}</span>
                </div>
                <div className="to__total-row to__total-row--final">
                  <span>Total</span>
                  <span>{formatCurrency(result.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div className="to__back-link">
              <Link to="/orders">
                <Icon icon="lucide:arrow-left" width={16} />
                View All My Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}