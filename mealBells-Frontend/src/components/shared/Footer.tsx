import headerLogo from "../../assets/headerLogo.png";

function Footer() {
  const columns = [
    {
      heading: 'Product',
      links: ['Features', 'Integrations', 'Mobile App', 'Enterprise'],
    },
    {
      heading: 'Resources',
      links: ['Help Center', 'API Docs', 'Customer Stories', 'Pricing'],
    },
    {
      heading: 'Contact',
      links: ['Support', 'Sales', 'Twitter', 'Linkedin'],
    },
  ]

  return (
    <footer
      style={{ fontFamily: "var(--font-inter)" }}
      className="w-full px-[clamp(1rem,4vw,12rem)] pt-[clamp(2.5rem,3vw,6rem)] pb-[clamp(1.5rem,2vw,4rem)] flex flex-col gap-[clamp(2rem,3vw,5rem)]"
    >

      {/* Centered content wrapper — fluid max-width for 2K/4K/8K */}
      <div className="w-full mx-auto max-w-[clamp(900px,90vw,2600px)] flex flex-col gap-[clamp(2rem,3vw,5rem)]">

        {/* Top Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(1.5rem,3vw,5rem)]">

          {/* Logo + Tagline */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-[clamp(0.75rem,1.2vw,2rem)]">
            <div className="flex items-center gap-[clamp(0.4rem,0.6vw,1rem)]">
              <img
                src={headerLogo}
                alt="MealBells logo"
                className="w-[clamp(1.5rem,2vw,3.5rem)] h-[clamp(1.5rem,2vw,3.5rem)] object-contain"
              />
              <span
                style={{ fontFamily: "var(--font-manrope)" }}
                className="text-[var(--text-primary)] font-bold text-[clamp(1rem,1.4vw,2rem)]"
              >
                MealBells
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-[clamp(0.75rem,0.9vw,1.25rem)] leading-relaxed max-w-[clamp(16rem,20vw,32rem)]">
              Empowering offices to eat better and waste less through intelligent meal management.
            </p>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-[clamp(0.75rem,1.2vw,2.5rem)]">
              <h4 className="text-[var(--text-primary)] text-[clamp(0.65rem,0.75vw,1rem)] font-extrabold tracking-widest uppercase">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-[clamp(0.6rem,0.9vw,1.75rem)]">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[var(--text-muted)] text-[clamp(0.75rem,0.9vw,1.25rem)] hover:text-gray-700 transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
          <p className="text-[var(--text-muted)] text-[clamp(0.7rem,0.8vw,1.1rem)]">
            © 2024 MealBells Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-[clamp(1rem,2vw,3rem)]">
            <a
              href="#"
              className="text-[var(--text-muted)] text-[clamp(0.7rem,0.8vw,1.1rem)] hover:text-gray-700 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[var(--text-muted)] text-[clamp(0.7rem,0.8vw,1.1rem)] hover:text-gray-700 transition-colors duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer