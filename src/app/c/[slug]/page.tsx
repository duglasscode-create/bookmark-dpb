import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicCollectionView } from "@/components/PublicCollectionView";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicCollectionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Buscar la colección por share_slug (solo si es pública)
  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description, icon, color, share_slug, user_id")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .single();

  if (!collection) {
    notFound();
  }

  // Buscar los IDs de marcadores en esta colección
  const { data: relations } = await supabase
    .from("bookmark_collections")
    .select("bookmark_id")
    .eq("collection_id", collection.id);

  const bookmarkIds = relations?.map((r) => r.bookmark_id) || [];

  let bookmarks: any[] = [];
  if (bookmarkIds.length > 0) {
    const { data } = await supabase
      .from("bookmarks")
      .select("id, url, domain, title, description, image_url, created_at")
      .in("id", bookmarkIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    bookmarks = data || [];
  }

  return <PublicCollectionView collection={collection} bookmarks={bookmarks} />;
}