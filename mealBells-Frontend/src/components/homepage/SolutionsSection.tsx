import React from "react";
import solutionImage1 from "../../assets/solutionImage1.png";
import solutionImage2 from "../../assets/solutionImage2.png";
import solutionImage3 from "../../assets/solutionImage3.png";
import tickRounded from "../../assets/tickRounded.png";
import linkarrow from "../../assets/linkarrow.png";
import dowload from "../../assets/dowload.png";
import playstore from "../../assets/playstore.png";

function SolutionsSection() {
  return (
    <section className="w-full bg-white px-[clamp(1rem,4vw,12rem)] py-[clamp(3rem,5vw,12rem)] flex flex-col gap-[clamp(3.5rem,6vw,14rem)]">
      <div className="mx-auto w-full max-w-[7680px] flex flex-col gap-[clamp(3.5rem,6vw,14rem)]">

        {/* Row 1 — Text Left, Image Right */}
        <div className="flex flex-col lg:flex-row items-center gap-[clamp(2.5rem,4vw,10rem)]">
          <div className="flex flex-col gap-[clamp(1.25rem,1.5vw,3rem)] w-full lg:max-w-[45%]">
            <span
              style={{ fontFamily: "var(--font-manrope)", color: "var(--brand)" }}
              className="text-[clamp(0.65rem,0.8vw,1.5rem)] bg-[var(--brand)]/10 w-fit py-[clamp(0.2rem,0.4vw,0.75rem)] px-[clamp(0.75rem,1vw,2rem)] rounded-3xl font-semibold tracking-widest uppercase"
            >
              Control Center
            </span>
            <h2
              style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
              className="text-[clamp(1.5rem,2.5vw,5rem)] font-bold leading-snug"
            >
              Real-Time Admin Dashboard
            </h2>
            <p
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
              className="text-[clamp(0.875rem,1.1vw,2.25rem)] leading-relaxed"
            >
              Monitor meal distribution, vendor performance, and employee
              preferences through a powerful centralized hub. Get predictive
              insights on food waste and optimize your lunch budget effectively.
            </p>
            <ul
              style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
              className="flex flex-col gap-[clamp(0.5rem,0.8vw,1.5rem)] mt-1"
            >
              <li className="flex items-center gap-[clamp(0.5rem,0.8vw,1.5rem)] text-[clamp(0.875rem,1.1vw,2.25rem)]">
                <img src={tickRounded} alt="check" className="w-[clamp(1rem,1.2vw,2.5rem)] h-[clamp(1rem,1.2vw,2.5rem)] flex-shrink-0" />
                Live meal tally and tracking
              </li>
              <li className="flex items-center gap-[clamp(0.5rem,0.8vw,1.5rem)] text-[clamp(0.875rem,1.1vw,2.25rem)]">
                <img src={tickRounded} alt="check" className="w-[clamp(1rem,1.2vw,2.5rem)] h-[clamp(1rem,1.2vw,2.5rem)] flex-shrink-0" />
                Automated billing and invoices
              </li>
            </ul>
          </div>

          <div className="w-full lg:flex-1">
            <div className="bg-gray-100 rounded-[clamp(1rem,1.5vw,3rem)] p-[clamp(1rem,1.5vw,3rem)] flex items-center justify-center">
              <img src={solutionImage1} alt="Admin dashboard" className="w-full h-auto object-cover rounded-[clamp(0.75rem,1vw,2rem)]" />
            </div>
          </div>
        </div>

        {/* Row 2 — Image Left, Text Right */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-[clamp(2.5rem,4vw,10rem)]">
          <div className="w-full lg:flex-1">
            <img src={solutionImage2} alt="Vendor integration" className="w-full h-auto object-cover rounded-[clamp(0.75rem,1vw,2rem)]" />
          </div>

          <div className="flex flex-col gap-[clamp(1.25rem,1.5vw,3rem)] w-full lg:max-w-[45%]">
            <span
              style={{ fontFamily: "var(--font-manrope)" }}
              className="text-[clamp(0.65rem,0.8vw,1.5rem)] bg-[#555F71]/10 text-[#555F71] w-fit py-[clamp(0.2rem,0.4vw,0.75rem)] px-[clamp(0.75rem,1vw,2rem)] rounded-3xl font-semibold tracking-widest uppercase"
            >
              Control Center
            </span>
            <h2
              style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
              className="text-[clamp(1.5rem,2.5vw,5rem)] font-bold leading-snug"
            >
              Seamless Vendor Integration
            </h2>
            <p
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
              className="text-[clamp(0.875rem,1.1vw,2.25rem)] leading-relaxed"
            >
              Bridge the gap between your office and the kitchen. Vendors receive
              automated counts every morning, reducing miscommunication and
              ensuring every employee gets their preferred meal.
            </p>
            <a
              style={{ fontFamily: "var(--font-inter)", color: "var(--brand)" }}
              href="#"
              className="flex items-center gap-[clamp(0.25rem,0.5vw,1rem)] text-[clamp(0.8rem,1vw,2rem)] font-bold hover:underline w-fit"
            >
              Learn about vendor portals
              <img src={linkarrow} alt="arrow" className="w-[clamp(1rem,1.2vw,2.5rem)] h-[clamp(1rem,1.2vw,2.5rem)]" />
            </a>
          </div>
        </div>

        {/* Row 3 — Text Left, Image Right (natural size) */}
        <div className="flex flex-col lg:flex-row items-center gap-[clamp(2.5rem,4vw,10rem)]">
          <div className="flex flex-col gap-[clamp(1.25rem,1.5vw,3rem)] w-full lg:max-w-[45%]">
            <span
              style={{ fontFamily: "var(--font-manrope)" }}
              className="text-[clamp(0.65rem,0.8vw,1.5rem)] bg-[#00629D]/10 text-[#00629D] w-fit py-[clamp(0.2rem,0.4vw,0.75rem)] px-[clamp(0.75rem,1vw,2rem)] rounded-3xl font-semibold tracking-widest uppercase"
            >
              Accessibility
            </span>
            <h2
              style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
              className="text-[clamp(1.5rem,2.5vw,5rem)] font-bold leading-snug"
            >
              Employee-Centric Experience
            </h2>
            <p
              style={{ fontFamily: "var(--font-inter)", color: "var(--text-primary)" }}
              className="text-[clamp(0.875rem,1.1vw,2.25rem)] leading-relaxed"
            >
              A mobile app employees actually love to use. Browse the menu, select
              meals for the week, and provide instant feedback with just a few
              taps. Never miss a meal or a menu change again.
            </p>
            <div className="flex items-center gap-[clamp(0.5rem,0.8vw,1.5rem)] mt-1">
              <img src={dowload} alt="App Store" className="w-[clamp(2.5rem,3vw,6rem)] h-[clamp(2.5rem,3vw,6rem)]" />
              <img src={playstore} alt="Google Play" className="w-[clamp(2.5rem,3vw,6rem)] h-[clamp(2.5rem,3vw,6rem)]" />
            </div>
          </div>

          <div className="flex-shrink-0 flex-1 flex items-center justify-center">
            <div className="rounded-[clamp(1rem,1.5vw,3rem)] p-[clamp(1rem,1.5vw,3rem)] flex items-center justify-center">
              <img src={solutionImage3} alt="Employee app" className="h-auto object-contain rounded-[clamp(0.75rem,1vw,2rem)]" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default SolutionsSection;