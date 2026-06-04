import watchDemoLogo from '../../assets/watchDemoLogo.png';
import heroImage from '../../assets/heroSectionImage.png';
import { useScrollReveal } from '../../utils/useScrollReveal';

const Hero = () => {
  const { ref: heroRef, isVisible } =
    useScrollReveal<HTMLDivElement>();

  return (
    <section className="w-full bg-gradient-to-tl from-[#FFF7ED] to-[#FFFCF7]">
      <div
        ref={heroRef}
        className="mx-auto w-full max-w-[7680px] px-[clamp(1rem,4vw,12rem)] py-[clamp(2.5rem,5vw,16rem)] flex flex-col-reverse lg:flex-row items-center justify-between gap-[clamp(2.5rem,4vw,10rem)]"
      >
        {/* Left Content */}
        <div
          className={`
            flex flex-col gap-[clamp(1.25rem,2vw,3.5rem)]
            w-full lg:max-w-[50%]
            text-center lg:text-left
            items-center lg:items-start
            transition-all duration-1000 ease-out
            ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-12'
            }
          `}
        >
          {/* Heading */}
          <h1
            className={`
              font-[var(--font-manrope)]
              text-[var(--text-primary)]
              text-[clamp(2.25rem,5vw,12rem)]
              font-normal
              leading-[1.1]
              transition-all duration-700 ease-out
              ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: '150ms' }}
          >
            Smart Meal <br />
            Management for <br />
            <span className="text-[var(--brand)]">
              Smart Offices
            </span>
          </h1>

          {/* Description */}
          <p
            className={`
              font-[var(--font-inter)]
              text-[var(--text-primary)]
              text-[clamp(0.875rem,1.4vw,3rem)]
              leading-relaxed
              max-w-md
              lg:max-w-none
              transition-all duration-700 ease-out
              ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: '300ms' }}
          >
            Revolutionize your office catering with automated tiffin
            counts, real-time employee feedback, and seamless vendor
            coordination on one sleek platform.
          </p>

          {/* Buttons */}
          <div
            className={`
              flex flex-col sm:flex-row
              items-center
              gap-3
              sm:gap-[clamp(1rem,1.5vw,3rem)]
              mt-2
              w-full
              sm:w-auto
              transition-all duration-700 ease-out
              ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }
            `}
            style={{ transitionDelay: '450ms' }}
          >
            <button
              type="button"
              className="
                w-full sm:w-auto
                font-[var(--font-inter)]
                text-[clamp(0.9rem,1.2vw,2.5rem)]
                bg-orange-500
                hover:bg-orange-600
                text-white
                font-semibold
                px-[clamp(1.5rem,2.5vw,5rem)]
                py-[clamp(0.75rem,1.2vw,2.5rem)]
                rounded-lg
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-lg
              "
            >
              Get Started Now
            </button>

            <button
              type="button"
              className="
                w-full sm:w-auto
                font-[var(--font-inter)]
                text-[var(--text-primary)]
                text-[clamp(0.9rem,1.2vw,2.5rem)]
                flex items-center justify-center gap-2
                font-bold
                border border-[#8C7263]
                px-[clamp(1.5rem,2.5vw,5rem)]
                py-[clamp(0.75rem,1.2vw,2.5rem)]
                rounded-lg
                hover:bg-gray-100
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <img
                src={watchDemoLogo}
                alt="play"
                className="w-[clamp(1.25rem,1.5vw,3rem)] h-[clamp(1.25rem,1.5vw,3rem)]"
              />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div
          className={`
            flex-shrink-0
            w-full
            lg:w-[45%]
            flex
            justify-center
            transition-all duration-1000 ease-out
            ${
              isVisible
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-12 scale-95'
            }
          `}
          style={{ transitionDelay: '250ms' }}
        >
          <img
            src={heroImage}
            alt="Meal management dashboard"
            className="
              w-full
              max-w-[320px]
              sm:max-w-[420px]
              lg:max-w-none
              lg:w-full
              h-auto
              object-cover
              rounded-2xl
            "
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;