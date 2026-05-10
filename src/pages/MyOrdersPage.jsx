import React, { useState, useEffect } from "react";
import api from "../api/axios"; // ✅ IMPORT YOUR CONFIGURED AXIOS INSTANCE

// ─── Custom Hook: Window Size for Mobile View ───
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
};

const MyOrdersPage = () => {
  const isMobile = useIsMobile();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Pagination state
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Orders Effect
  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ USING AXIOS: It automatically handles the base URL and Auth headers!
      const response = await api.get("/orders/my-orders", {
        params: {
          page: page,
          limit: 5,
          status: statusFilter
        }
      });

      const data = response.data;

      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      } else {
        setError(data.message || "Failed to fetch orders.");
      }
    } catch (err) {
      // Axios wraps errors in err.response
      const message = err.response?.data?.message || "Network error. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Inline CSS Styles ───
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: isMobile ? "15px" : "30px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      fontSize: isMobile ? "24px" : "32px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "20px",
    },
    filterContainer: {
      display: "flex",
      gap: "10px",
      marginBottom: "25px",
      overflowX: isMobile ? "auto" : "visible",
      paddingBottom: isMobile ? "10px" : "0",
      WebkitOverflowScrolling: "touch",
    },
    filterBtn: (isActive) => ({
      padding: isMobile ? "8px 15px" : "10px 20px",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: isMobile ? "13px" : "14px",
      fontWeight: "600",
      whiteSpace: "nowrap",
      backgroundColor: isActive ? "#4A90E2" : "#f0f2f5",
      color: isActive ? "#fff" : "#555",
      transition: "all 0.3s",
    }),
    orderCard: {
      border: "1px solid #e1e4e8",
      borderRadius: "12px",
      padding: isMobile ? "15px" : "20px",
      marginBottom: "15px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      backgroundColor: "#fff",
    },
    cardTopRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "10px" : "0",
      marginBottom: "15px",
      paddingBottom: "15px",
      borderBottom: "1px solid #f0f0f0",
    },
    orderMeta: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    orderNumber: {
      fontSize: isMobile ? "15px" : "17px",
      fontWeight: "bold",
      color: "#222",
    },
    orderDate: {
      fontSize: "13px",
      color: "#888",
    },
    statusBadge: (status) => {
      const colors = {
        pending: { bg: "#fff3cd", color: "#856404" },
        confirmed: { bg: "#cce5ff", color: "#004085" },
        processing: { bg: "#e2d9f3", color: "#4a235a" },
        shipped: { bg: "#d1ecf1", color: "#0c5460" },
        out_for_delivery: { bg: "#d4edda", color: "#155724" },
        delivered: { bg: "#d4edda", color: "#155724" },
        cancelled: { bg: "#f8d7da", color: "#721c24" },
        returned: { bg: "#f8d7da", color: "#721c24" },
      };
      const c = colors[status] || { bg: "#e2e3e5", color: "#383d41" };
      return {
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: isMobile ? "11px" : "13px",
        fontWeight: "bold",
        backgroundColor: c.bg,
        color: c.color,
        textTransform: "uppercase",
        alignSelf: isMobile ? "flex-start" : "center",
      };
    },
    itemsContainer: {
      marginBottom: "15px",
    },
    itemRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      fontSize: isMobile ? "13px" : "15px",
      color: "#444",
    },
    cardBottomRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row",
      gap: "10px",
      borderTop: "1px solid #f0f0f0",
      paddingTop: "15px",
    },
    progressBarContainer: {
      width: "100%",
      backgroundColor: "#e9ecef",
      borderRadius: "10px",
      height: "8px",
      overflow: "hidden",
    },
    progressBar: (progress) => ({
      height: "100%",
      width: `${progress}%`,
      backgroundColor: progress === 100 ? "#28a745" : "#4A90E2",
      borderRadius: "10px",
      transition: "width 0.5s ease-in-out",
    }),
    totalText: {
      fontSize: isMobile ? "16px" : "18px",
      fontWeight: "bold",
      color: "#222",
    },
    paginationContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: "30px",
      gap: "15px",
    },
    pageBtn: (disabled) => ({
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      backgroundColor: disabled ? "#e1e4e8" : "#4A90E2",
      color: disabled ? "#999" : "#fff",
      cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: "bold",
      fontSize: "14px",
    }),
    emptyState: {
      textAlign: "center",
      padding: "50px 20px",
      color: "#666",
      fontSize: "16px",
    }
  };

  // Status options for the filter tabs
  const statusTabs = ["all", "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>My Orders</h1>

      {/* Filter Tabs */}
      <div style={styles.filterContainer}>
        {statusTabs.map((status) => (
          <button
            key={status}
            style={styles.filterBtn(statusFilter === status)}
            onClick={() => {
              setStatusFilter(status);
              setPage(1); // Reset page on filter change
            }}
          >
            {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && <div style={styles.emptyState}>Loading orders...</div>}

      {/* Error State */}
      {error && <div style={{ ...styles.emptyState, color: "red" }}>{error}</div>}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div style={styles.emptyState}>No orders found.</div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.map((order) => (
        <div key={order._id} style={styles.orderCard}>
          
          {/* Top Row: Meta & Status */}
          <div style={styles.cardTopRow}>
            <div style={styles.orderMeta}>
              <span style={styles.orderNumber}>Order #{order.orderNumber}</span>
              <span style={styles.orderDate}>
                Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <span style={styles.statusBadge(order.status)}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Items List */}
          <div style={styles.itemsContainer}>
            {order.items.map((item, idx) => (
              <div key={idx} style={styles.itemRow}>
                <span>
                  {item.product?.name || item.name || "Product Unavailable"} × {item.quantity}
                </span>
                <span style={{ fontWeight: "600" }}>
                  ₦{item.priceAtPurchase?.toLocaleString() || item.price?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Row: Progress & Total */}
          <div style={styles.cardBottomRow}>
            <div style={{ width: isMobile ? "100%" : "60%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "12px", color: "#666" }}>
                <span>Progress</span>
                <span>{order.progress}%</span>
              </div>
              <div style={styles.progressBarContainer}>
                <div style={styles.progressBar(order.progress)}></div>
              </div>
            </div>
            <div style={styles.totalText}>
              Total: ₦{order.totalAmount?.toLocaleString()}
            </div>
          </div>

        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationContainer}>
          <button 
            style={styles.pageBtn(page === 1)} 
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: "16px", fontWeight: "600", color: "#555" }}>
            Page {page} of {totalPages}
          </span>
          <button 
            style={styles.pageBtn(page === totalPages)} 
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;