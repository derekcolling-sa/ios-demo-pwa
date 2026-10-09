import { ImageResponse } from "next/og";
import { IconGlyph } from "@/lib/icon-glyph";

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  return new ImageResponse(<IconGlyph size={size} />, { width: size, height: size });
}
