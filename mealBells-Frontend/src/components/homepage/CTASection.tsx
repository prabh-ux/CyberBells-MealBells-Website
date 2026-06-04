import { useScrollReveal } from "../../utils/useScrollReveal";
import CTASectionBg from '../../assets/CTASectionBg.png';

function CTASection() {
const { ref: sectionRef, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="w-full px-[clamp(1rem,4vw,12rem)] py-[clamp(2rem,3vw,8rem)]">
      <div
        ref={sectionRef}
        style={{ fontFamily: "var(--font-inter)" }}
        className={`
          relative rounded-[clamp(1.25rem,2vw,3rem)] overflow-hidden
          px-[clamp(1.25rem,6vw,14rem)] py-[clamp(3rem,6vw,14rem)]
          flex flex-col items-center gap-[clamp(1.25rem,2vw,4rem)]
          mx-auto max-w-[7680px]
          transition-all duration-1000 ease-out
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {/* Background Image */}
        <img
          src={CTASectionBg}
          alt=""
          className="absolute inset-0 w-full h-full object-fill object-center transition-transform duration-1000"
          style={{ transform: isVisible ? 'scale(1)' : 'scale(1.1)' }}
        />

        {/* Overlay for depth */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Heading */}
   <h2
  style={{
    fontFamily: "var(--font-manrope)",
    transitionDelay: "200ms",
  }}
  className={`
    relative text-white text-[clamp(1.5rem,3vw,6rem)] font-bold text-center leading-snug max-w-[clamp(18rem,45vw,80rem)]
    transition-all duration-700 ease-out
    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
  `}
>
          Ready to upgrade your office lunch system?
        </h2>

        {/* Subtitle */}
        <p
          className={`
            relative text-white text-[clamp(0.875rem,1.2vw,2.5rem)] text-center max-w-[clamp(18rem,45vw,80rem)]
            transition-all duration-700 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '350ms' }}
        >
          Join 120+ forward-thinking companies that have streamlined their office catering with MealBells.
        </p>

        {/* Buttons */}
        <div
          className={`
            relative flex flex-col sm:flex-row items-center gap-[clamp(0.75rem,1.2vw,2.5rem)] w-full sm:w-auto
            transition-all duration-700 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '500ms' }}
        >
          <button
            type="button"
            className="w-full sm:w-auto bg-white text-[var(--brand)] text-[clamp(0.875rem,1.1vw,2.25rem)] font-bold px-[clamp(1.5rem,2.5vw,5rem)] py-[clamp(0.75rem,1vw,2rem)] rounded-[clamp(0.75rem,1vw,1.5rem)] hover:bg-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Get Started Now
          </button>
          <button
            type="button"
            className="w-full sm:w-auto bg-transparent text-white text-[clamp(0.875rem,1.1vw,2.25rem)] font-bold px-[clamp(1.5rem,2.5vw,5rem)] py-[clamp(0.75rem,1vw,2rem)] rounded-[clamp(0.75rem,1vw,1.5rem)] border border-white/30 hover:bg-orange-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 active:translate-y-0"
          >
            Schedule a Demo
          </button>
        </div>

        {/* Fine print */}
        <p
          className={`
            relative text-white text-[clamp(0.75rem,0.9vw,1.75rem)]
            transition-all duration-700 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: '650ms' }}
        >
          No credit card required. 14-day free trial.
        </p>
      </div>
    </section>
  );
}

export default CTASection;