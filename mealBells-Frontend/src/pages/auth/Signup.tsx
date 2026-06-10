import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { signupUser, resetSignup } from "../../slices/authSlice";
import "../../App.css";
import loginLeftSection from "../../assets/loginLeftSection.png";
import eye from "../../assets/eye.png";
import lock from "../../assets/lock.png";
import folkAndKnife from "../../assets/folkAndKnife.png";
import emailIcon from "../../assets/email.png";

const getRouteByType = (type: string) => {
  if (type === "vendor") return "/vendor";
  if (type === "admin")  return "/admin";
  return "/user";
};

const Signup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { signingUp, signupSuccess, error, user } = useSelector((s: RootState) => s.auth);

  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName]                               = useState("");
  const [email, setEmail]                             = useState("");
  const [password, setPassword]                       = useState("");
  const [confirmPassword, setConfirmPassword]         = useState("");
  const [localError, setLocalError]                   = useState("");

  useEffect(() => {
    return () => { dispatch(resetSignup()); };
  }, [dispatch]);

  // Redirect after successful signup — route depends on user.type
  useEffect(() => {
    if (signupSuccess && user) {
      const route = getRouteByType(user.type);
      navigate(route);
    }
  }, [signupSuccess, user, navigate]);

  const handleSignup = () => {
    setLocalError("");

    if (!name || !email || !password || !confirmPassword) {
      setLocalError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    dispatch(signupUser({ name, email, password }));
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
              alt="Signup visual"
              className="w-full h-full object-fit"
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
              Create Account
            </h1>
            <p
              className="text-[13px] mb-4"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
            >
              Fill in the details below to create your account.
            </p>

            {/* Full Name */}
            <div className="mb-3">
              <label
                className="block text-[11px] font-normal tracking-[2px] mb-1.5 uppercase"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                Full Name
              </label>
              <div
                className="flex items-center rounded-xl px-4 h-[48px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
                style={{ border: "1px solid var(--border)" }}
              >
                <svg
                  className="w-4 h-4 mr-3 flex-shrink-0 opacity-80"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent min-w-0"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
            </div>

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
            <div className="mb-3">
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

            {/* Confirm Password */}
            <div className="mb-1">
              <label
                className="block text-[11px] font-normal tracking-[2px] mb-1.5 uppercase"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
              >
                Confirm Password
              </label>
              <div
                className="flex items-center rounded-xl px-4 h-[48px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
                style={{ border: "1px solid var(--border)" }}
              >
                <img src={lock} alt="lock" className="w-4 h-4 mr-3 flex-shrink-0 object-contain opacity-80" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent tracking-[4px] min-w-0"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-2 flex-shrink-0">
                  <img src={eye} alt="toggle" className="w-4 h-4 hover:opacity-70 transition object-contain" />
                </button>
              </div>
            </div>

            {/* Error Box */}
            {displayError && (
              <div
                className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg border text-[12px]"
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

            {/* Create Account Button */}
            <button
              onClick={handleSignup}
              disabled={signingUp}
              type="button"
              className="w-full mt-3 h-[48px] bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium tracking-[4px] text-[13px] rounded-xl transition-all duration-200 shadow-md"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {signingUp ? "CREATING..." : "CREATE ACCOUNT"}
            </button>

            {/* Already have account */}
            <p
              className="text-center text-[13px] mt-3"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "var(--brand)" }}
              >
                Sign In
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
              Need access?{" "}
              <Link
                to="/contact"
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

export default Signup;