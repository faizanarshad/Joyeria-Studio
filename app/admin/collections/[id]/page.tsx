import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CollectionForm from "@/components/admin/CollectionForm";
import { updateCollection, deleteCollection } from "@/app/admin/collections/actions";

export const metadata = { title: "Edit Collection" };

type Props = { params: Promise<{ id: string }> };

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) notFound();

  const boundUpdate = updateCollection.bind(null, collection.id);
  const boundDelete = deleteCollection.bind(null, collection.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Edit Collection</h1>
        <form
          action={async () => {
            "use server";
            await boundDelete();
          }}
        >
          <button type="submit" className="text-sm text-muted hover:text-red-600">
            Delete Collection
          </button>
        </form>
      </div>
      <div className="mt-6">
        <CollectionForm
          action={boundUpdate}
          submitLabel="Save Changes"
          initial={{
            name: collection.name,
            slug: collection.slug,
            description: collection.description ?? "",
            coverImage: collection.coverImage ?? "",
            featured: collection.featured,
            sortOrder: collection.sortOrder,
          }}
        />
      </div>
    </div>
  );
}
