import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://akilii-minipay.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/copilot`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/budget`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/alerts`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
