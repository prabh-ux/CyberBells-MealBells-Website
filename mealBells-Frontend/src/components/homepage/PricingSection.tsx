import tick from "../../assets/tick.png";

function PricingSection() {
  const plans = [
    {
      name: 'Basic',
      subtitle: 'For small startups',
      price: '$49',
      period: '/month',
      features: ['Up to 25 employees', 'Weekly menu selection', 'Basic reporting'],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Standard',
      subtitle: 'For growing companies',
      price: '$129',
      period: '/month',
      features: [
        'Up to 100 employees',
        'Real-time admin dashboard',
        'Vendor portal integration',
        'Employee feedback tools',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Enterprise',
      subtitle: 'Customized for large scale',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited employees',
        'Multi-vendor management',
        'SSO & Advanced Security',
        '24/7 Priority Support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <section className="w-full bg-[#F9F9F9] px-[clamp(1rem,4vw,12rem)] py-[clamp(3rem,5vw,12rem)]">

      {/* Heading */}
      <div className="flex flex-col items-center gap-[clamp(0.75rem,1vw,2rem)] mb-[clamp(2.5rem,4vw,8rem)] mx-auto max-w-[7680px]">
        <h2
          style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
          className="text-[clamp(1.5rem,2.5vw,5rem)] font-bold text-center"
        >
          Simple, Transparent Pricing
        </h2>
        <p
          style={{ fontFamily: "var(--font-inter)" }}
          className="text-[#584235] text-[clamp(0.875rem,1.2vw,2.5rem)] font-medium text-center max-w-[clamp(20rem,50vw,90rem)]"
        >
          Choose the perfect plan for your office scale. No hidden fees, just great food management.
        </p>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-[7680px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1.25rem,2vw,4rem)] items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{ fontFamily: "var(--font-inter)" }}
            className={`relative bg-white rounded-[clamp(1rem,1.2vw,2.5rem)] p-[clamp(1.5rem,2.5vw,5rem)] flex flex-col gap-[clamp(2rem,3vw,6rem)] ${
              plan.popular
                ? 'border-2 border-[var(--brand)] shadow-md'
                : 'border border-gray-100 shadow-sm'
            }`}
          >
            {/* Most Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-[var(--brand)] text-white text-[clamp(0.65rem,0.8vw,1.5rem)] font-bold px-[clamp(1rem,1.5vw,3rem)] py-[clamp(0.25rem,0.5vw,1rem)] rounded-full tracking-widest uppercase whitespace-nowrap">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Name */}
            <div className="flex flex-col gap-[clamp(0.25rem,0.5vw,1rem)]">
              <h3
                style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
                className="text-[clamp(1rem,1.3vw,2.75rem)] font-bold"
              >
                {plan.name}
              </h3>
              <p className="text-[var(--text-muted)] text-[clamp(0.8rem,1vw,2rem)]">
                {plan.subtitle}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-end gap-[clamp(0.25rem,0.5vw,1rem)]">
              <span className="font-bold leading-none text-[clamp(2rem,3vw,6rem)]">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-[var(--text-muted)] text-[clamp(0.875rem,1vw,2rem)]">
                  {plan.period}
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-[clamp(1rem,1.5vw,3rem)]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-[clamp(0.5rem,0.8vw,1.5rem)] text-[clamp(0.8rem,1vw,2rem)] text-gray-600">
                  <img
                    src={tick}
                    alt="check"
                    className="w-[clamp(1rem,1.2vw,2.5rem)] h-[clamp(1rem,1.2vw,2.5rem)] flex-shrink-0"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              type="button"
              className={`w-full py-[clamp(0.75rem,1vw,2rem)] rounded-[clamp(0.75rem,1vw,1.5rem)] text-[clamp(0.8rem,1vw,2rem)] font-semibold transition-all duration-200 mt-auto ${
                plan.popular
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-white text-[var(--text-primary)] border border-[#8C7263] hover:bg-gray-50'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

    </section>
  )
}

export default PricingSection