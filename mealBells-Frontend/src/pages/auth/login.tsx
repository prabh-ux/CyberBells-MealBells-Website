import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { loginUser, resetLogin } from "../../slices/authSlice";
import "../../App.css";
import loginLeftSection from "../../assets/loginLeftSection.png";
import eye from "../../assets/eye.png";
import lock from "../../assets/lock.png";
import folkAndKnife from "../../assets/folkAndKnife.png";
import emailIcon from "../../assets/email.png";

const Login = () => {
  const dispatch   = useDispatch<AppDispatch>();
  const navigate   = useNavigate();
  const { loggingIn, loginSuccess, error } = useSelector((s: RootState) => s.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [localError, setLocalError]     = useState("");

  // Clean up Redux login state on unmount
  useEffect(() => {
    return () => { dispatch(resetLogin()); };
  }, [dispatch]);

  // Redirect after successful login
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => navigate("/admin"), 1500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

  const handleLogin = () => {
    setLocalError("");

    if (!email || !password) {
      setLocalError("Please enter your email and password.");
      return;
    }

    dispatch(loginUser({ email, password }));
  };

  const displayError = localError || error;

  return (
    <div
      className="min-h-screen w-full grid place-items-center px-4 sm:px-8 py-8"
      style={{ backgroundColor: "var(--page-bg)", fontFamily: "var(--font-manrope)" }}
    >
      <div className="w-full max-w-[780px]">

        {/* Main Card */}
        <div
          className="flex w-full rounded-[12px] bg-white"
          style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}
        >
          {/* Left Panel */}
          <div className="hidden md:flex md:w-[42%] flex-shrink-0 rounded-l-[12px] overflow-hidden">
            <img
              src={loginLeftSection}
              alt="Login visual"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col px-7 py-6 lg:px-9 lg:py-7 rounded-r-[12px] rounded-l-[12px] md:rounded-l-none">

            {/* Logo */}
            <div className="flex items-center gap-2 mb-2">
              <img src={folkAndKnife} alt="fork and knife" className="w-5 h-5" />
              <span
                className="text-[26px] font-normal tracking-tight"
                style={{ color: "var(--brand)", fontFamily: "var(--font-manrope)" }}
              >
                MealBells
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-sm font-normal mb-0.5"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope)" }}
            >
              Welcome Back
            </h1>
            <p
              className="text-[13px] mb-4"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
            >
              Please enter your details to sign in.
            </p>

            {/* Email */}
            <div className="mb-3">
              <label
                className="block text-[11px] font-normal tracking-[2px] mb-1.5 uppercase"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                Email Address
              </label>
              <div
                className="flex items-center rounded-xl px-4 h-[48px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
                style={{ border: "1px solid var(--border)" }}
              >
                <img src={emailIcon} alt="mail" className="w-4 h-4 mr-3 flex-shrink-0 object-contain opacity-80" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mealbells.com"
                  className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent min-w-0"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-1">
              <label
                className="block text-[11px] font-normal tracking-[2px] mb-1.5 uppercase"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                Password
              </label>
              <div
                className="flex items-center rounded-xl px-4 h-[48px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
                style={{ border: "1px solid var(--border)" }}
              >
                <img src={lock} alt="lock" className="w-4 h-4 mr-3 flex-shrink-0 object-contain opacity-80" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent tracking-[4px] min-w-0"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 flex-shrink-0">
                  <img src={eye} alt="toggle" className="w-4 h-4 hover:opacity-70 transition object-contain" />
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end mt-2 mb-3">
              <Link
                to="/forgot-password"
                className="text-[12px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: "var(--brand)" }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Box */}
            {displayError && (
              <div
                className="flex items-start gap-2 mb-2.5 px-3 py-2.5 rounded-lg border text-[12px]"
                style={{
                  backgroundColor: "#fff5f5",
                  borderColor: "#fecaca",
                  color: "#dc2626",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{displayError}</span>
              </div>
            )}

            {/* Success Box */}
            {loginSuccess && (
              <div
                className="flex items-start gap-2 mb-2.5 px-3 py-2.5 rounded-lg border text-[12px]"
                style={{
                  backgroundColor: "#f0fdf4",
                  borderColor: "#bbf7d0",
                  color: "#16a34a",
                  fontFamily: "var(--font-inter)",
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span>{loginSuccess}</span>
              </div>
            )}

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={loggingIn || !!loginSuccess}
              type="button"
              className="w-full h-[48px] bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium tracking-[4px] text-[13px] rounded-xl transition-all duration-200 shadow-md"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {loggingIn ? "SIGNING IN..." : loginSuccess ? "REDIRECTING..." : "SIGN IN"}
            </button>

            {/* Sign Up */}
            <p
              className="text-center text-[13px] mt-3"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "var(--brand)" }}
              >
                Sign Up
              </Link>
            </p>

            {/* Divider */}
            <div className="flex items-center my-3 gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--divider)" }} />
              <span
                className="text-[10px] tracking-[2px] font-medium uppercase whitespace-nowrap"
                style={{ color: "var(--text-divider)" }}
              >
                Authorized Access Only
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--divider)" }} />
            </div>

            {/* Contact */}
            <p
              className="text-center text-[13px]"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              New admin?{" "}
              <Link
                to="mailto:owner@mealbells.com"
                className="font-medium hover:opacity-80 transition-opacity"
                style={{ color: "var(--brand)" }}
              >
                Contact System Owner
              </Link>
            </p>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-[12px] text-center" style={{ color: "var(--text-footer)" }}>
          © 2026 MealBells Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;