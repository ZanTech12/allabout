import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { usePaystackPayment } from 'react-paystack';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Cart.css';

export default function Cart() {
  const { 
    cart = [], 
    totalPrice = 0, 
    totalQty = 0, 
    updateCartQty = () => {}, 
    removeFromCart = () => {}, 
    clearCart = async () => {}, 
    isLoading = false, 
    isSyncing = false 
  } = useCart();

  const { user } = useAuth() || {};
  const customerEmail = user?.email || "";
  
  const PAYSTACK_PUBLIC_KEY = "pk_live_73d373180bd0c70bd6baf9bf603136691f7b1867";
  const ADMIN_WHATSAPP_NUMBER = "2348000000000";

  const deliveryFee = totalPrice > 15000 ? 0 : 2500;
  const grandTotal = totalPrice + deliveryFee;

  const [isPaid, setIsPaid] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [showMobileForm, setShowMobileForm] = useState(false); // For mobile sticky form

  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
    phone: "",
  });

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const getProductId = (item) => item.product?._id || item.product;

  const buildWhatsAppMessage = () => {
    let message = "Hello, I'd like to place an order:\n\n";
    cart.forEach((item, index) => {
      message += `*${index + 1}. ${item.name}*\n`;
      message += `   Qty: ${item.quantity}  •  Price: ₦${(item.price * item.quantity).toLocaleString()}\n\n`;
    });
    message += "____________________\n\n";
    message += `*Subtotal:* ₦${totalPrice.toLocaleString()}\n`;
    message += `*Delivery Fee:* ${deliveryFee === 0 ? "FREE" : "₦2,500"}\n`;
    message += `*Grand Total:* ₦${grandTotal.toLocaleString()}\n\n`;
    message += "*Delivery Details:*\n";
    message += `Name: ${shippingInfo.fullName}\n`;
    message += `Address: ${shippingInfo.street}, ${shippingInfo.apartment}\n`;
    message += `City: ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}\n`;
    message += `Phone: ${shippingInfo.phone}\n\n`;
    message += "Please confirm availability and payment details. Thank you!";
    return message;
  };

  const validateShipping = () => {
    if (!shippingInfo.fullName || !shippingInfo.street || !shippingInfo.city || 
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.phone) {
      setError("Please fill in all required delivery details.");
      return false;
    }
    setError("");
    return true;
  };

  const handleWhatsAppOrder = async () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);

    setPlacing(true);
    setError("");

    try {
      const message = buildWhatsAppMessage();
      window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");

      try {
        const orderData = buildOrderPayload("whatsapp", null);
        await api.post("/orders", orderData);
      } catch (saveErr) {
        console.warn("Order not saved to DB, but WhatsApp opened:", saveErr);
      }

      await clearCart(); 
      setIsPaid(true);
    } catch (err) {
      console.error("WhatsApp order error:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const buildOrderPayload = (paymentMethod, paystackReference) => ({
    items: cart.map((item) => ({
      product: getProductId(item),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: totalPrice,
    deliveryFee,
    total: grandTotal,
    paymentMethod,
    paystackReference: paystackReference || undefined,
    shippingAddress: shippingInfo,
  });

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: customerEmail || "no-email@provided.com",
    amount: grandTotal * 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: "NGN",
    metadata: {
      custom_fields: [
        {
          display_name: "Cart Items",
          variable_name: "cart_items",
          value: cart.map(item => `${item.name} (x${item.quantity})`).join(', ')
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaystackCheckout = () => {
    if (placing) return;
    if (!validateShipping()) return setShowMobileForm(true);

    if (!customerEmail) {
      setError("No email found. Please ensure you are logged in.");
      return;
    }

    initializePayment(onSuccess, onClose);
  };

  const onSuccess = async (reference) => {
    setPlacing(true);
    setError("");

    try {
      const orderData = buildOrderPayload("paystack", reference.reference);
      await api.post("/orders", orderData);

      await clearCart(); 
      setIsPaid(true);
    } catch (err) {
      console.error("Failed to save Paystack order:", err);
      setError(err.response?.data?.message || "Payment received but order save failed.");
      setIsPaid(true);
    } finally {
      setPlacing(false);
    }
  };

  const onClose = () => {
    console.log("Payment closed by user.");
  };

  if (isLoading) {
    return (
      <div className="cart-empty" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon="lucide:loader-2" width={40} style={{ animation: 'spin 1s linear infinite', color: '#f68b1e' }} />
        <p style={{ marginTop: '16px', color: '#666' }}>Loading your cart...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="cart-empty">
        <Icon icon="lucide:check-circle" width={64} style={{ color: '#25D366' }} />
        <h2>Order Placed Successfully!</h2>
        <p>Thank you for your purchase. We are processing your order.</p>
        <Link to="/" className="cart-empty-btn">Continue Shopping</Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <Icon icon="lucide:shopping-cart" width={64} />
        <h2>Your cart is empty</h2>
        <p>Looks like you have not added anything to your cart.</p>
        <Link to="/" className="cart-empty-btn">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {isSyncing && (
        <div className="cart-sync-banner">
          <Icon icon="lucide:loader-2" width={14} style={{ animation: 'spin 1s linear infinite' }} />
          Saving cart...
        </div>
      )}

      <div className="cart-container">
        {/* Left: Items List */}
        <div className="cart-items-section">
          <div className="cart-header">
            <h2>Shopping Cart ({totalQty})</h2>
            <span className="cart-delivery-text">
              <Icon icon="lucide:truck" width={16} />
              Free delivery over ₦15k
            </span>
          </div>

          {cart.map((item) => {
            const productId = getProductId(item);
            return (
              <div key={item._id} className="cart-item">
                <Link to={`/product/${productId}`} className="cart-item-img">
                  <img src={item.image} alt={item.name} />
                </Link>
                
                <div className="cart-item-details">
                  <div>
                    <Link to={`/product/${productId}`} className="cart-item-name">
                      {item.name}
                    </Link>
                    <p className="cart-item-sold">Sold by MallHub</p>
                  </div>
                  
                  <div className="cart-item-bottom">
                    <div className="cart-qty-control">
                      <button 
                        onClick={() => updateCartQty(productId, item.quantity - 1)} 
                        disabled={item.quantity <= 1 || isSyncing} 
                        className="cart-qty-btn"
                      >
                        <Icon icon="lucide:minus" width={14} />
                      </button>
                      <span className="cart-qty-num">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQty(productId, item.quantity + 1)} 
                        disabled={isSyncing} 
                        className="cart-qty-btn"
                      >
                        <Icon icon="lucide:plus" width={14} />
                      </button>
                    </div>
                    <span className="cart-item-total">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(productId)} 
                  className="cart-item-remove" 
                  disabled={isSyncing}
                  aria-label="Remove item"
                >
                  <Icon icon="lucide:trash-2" width={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary (Desktop) */}
        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h3>Order Summary</h3>
            
            <div className="cart-shipping-form">
              <h4 className="cart-shipping-title">
                <Icon icon="lucide:map-pin" width={16} /> Delivery Details
              </h4>
              <div className="cart-shipping-grid">
                <input type="text" name="fullName" placeholder="Full Name *" value={shippingInfo.fullName} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="phone" placeholder="Phone Number *" value={shippingInfo.phone} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="street" placeholder="Street Address *" value={shippingInfo.street} onChange={handleShippingChange} className="cart-input span-2" />
                <input type="text" name="apartment" placeholder="Apartment/Suite (Optional)" value={shippingInfo.apartment} onChange={handleShippingChange} className="cart-input span-2" />
                <input type="text" name="city" placeholder="City *" value={shippingInfo.city} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="state" placeholder="State *" value={shippingInfo.state} onChange={handleShippingChange} className="cart-input" />
                <input type="text" name="zipCode" placeholder="Zip Code *" value={shippingInfo.zipCode} onChange={handleShippingChange} className="cart-input" />
              </div>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal ({totalQty} items)</span>
              <span>₦{totalPrice.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery Fee</span>
              <span className={totalPrice > 15000 ? 'text-green' : ''}>
                {totalPrice > 15000 ? 'FREE' : '₦2,500'}
              </span>
            </div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span>₦{grandTotal.toLocaleString()}</span>
            </div>

            {error && (
              <div className="cart-error">
                <Icon icon="lucide:alert-circle" width={16} />
                {error}
              </div>
            )}

            <button 
              className="cart-checkout-btn" 
              onClick={handlePaystackCheckout}
              disabled={placing || isSyncing}
            >
              {placing || isSyncing ? (
                <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> {placing ? 'Processing...' : 'Saving...'}</>
              ) : (
                <><Icon icon="lucide:lock" width={16} /> Pay ₦{grandTotal.toLocaleString()} Securely</>
              )}
            </button>

            <div className="cart-or-divider">OR</div>

            <button 
              onClick={handleWhatsAppOrder} 
              disabled={placing || isSyncing}
              className="cart-whatsapp-btn"
            >
              {placing || isSyncing ? (
                <><Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} /> Placing Order...</>
              ) : (
                <><Icon icon="mdi:whatsapp" width={20} /> Order via WhatsApp</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="cart-mobile-sticky">
        {error && (
          <div className="cart-error">
            <Icon icon="lucide:alert-circle" width={16} />
            {error}
          </div>
        )}

        <div className={`cart-mobile-form-wrapper ${showMobileForm ? 'open' : ''}`}>
          <div className="cart-shipping-grid">
            <input type="text" name="fullName" placeholder="Full Name *" value={shippingInfo.fullName} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="phone" placeholder="Phone Number *" value={shippingInfo.phone} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="street" placeholder="Street Address *" value={shippingInfo.street} onChange={handleShippingChange} className="cart-input span-2" />
            <input type="text" name="apartment" placeholder="Apartment (Optional)" value={shippingInfo.apartment} onChange={handleShippingChange} className="cart-input span-2" />
            <input type="text" name="city" placeholder="City *" value={shippingInfo.city} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="state" placeholder="State *" value={shippingInfo.state} onChange={handleShippingChange} className="cart-input" />
            <input type="text" name="zipCode" placeholder="Zip Code *" value={shippingInfo.zipCode} onChange={handleShippingChange} className="cart-input span-2" />
          </div>
        </div>

        <div className="cart-mobile-actions">
          <button className="cart-mobile-details-btn" onClick={() => setShowMobileForm(!showMobileForm)}>
            <Icon icon="lucide:map-pin" width={16} />
            {showMobileForm ? 'Hide Details' : 'Delivery Details'}
          </button>
          
          <div className="cart-mobile-btn-group">
            <button 
              onClick={handlePaystackCheckout}
              disabled={placing || isSyncing}
              className="cart-mobile-pay-btn"
            >
              {placing || isSyncing ? (
                <Icon icon="lucide:loader-2" width={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>₦{grandTotal.toLocaleString()}</>
              )}
            </button>
            <button 
              onClick={handleWhatsAppOrder} 
              disabled={placing || isSyncing}
              className="cart-mobile-whatsapp-btn"
            >
              <Icon icon="mdi:whatsapp" width={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}