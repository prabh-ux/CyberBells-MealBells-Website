import calander from '../../assets/calander.png';
import attendence from '../../assets/attendence.png';
import attendence2 from '../../assets/attendence2.png';
import star from '../../assets/star.png';

function FeaturesSection() {
  const features = [
    {
      icon: calander,
      iconBg: 'bg-[#994700]/10',
      title: 'Daily Menu Updates',
      description: 'Real-time menu notifications and selection reminders for every employee.',
    },
    {
      icon: attendence,
      iconBg: 'bg-[#00629D]/10',
      title: 'Smart Attendance',
      description: 'Sync Meal plans automatically with office attendance and remote status.',
    },
    {
      icon: attendence2,
      iconBg: 'bg-[#00629D]/10',
      title: 'Tiffin Automation',
      description: 'Eliminate manual counting with automatic tallying and vendor reporting.',
    },
    {
      icon: star,
      iconBg: 'bg-[#994700]/10',
      title: 'Ratings & Reviews',
      description: 'Gather immediate feedback on food quality to maintain high catering standards.',
    },
  ]

  return (
    <section className="w-full bg-gray-50 px-[clamp(1rem,4vw,12rem)] py-[clamp(2.5rem,4vw,10rem)]">
      <div className="mx-auto max-w-[7680px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[clamp(1rem,1.5vw,3rem)]">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white rounded-[clamp(1rem,1.2vw,2rem)] p-[clamp(1.25rem,2vw,4rem)] flex flex-col gap-[clamp(1rem,1.2vw,2.5rem)] border border-gray-100 shadow-sm"
          >
            {/* Icon Box */}
            <div className={`w-[clamp(3rem,4vw,8rem)] h-[clamp(3rem,4vw,8rem)] rounded-[clamp(0.75rem,1vw,1.5rem)] flex items-center justify-center ${feature.iconBg}`}>
              <img
                src={feature.icon}
                alt={feature.title}
                className="w-[clamp(1.5rem,2vw,4rem)] h-[clamp(1.5rem,2vw,4rem)] object-contain opacity-80"
              />
            </div>

            {/* Title */}
            <h3
              style={{ fontFamily: "var(--font-manrope)", color: "var(--text-primary)" }}
              className="font-bold text-[clamp(1rem,1.2vw,2.25rem)]"
            >
              {feature.title}
            </h3>

            {/* Description */}
            <p
              style={{ fontFamily: "var(--font-inter)" }}
              className="text-[#584235] text-[clamp(0.8rem,1vw,2rem)] leading-relaxed"
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection