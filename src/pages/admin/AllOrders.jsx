import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import api from "../../api/axios";

const STATUS_FLOW = [
  { key: "pending", label: "Pending", color: "#fbbf24" },
  { key: "confirmed", label: "Confirmed", color: "#60a5fa" },
  { key: "processing", label: "Processing", color: "#a78bfa" },
  { key: "shipped", label: "Shipped", color: "#38bdf8" },
  { key: "out_for_delivery", label: "Out for Delivery", color: "#fb923c" },
  { key: "delivered", label: "Delivered", color: "#34d399" },
  { key: "cancelled", label: "Cancelled", color: "#f87171" },
  { key: "returned", label: "Returned", color: "#fbbf24" },
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

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      if (res.data.success) {
        setOrders(res.data.orders);
      } else {
        setError("Failed to load orders.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => "₦" + (amount || 0).toLocaleString();

  const getStatusStyle = (status) => {
    const step = STATUS_FLOW.find((s) => s.key === status);
    const color = step ? step.color : "#94a3b8";
    return {
      bg: `${color}18`,
      text: color,
      border: `${color}40`,
    };
  };

  const getCustomerName = (order) => {
    if (order.shippingAddress?.fullName) return order.shippingAddress.fullName;
    if (order.user?.name) return order.user.name;
    if (order.guestEmail) return order.guestEmail.split("@")[0];
    return "Unknown";
  };

  const getStatusIcon = (status) => {
    if (status === "cancelled") return "lucide:x-circle";
    if (status === "delivered") return "lucide:badge-check";
    return "lucide:clock";
  };

  const getStatusLabel = (status) =>
    status === "out_for_delivery"
      ? "Out for Delivery"
      : status?.charAt(0).toUpperCase() + status?.slice(1);

  /* ─── Shared badge component ─── */
  const StatusBadge = ({ status }) => {
    const s = getStatusStyle(status);
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "5px 12px",
          borderRadius: "50px",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: s.bg,
          color: s.text,
          border: `1px solid ${s.border}`,
          width: "fit-content",
        }}
      >
        <Icon icon={getStatusIcon(status)} width={12} />
        {getStatusLabel(status)}
      </span>
    );
  };

  /* ─── Loading state ─── */
  const LoadingState = () => (
    <div style={{ padding: isMobile ? "40px 16px" : "60px 24px", textAlign: "center" }}>
      <Icon
        icon="lucide:loader-2"
        width={32}
        color="#34d399"
        style={{ animation: "spin 1s linear infinite" }}
      />
      <p style={{ color: "#94a3b8", marginTop: "12px", fontSize: "0.9rem" }}>
        Fetching orders…
      </p>
    </div>
  );

  /* ─── Empty state ─── */
  const EmptyState = () => (
    <div style={{ padding: isMobile ? "40px 16px" : "60px 24px", textAlign: "center" }}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "#0f172a",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          color: "#475569",
        }}
      >
        <Icon icon="lucide:package-x" width={28} />
      </div>
      <h3 style={{ margin: "0 0 6px", color: "#e2e8f0", fontSize: "1.1rem" }}>
        No Orders Yet
      </h3>
      <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
        Once customers place orders, they will appear here.
      </p>
    </div>
  );

  /* ─── Desktop row ─── */
  const DesktopRow = ({ order, idx }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr",
        padding: "16px 24px",
        borderBottom: idx < orders.length - 1 ? "1px solid #0f172a" : "none",
        alignItems: "center",
        gap: "16px",
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.01)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Order Number */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon icon="lucide:package" width={16} color="#94a3b8" />
        </div>
        <span
          style={{
            color: "#e2e8f0",
            fontWeight: 600,
            fontSize: "0.88rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {order.orderNumber}
        </span>
      </div>

      {/* Customer Name */}
      <span
        style={{
          color: "#94a3b8",
          fontSize: "0.88rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {getCustomerName(order)}
      </span>

      {/* Date */}
      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
        {formatDate(order.createdAt)}
      </span>

      {/* Status */}
      <StatusBadge status={order.status} />

      {/* Total */}
      <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.9rem", textAlign: "right" }}>
        {formatCurrency(order.totalAmount)}
      </span>
    </div>
  );

  /* ─── Mobile card ─── */
  const MobileCard = ({ order, idx }) => (
    <div
      style={{
        padding: "16px",
        borderBottom: idx < orders.length - 1 ? "1px solid #0f172a" : "none",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onTouchStart={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onTouchEnd={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Top row: order number + total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon icon="lucide:package" width={16} color="#94a3b8" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "#e2e8f0",
                fontWeight: 600,
                fontSize: "0.88rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {order.orderNumber}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>
              {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        <span
          style={{
            color: "#34d399",
            fontWeight: 700,
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Bottom row: customer + status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <Icon icon="lucide:user" width={13} color="#64748b" style={{ flexShrink: 0 }} />
          <span
            style={{
              color: "#94a3b8",
              fontSize: "0.82rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getCustomerName(order)}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "16px 12px" : "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: isMobile ? "16px" : "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Icon icon="lucide:clipboard-list" width={isMobile ? 20 : 24} color="#34d399" />
            Recent Orders
          </h2>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: isMobile ? "0.8rem" : "0.9rem" }}>
            View and manage all customer orders.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: isMobile ? "8px 14px" : "10px 20px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#e2e8f0",
            fontSize: isMobile ? "0.82rem" : "0.88rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.2s",
          }}
        >
          <Icon
            icon="lucide:refresh-cw"
            width={isMobile ? 14 : 16}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          />
          {isMobile ? "Refresh" : "Refresh"}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            fontSize: "0.85rem",
            marginBottom: "20px",
          }}
        >
          <Icon icon="lucide:alert-circle" width={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Main Card */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: isMobile ? "12px" : "16px",
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      >
        {/* Table Header (desktop only) */}
        {!isMobile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 0.8fr 0.8fr 0.8fr",
              padding: "14px 24px",
              background: "#0f172a",
              borderBottom: "1px solid #334155",
              gap: "16px",
            }}
          >
            {["Order Number", "Customer Name", "Date", "Status", "Total"].map(
              (label, i) => (
                <span
                  key={label}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    textAlign: i === 4 ? "right" : "left",
                  }}
                >
                  {label}
                </span>
              )
            )}
          </div>
        )}

        {/* Mobile header bar */}
        {isMobile && orders.length > 0 && !loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#0f172a",
              borderBottom: "1px solid #334155",
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {orders.length} Order{orders.length !== 1 ? "s" : ""}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total
            </span>
          </div>
        )}

        {loading && <LoadingState />}
        {!loading && orders.length === 0 && !error && <EmptyState />}

        {!loading &&
          orders.map((order, idx) =>
            isMobile ? (
              <MobileCard key={order._id} order={order} idx={idx} />
            ) : (
              <DesktopRow key={order._id} order={order} idx={idx} />
            )
          )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}