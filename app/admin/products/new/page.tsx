import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/app/admin/products/actions";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  const collections = await prisma.collection.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New Product</h1>
      <div className="mt-6 max-w-2xl">
        <ProductForm action={createProduct} collections={collections} submitLabel="Create Product" />
      </div>
    </div>
  );
}
