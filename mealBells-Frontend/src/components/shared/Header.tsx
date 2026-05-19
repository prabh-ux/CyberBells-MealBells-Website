import React, { useState, useEffect } from "react";
import headerLogo from "../../assets/headerLogo.png";
import { useNavigate } from "react-router";

function Header() {
  const links = ["Features", "Solutions", "Pricing", "Success Stories"];
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="w-full relative bg-[#FFFCF7]">
      {/* Top bar */}
      <div className="mx-auto w-full max-w-[7680px] flex items-center justify-between px-[clamp(1rem,4vw,12rem)] h-[clamp(4rem,6vw,10rem)]">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-[clamp(0.5rem,0.8vw,1.5rem)] z-50 relative"
        >
          <img
            src={headerLogo}
            alt="logo"
            className="object-contain w-[clamp(1.75rem,2.5vw,5rem)] h-[clamp(1.75rem,2.5vw,5rem)]"
          />
          <span
            style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
            className="font-bold text-[clamp(1.1rem,1.5vw,3.5rem)]"
          >
            MealBells
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-[clamp(1.5rem,3vw,6rem)]">
          {links.map((item, index) => (
            <button
              key={index}
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
              className="font-semibold text-[clamp(0.875rem,1vw,2rem)] hover:text-gray-900 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Desktop CTA buttons */}
        <div className="hidden lg:flex items-center gap-[clamp(0.75rem,1vw,2rem)]">
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
            className="font-medium border border-[#8C7263] rounded-[clamp(0.5rem,0.6vw,1rem)] text-[clamp(0.875rem,1vw,2rem)] px-[clamp(1.25rem,1.5vw,3rem)] py-[clamp(0.5rem,0.7vw,1.5rem)] hover:bg-gray-50 transition-all"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{ fontFamily: "var(--font-inter)" }}
            className="text-white font-normal bg-orange-500 rounded-[clamp(0.5rem,0.6vw,1rem)] text-[clamp(0.875rem,1vw,2rem)] px-[clamp(1.25rem,1.5vw,3rem)] py-[clamp(0.5rem,0.7vw,1.5rem)] hover:bg-orange-600 transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Hamburger (mobile/tablet only) */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="lg:hidden z-50 relative flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-[2px] bg-gray-800 rounded-full transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-5 h-[2px] bg-gray-800 rounded-full transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
          <span className={`block w-5 h-[2px] bg-gray-800 rounded-full transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </div>

      {/* Mobile/Tablet dropdown */}
      <div
        className={`lg:hidden absolute top-16 left-0 w-full bg-white border-t border-gray-100 shadow-lg z-40 transition-all duration-300 ease-in-out overflow-hidden ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col px-4 sm:px-6 py-4 gap-1">
          {links.map((item, index) => (
            <button
              key={index}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
              className="text-left text-[15px] font-semibold py-3 px-2 rounded-lg hover:bg-orange-50 hover:text-orange-500 transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 sm:px-6 pb-5 pt-1">
          <button
            type="button"
            onClick={() => { navigate('/login'); setMenuOpen(false); }}
            style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
            className="text-sm font-medium border border-[#8C7263] rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-all"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { navigate('/register'); setMenuOpen(false); }}
            style={{ fontFamily: "var(--font-inter)" }}
            className="text-white text-sm font-normal bg-orange-500 rounded-lg px-5 py-2.5 hover:bg-orange-600 transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;