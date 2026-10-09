import { ImageResponse } from "next/og";
import { IconGlyph } from "@/lib/icon-glyph";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconGlyph size={180} />, size);
}
