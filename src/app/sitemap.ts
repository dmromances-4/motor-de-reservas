import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  let venues: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    venues = await prisma.venue.findMany({
      where: { isListedOnMarketplace: true, isActive: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // Build-time or offline: static entries only
  }

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...venues.map((v) => ({
      url: `${baseUrl}/venues/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
