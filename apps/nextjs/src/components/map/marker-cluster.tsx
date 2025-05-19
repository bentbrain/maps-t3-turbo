import { hash } from "@/lib/map-utils";

interface MarkerClusterProps {
  size: number;
  iconSet: Set<string>;
}

export const MarkerCluster = ({ size, iconSet }: MarkerClusterProps) => {
  "use memo";
  const icons = Array.from(iconSet);
  const iconCount = icons.length;
  const radius = size / 2;
  const padding = size * 0.05; // 5% padding
  const effectiveRadius = radius - padding;
  const centerX = radius;
  const centerY = radius;

  // Calculate base icon size based on circle area and icon count
  const circleArea = Math.PI * effectiveRadius * effectiveRadius;
  const baseIconSize = Math.sqrt(circleArea / (iconCount * Math.PI)) * 1.5;

  // For pseudo-randomness, generate positions in a circle
  const randoms = icons.map((icon, i) => {
    // If only one icon, put it in the center
    if (iconCount === 1) {
      return { scale: 1, x: centerX, y: centerY };
    }

    // Generate deterministic "random" values based on icon and index
    const iconHash = hash(icon + i.toString());
    const positionHash = hash(icon + (i * 2).toString());

    // For multiple icons, distribute them around the circle
    const angle = (i / iconCount) * 2 * Math.PI + iconHash * 0.5;
    const distance = effectiveRadius * (0.2 + positionHash * 0.5);

    return {
      scale: 0.7 + hash(icon + (i * 3).toString()) * 0.4,
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    };
  });

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-full bg-black"
      style={{ width: `${size}px`, height: `${size}px`, position: "relative" }}
    >
      {icons.map((icon, i) => {
        const { scale, x, y } = randoms[i] ?? { scale: 1, x: 0, y: 0 };
        const actualSize = baseIconSize * scale;
        const rotation = hash(icon + (i * 4).toString()) * 16 - 8;

        const safeX = Math.max(
          padding,
          Math.min(size - padding - actualSize, x - actualSize / 2),
        );
        const safeY = Math.max(
          padding,
          Math.min(size - padding - actualSize, y - actualSize / 2),
        );

        return (
          <span
            key={icon + i}
            style={{
              position: "absolute",
              left: safeX,
              top: safeY,
              width: actualSize,
              height: actualSize,
              fontSize: actualSize * 0.9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              userSelect: "none",
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
};
