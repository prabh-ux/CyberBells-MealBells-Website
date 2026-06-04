import { useState } from "react";
import { Link } from "react-router-dom";
import "../../App.css";
import loginLeftSection from "../../assets/loginLeftSection.png";
import emailIcon from "../../assets/email.png";
import folkAndKnife from "../../assets/folkAndKnife.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSubmit = () => {
    setLocalError("");

    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setSendingReset(true);

    // Simulate API call — replace with real backend later
    setTimeout(() => {
      setSendingReset(false);
      setResetSent(true);
    }, 1500);
  };

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
              alt="Forgot password visual"
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
              Forgot Password?
            </h1>
            <p
              className="text-[13px] mb-4"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
            >
              Enter your email and we'll send you a link to reset your password.
            </p>

            {/* Success State */}
            {resetSent ? (
              <div className="flex flex-col items-center text-center py-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full mb-3"
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h2
                  className="text-[15px] font-medium mb-1"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-manrope)" }}
                >
                  Check Your Email
                </h2>
                <p
                  className="text-[13px] mb-4"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                >
                  We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <Link
                  to="/login"
                  className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                  style={{ color: "var(--brand)" }}
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
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

                {/* Error Box */}
                {localError && (
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
                    <span>{localError}</span>
                  </div>
                )}

                {/* Send Reset Link Button */}
                <button
                  onClick={handleSubmit}
                  disabled={sendingReset}
                  type="button"
                  className="w-full h-[48px] bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium tracking-[4px] text-[13px] rounded-xl transition-all duration-200 shadow-md"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {sendingReset ? "SENDING..." : "SEND RESET LINK"}
                </button>

                {/* Back to Login */}
                <p
                  className="text-center text-[13px] mt-3"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
                >
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: "var(--brand)" }}
                  >
                    Sign In
                  </Link>
                </p>
              </>
            )}

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
              Need help?{" "}
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

export default ForgotPassword;