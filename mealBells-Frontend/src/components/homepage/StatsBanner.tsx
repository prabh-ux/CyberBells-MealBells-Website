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
  const match = value.match(/^([^\d]*)(\d[\d,.]*)(.*)$/);
  if (!match) return { numeric: 0, suffix: value, prefix: "", decimals: 0 };
  const raw = match[2].replace(/,/g, "");
  const numeric = parseFloat(raw);
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { numeric, suffix: match[3], prefix: match[1], decimals };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const numRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;

    const duration = 2000;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      const current = eased * stat.numeric;

      if (numRef.current) {
        const formatted =
          stat.decimals === 0
            ? current >= 1000
              ? Math.round(current).toLocaleString("en-US")
              : Math.round(current).toString()
            : current.toFixed(stat.decimals);
        numRef.current.textContent = stat.prefix + formatted + stat.suffix;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started, stat]);

  const zeroFormatted =
    stat.decimals === 0 ? "0" : (0).toFixed(stat.decimals);

  return (
    <div className="flex flex-col items-center gap-[clamp(0.25rem,0.8vw,1.5rem)] px-[clamp(0.5rem,2vw,5rem)]">
      <span
        ref={numRef}
        style={{ fontFamily: "var(--font-manrope)" }}
        className="text-white text-[clamp(2rem,4vw,8rem)] font-extrabold tracking-tight"
      >
        {stat.prefix}{zeroFormatted}{stat.suffix}
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
          setTimeout(() => setStarted(true), 200);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
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