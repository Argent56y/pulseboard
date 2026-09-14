import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pulseboard.sevadeva.tech";
  return ["/", "/ru", "/demo", "/ru/demo", "/demo/roadmap", "/ru/demo/roadmap", "/demo/changelog", "/ru/demo/changelog", "/demo/app/map", "/ru/demo/app/map", "/login"].map((path, index) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: index < 2 ? "weekly" : "monthly", priority: index < 2 ? 1 : 0.7 }));
}
