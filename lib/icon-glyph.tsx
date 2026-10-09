/** App icon artwork for next/og ImageResponse: indigo gradient + 2×2 tile grid. */
export function IconGlyph({ size }: { size: number }) {
  const tile = Math.round(size * 0.2);
  const gap = Math.round(size * 0.07);
  const radius = Math.round(size * 0.065);
  const opacities = [1, 0.55, 0.55, 1];

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #7d7bff 0%, #5856d6 55%, #3a38a8 100%)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", width: tile * 2 + gap, gap }}>
        {opacities.map((o, i) => (
          <div key={i} style={{ width: tile, height: tile, borderRadius: radius, background: "white", opacity: o }} />
        ))}
      </div>
    </div>
  );
}
