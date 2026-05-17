// src/pages/RegisterEngineer.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "./RegisterEngineer.css";

export default function RegisterEngineer() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.inviteCode.trim()) return "Engineer invite code is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/register-engineer", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        inviteCode: form.inviteCode,
      });

      if (data.success && data.token) {
        login(data.token, data.user);
        navigate("/");
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eng-register-page">
      <div className="eng-register-container">
        <div className="eng-register-header">
          <div className="eng-register-icon">
            <Icon icon="lucide:wrench" width={28} />
          </div>
          <h1>Engineer Access</h1>
          <p>Register to view pricing, margins, and internal product data</p>
        </div>

        {error && (
          <div className="eng-register-error">
            <Icon icon="lucide:alert-circle" width={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="eng-register-form">
          {/* Invite Code — at the top for visibility */}
          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:key" width={14} />
              Engineer Invite Code *
            </label>
            <input
              type="text"
              name="inviteCode"
              value={form.inviteCode}
              onChange={handleChange}
              placeholder="Enter your invite code"
              required
            />
            <span className="eng-register-hint">
              Contact admin if you don't have an invite code
            </span>
          </div>

          <div className="eng-register-divider">
            <span>Your Details</span>
          </div>

          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:user" width={14} />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:mail" width={14} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="engineer@company.com"
              required
            />
          </div>

          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:phone" width={14} />
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+234 800 000 0000"
              required
            />
          </div>

          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:lock" width={14} />
              Password *
            </label>
            <div className="eng-register-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eng-register-toggle-pw"
              >
                <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width={18} />
              </button>
            </div>
          </div>

          <div className="eng-register-field">
            <label>
              <Icon icon="lucide:lock" width={14} />
              Confirm Password *
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="eng-register-submit"
          >
            {loading ? (
              <>
                <Icon icon="lucide:loader-2" width={18} style={{ animation: "spin 1s linear infinite" }} />
                Creating Account...
              </>
            ) : (
              <>
                <Icon icon="lucide:wrench" width={18} />
                Register as Engineer
              </>
            )}
          </button>
        </form>

        <div className="eng-register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
          <p>
            Regular customer?{" "}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}