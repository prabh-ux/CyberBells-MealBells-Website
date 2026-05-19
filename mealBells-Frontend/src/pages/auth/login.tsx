import React, { useState } from "react";
import "../../App.css";
import loginLeftSection from "../../assets/loginLeftSection.png";
import eye from "../../assets/eye.png";
import lock from "../../assets/lock.png";
import folkAndKnife from "../../assets/folkandKnife.png";
import emailIcon from "../../assets/email.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 lg:px-[140px] py-10 lg:py-[168px]"
      style={{ backgroundColor: "var(--page-bg)", fontFamily: "var(--font-manrope)" }}
    >
      {/* Main Card */}
      <div
        className="flex w-full max-w-[1000px] rounded-[12px] overflow-hidden bg-white"
        style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}
      >
        {/* Left Panel */}
        <div className="hidden md:flex md:w-[50%] items-center justify-center">
          <img
            src={loginLeftSection}
            alt="Login visual"
            className="w-full h-full object-fit"
          />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-[50px] lg:py-[48px]">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <img src={folkAndKnife} alt="fork and knife" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span
              className="text-2xl sm:text-3xl lg:text-[32px] font-normal tracking-tight"
              style={{ color: "var(--brand)", fontFamily: "var(--font-manrope)" }}
            >
              MealBells
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-sm sm:text-base font-normal mb-1 sm:mb-2"
            style={{ color: "var(--text-primary)" , fontFamily: "var(--font-manrope)"}}
          >
            Welcome Back
          </h1>

          <p
            className="text-sm sm:text-base mb-6 sm:mb-8 lg:mb-10"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-inter)" }}
          >
            Please enter your details to sign in.
          </p>

          {/* Email */}
          <div className="mb-4 sm:mb-6">
            <label
              className="block text-[11px] sm:text-[13px] lg:text-base font-normal tracking-[2px] mb-2 sm:mb-3 uppercase"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              Email Address
            </label>
            <div
              className="flex items-center rounded-xl sm:rounded-2xl px-4 sm:px-5 h-[54px] sm:h-[60px] lg:h-[64px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
              style={{ border: "1px solid var(--border)" }}
            >
              <img src={emailIcon} alt="mail" className="w-4 h-4 sm:w-5 sm:h-5 mr-3 sm:mr-4 flex-shrink-0 object-contain opacity-80" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mealbells.com"
                className="flex-1 outline-none text-[13px] sm:text-[15px] text-gray-700 bg-transparent min-w-0"
                style={{ fontFamily: "var(--font-inter)", "--tw-placeholder-color": "var(--placeholder)" } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-[11px] sm:text-[13px] lg:text-base font-normal tracking-[2px] mb-2 sm:mb-3 uppercase"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-inter)" }}
            >
              Password
            </label>
            <div
              className="flex items-center rounded-xl sm:rounded-2xl px-4 sm:px-5 h-[54px] sm:h-[60px] lg:h-[64px] bg-white transition-all focus-within:outline focus-within:outline-2 focus-within:outline-orange-400"
              style={{ border: "1px solid var(--border)" }}
            >
              <img src={lock} alt="lock" className="w-4 h-4 sm:w-5 sm:h-5 mr-3 sm:mr-4 flex-shrink-0 object-contain opacity-80" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 outline-none text-[13px] sm:text-[15px] text-gray-700 bg-transparent tracking-[4px] min-w-0"
                style={{ fontFamily: "var(--font-inter)" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 flex-shrink-0">
                <img src={eye} alt="toggle password visibility" className="w-4 h-4 sm:w-5 sm:h-5 hover:opacity-70 transition object-contain" />
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end mt-4 sm:mt-5 mb-5 sm:mb-6">
            <a
              href="#"
              className="text-[13px] sm:text-[15px] font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--brand)" }}
            >
              Forgot Password?
            </a>
          </div>

          {/* Sign In Button */}
          <button  style={{  fontFamily: "var(--font-inter)" }}

            type="button"
            className="w-full h-[54px] sm:h-[60px] lg:h-[64px] bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium tracking-[4px] text-[13px] sm:text-[15px] rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md"
          >
            SIGN IN
          </button>

          {/* Divider */}
          <div className="flex items-center my-8 sm:my-10 lg:my-14 gap-3 sm:gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--divider)" }} />
            <span
              className="text-[10px] sm:text-[11px] lg:text-[12px] tracking-[2px] font-medium uppercase whitespace-nowrap"
              style={{ color: "var(--text-divider)" }}
            >
              Authorized Access Only
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--divider)" }} />
          </div>

          {/* Contact */}
          <p className="text-center text-[13px] sm:text-[15px]" style={{ color: "var(--text-muted)" }}>
            New admin?{" "}
            <a
              href="#"
              className="font-medium hover:opacity-80 transition-opacity"
              style={{ color: "var(--brand)" }}
            >
              Contact System Owner
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p
        className="mt-8 sm:mt-12 lg:mt-[70px] text-[13px] sm:text-sm text-center"
        style={{ color: "var(--text-footer)" }}
      >
        © 2026 MealBells Admin Panel. All rights reserved.
      </p>
    </div>
  );
};

export default Login;