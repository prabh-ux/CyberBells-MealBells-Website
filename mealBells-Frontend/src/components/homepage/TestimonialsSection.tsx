import React from 'react'
import starIcon from '../../assets/star.png';
import avatar1 from '../../assets/avatar1.png';
import avatar2 from '../../assets/avatar2.png';
import avatar3 from '../../assets/avatar3.png';

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'HR Manager, TechFlow',
      avatar: avatar1,
      review: '"MealBells has completely removed the morning stress of tallying lunch orders. The automated reports are a lifesaver for our admin team."',
    },
    {
      name: 'Michael Chen',
      role: 'Engineer, Innovate Lab',
      avatar: avatar2,
      review: '"The mobile app is so intuitive. Being able to see what\'s for meal and providing feedback instantly has significantly boosted office morale."',
    },
    {
      name: "Robert D'Angelo",
      role: 'Director, GreenBites Catering',
      avatar: avatar3,
      review: '"As a catering vendor, MealBells is a game changer. We get precise counts daily, which has reduced our food waste by nearly 30%."',
    },
  ]

  return (
    <section className="w-full bg-[#F3F3F3] px-[clamp(1rem,4vw,12rem)] py-[clamp(3rem,5vw,12rem)]">

      {/* Heading */}
      <div style={{ fontFamily: "var(--font-inter)" }} className="flex flex-col items-center gap-[clamp(0.75rem,1vw,2rem)] mb-[clamp(2.5rem,4vw,8rem)] mx-auto max-w-[7680px]">
        <h2
          style={{ fontFamily: "var(--font-manrope)" }}
          className="text-[clamp(1.5rem,2.5vw,5rem)] font-bold text-center"
        >
          Loved by Teams
        </h2>
        <p className="text-[var(--text-muted)] text-[clamp(0.8rem,1vw,2rem)] text-center max-w-[clamp(16rem,35vw,60rem)]">
          See how MealBells is transforming the workplace experience across the globe.
        </p>
      </div>

      {/* Cards */}
      <div className="mx-auto max-w-[7680px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[clamp(1.25rem,2vw,4rem)]">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-white border border-gray-100 rounded-[clamp(1rem,1.2vw,2.5rem)] shadow-sm p-[clamp(1.25rem,2vw,4rem)] flex flex-col gap-[clamp(1.25rem,1.5vw,3rem)]"
          >
            {/* Stars */}
            <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.75rem)]">
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={starIcon}
                  alt="star"
                  className="w-[clamp(1rem,1.2vw,2.5rem)] h-[clamp(1rem,1.2vw,2.5rem)]"
                />
              ))}
            </div>

            {/* Review */}
            <p className="text-[var(--text-muted)] text-[clamp(0.8rem,1vw,2rem)] leading-relaxed italic">
              {t.review}
            </p>

            {/* Author */}
            <div className="flex items-center gap-[clamp(0.75rem,1vw,2rem)] mt-auto">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-[clamp(2.5rem,3vw,6rem)] h-[clamp(2.5rem,3vw,6rem)] rounded-full object-cover flex-shrink-0"
              />
              <div className="flex flex-col gap-[clamp(0.1rem,0.3vw,0.5rem)]">
                <span className="text-[var(--text-primary)] text-[clamp(0.8rem,1vw,2rem)] font-bold">{t.name}</span>
                <span className="text-[var(--text-muted)] text-[clamp(0.7rem,0.85vw,1.75rem)] font-semibold">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}

export default TestimonialsSection