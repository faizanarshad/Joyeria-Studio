import CollectionForm from "@/components/admin/CollectionForm";
import { createCollection } from "@/app/admin/collections/actions";

export const metadata = { title: "New Collection" };

export default function NewCollectionPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New Collection</h1>
      <div className="mt-6">
        <CollectionForm action={createCollection} submitLabel="Create Collection" />
      </div>
    </div>
  );
}
