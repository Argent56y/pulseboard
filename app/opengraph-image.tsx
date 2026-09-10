import { ImageResponse } from "next/og";

export const alt = "Pulseboard — see the evidence behind every product decision";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 70px", background: "#202529", color: "#f1eee7", fontFamily: "sans-serif", position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26 }}><span style={{ width: 16, height: 16, border: "3px solid #afc1c7", borderRadius: "50%" }} />Pulseboard</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 970 }}><span style={{ color: "#afc1c7", fontSize: 17, letterSpacing: 4, textTransform: "uppercase" }}>Customer signal → product decision</span><div style={{ fontSize: 78, lineHeight: .94, letterSpacing: -4 }}>Turn scattered requests into a roadmap you can explain.</div></div>
    <div style={{ display: "flex", justifyContent: "space-between", color: "#9aa7ac", fontSize: 18 }}><span>Interactive Signal Map</span><span>Designed & built by Seva Dev-a</span></div>
  </div>, size);
}
