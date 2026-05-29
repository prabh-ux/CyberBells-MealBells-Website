import { useEffect, useRef, useState } from "react";

interface Stat {
  value: string;
  label: string;
  numeric: number;
  suffix: string;
  prefix: string;
  decimals: number;
}

function parseValue(value: string): { numeric: number; suffix: string; prefix: string; decimals: number } {
  const prefix = "";
  const match = value.match(/^([^\d]*)(\d[\d,.]*)(.*)$/);
  if (!match) return { numeric: 0, suffix: value, prefix, decimals: 0 };

  const raw = match[2].replace(/,/g, "");
  const numeric = parseFloat(raw);
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  const suffix = match[3];

  return { numeric, suffix, prefix: match[1], decimals };
}

function useCountUp(target: number, decimals: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [start, target, decimals, duration]);

  return count;
}

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const count = useCountUp(stat.numeric, stat.decimals, 2000, started);

  const formatted =
    stat.decimals === 0
      ? count >= 1000
        ? count.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : count.toFixed(0)
      : count.toFixed(stat.decimals);

  return (
    <div className="flex flex-col items-center gap-[clamp(0.25rem,0.8vw,1.5rem)] px-[clamp(0.5rem,2vw,5rem)]">
      <span
        style={{ fontFamily: "var(--font-manrope)" }}
        className="text-white text-[clamp(2rem,4vw,8rem)] font-extrabold tracking-tight"
      >
        {stat.prefix}{formatted}{stat.suffix}
      </span>
      <span
        style={{ fontFamily: "var(--font-inter)" }}
        className="text-white text-[clamp(0.65rem,0.9vw,1.75rem)] font-semibold tracking-widest text-center"
      >
        {stat.label}
      </span>
    </div>
  );
}

function StatsBanner() {
  const rawStats = [
    { value: "15,000+", label: "MEALS DELIVERED" },
    { value: "98%",     label: "WASTE REDUCTION %" },
    { value: "120+",    label: "HAPPY OFFICES" },
    { value: "4.9/5",  label: "SATISFACTION SCORE" },
  ];

  const stats: Stat[] = rawStats.map((s) => ({ ...s, ...parseValue(s.value) }));

  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#994700] px-[clamp(1rem,4vw,12rem)] py-[clamp(2rem,3vw,8rem)]"
    >
      <div className="mx-auto max-w-[7680px] grid grid-cols-2 lg:grid-cols-4 gap-y-[clamp(2rem,3vw,6rem)] gap-x-[clamp(1rem,2vw,4rem)]">
        {stats.map((stat) => (
          <StatItem key={stat.label} stat={stat} started={started} />
        ))}
      </div>
    </section>
  );
}

export default StatsBanner;