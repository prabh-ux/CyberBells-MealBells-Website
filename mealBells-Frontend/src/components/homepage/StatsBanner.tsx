import React from 'react'

function StatsBanner() {
  const stats = [
    { value: '15,000+', label: 'MEALS DELIVERED' },
    { value: '98%',     label: 'WASTE REDUCTION %' },
    { value: '120+',    label: 'HAPPY OFFICES' },
    { value: '4.9/5',  label: 'SATISFACTION SCORE' },
  ]

  return (
    <section className="w-full bg-[#994700] px-[clamp(1rem,4vw,12rem)] py-[clamp(2rem,3vw,8rem)]">
      <div className="mx-auto max-w-[7680px] grid grid-cols-2 lg:grid-cols-4 gap-y-[clamp(2rem,3vw,6rem)] gap-x-[clamp(1rem,2vw,4rem)]">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-[clamp(0.25rem,0.8vw,1.5rem)] px-[clamp(0.5rem,2vw,5rem)]"
          >
            <span
              style={{ fontFamily: "var(--font-manrope)" }}
              className="text-white text-[clamp(2rem,4vw,8rem)] font-extrabold tracking-tight"
            >
              {stat.value}
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)" }}
              className="text-white text-[clamp(0.65rem,0.9vw,1.75rem)] font-semibold tracking-widest text-center"
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsBanner