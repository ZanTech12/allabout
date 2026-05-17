// src/components/Point.jsx
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import api from "../api/axios";
import { useCart } from "../context/CartContext"; // Assuming you have auth context

import "./Point.css"; // We'll create this below

export default function Point() {
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const { data } = await api.get("/payments/balance"); // Endpoint from Step 2
        setCoins(data.coins);
      } catch (error) {
        console.error("Failed to fetch coin balance");
      } finally {
        setLoading(false);
      }
    };
    fetchCoins();
  }, []);

  const nairaValue = coins * 100; // 1 Coin = ₦100

  return (
    <div className="point-card">
      <div className="point-card__header">
        <div className="point-card__icon-wrap">
          <Icon icon="lucide:coins" width={20} />
        </div>
        <span className="point-card__label">Loyalty Coins</span>
      </div>

      {loading ? (
        <div className="point-card__skeleton" />
      ) : (
        <div className="point-card__body">
          <h3 className="point-card__balance">{coins} <span>Coins</span></h3>
          <p className="point-card__value">Worth ₦{nairaValue.toLocaleString()}</p>
        </div>
      )}

      <div className="point-card__footer">
        <Icon icon="lucide:info" width={12} />
        <span>Earn 1 coin for every ₦10,000 spent</span>
      </div>
    </div>
  );
}