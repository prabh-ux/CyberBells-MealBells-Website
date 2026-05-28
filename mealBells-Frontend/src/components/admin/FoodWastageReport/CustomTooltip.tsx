import type { TooltipEntry } from "../../../types/admin";

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[var(--text-primary)] rounded-xl shadow-lg px-4 py-3 text-sm font-[var(--font-inter)]">
      <p className="font-semibold text-white mb-1">{label}</p>

      {payload.map((p) => (
        <p
          key={p.name}
          className="text-xs"
          style={{ color: p.color }}
        >
          {p.name}:{" "}
          <span className="font-semibold">
            {p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default CustomTooltip;