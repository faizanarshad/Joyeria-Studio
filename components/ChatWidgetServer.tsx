import { prisma } from "@/lib/prisma";
import ChatWidget from "@/components/ChatWidget";

export default async function ChatWidgetServer() {
  const [collections, featuredProducts] = await Promise.all([
    prisma.collection
      .findMany({ orderBy: { sortOrder: "asc" }, take: 4, select: { name: true, slug: true } })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { name: true, slug: true },
      })
      .catch(() => []),
  ]);

  return <ChatWidget collections={collections} featuredProducts={featuredProducts} />;
}
