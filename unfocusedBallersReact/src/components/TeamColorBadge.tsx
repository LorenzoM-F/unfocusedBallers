type TeamColor = "BLUE" | "BLACK" | "WHITE" | "RED";

type TeamColorBadgeProps = {
  color?: TeamColor | null;
  className?: string;
};

const baseClasses =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em]";

const colorClasses: Record<TeamColor, string> = {
  BLUE: "border-blue-600 text-blue-700",
  BLACK: "border-black text-black",
  WHITE: "border-dashed border-black/40 text-black/60",
  RED: "border-red-600 text-red-600"
};

const mutedClasses = "border-black/20 text-black/40";

const TeamColorBadge = ({ color, className }: TeamColorBadgeProps) => {
  const label = color ?? "NO COLOUR";
  const variantClasses = color ? colorClasses[color] : mutedClasses;
  const classes = `${baseClasses} ${variantClasses} ${className ?? ""}`.trim();

  return <span className={classes}>{label}</span>;
};

export default TeamColorBadge;
