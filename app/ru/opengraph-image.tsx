import { ImageResponse } from "next/og";

export const alt = "Pulseboard — от отзывов клиентов к понятным продуктовым решениям";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function RussianOpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 70px", background: "#202529", color: "#f1eee7", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26 }}><span style={{ width: 16, height: 16, border: "3px solid #afc1c7", borderRadius: "50%" }} />Pulseboard</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}><span style={{ color: "#afc1c7", fontSize: 17, letterSpacing: 3, textTransform: "uppercase" }}>ОТЗЫВ · ТЕМА · РЕШЕНИЕ</span><div style={{ fontSize: 72, lineHeight: .95, letterSpacing: -3 }}>Превращайте отзывы клиентов в roadmap, который легко объяснить.</div></div>
    <div style={{ display: "flex", justifyContent: "space-between", color: "#9aa7ac", fontSize: 18 }}><span>Signal Map</span><span>Арсений Козел · Seva Dev-a</span></div>
  </div>, size);
}
