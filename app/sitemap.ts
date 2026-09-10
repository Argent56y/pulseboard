import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["/", "/demo", "/demo/roadmap", "/demo/changelog", "/demo/app/map", "/login"].map((path, index) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: index === 0 ? "weekly" : "monthly", priority: index === 0 ? 1 : 0.7 }));
}
