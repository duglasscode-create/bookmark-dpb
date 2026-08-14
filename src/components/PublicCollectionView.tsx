"use client";

type PublicBookmark = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

type PublicCollection = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
};

type PublicCollectionViewProps = {
  collection: PublicCollection;
  bookmarks: PublicBookmark[];
};

export function PublicCollectionView({
  collection,
  bookmarks,
}: PublicCollectionViewProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header de la colección */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{collection.icon || "📁"}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-slate-400 mt-1">{collection.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>
              🔖 {bookmarks.length} marcador{bookmarks.length !== 1 ? "es" : ""}
            </span>
            <span>•</span>
            <span>Compartido públicamente</span>
          </div>
        </div>
      </div>

      {/* Grid de marcadores */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-400">
              Esta colección aún no tiene marcadores
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10"
              >
                {/* Favicon y dominio */}
                <div className="flex items-center gap-2 mb-3">
                  {bookmark.domain && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${bookmark.domain}&sz=32`}
                      alt=""
                      className="h-5 w-5 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <span className="text-xs text-slate-500 truncate">
                    {bookmark.domain || bookmark.url}
                  </span>
                </div>

                {/* Título */}
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition mb-2 line-clamp-2">
                  {bookmark.title || bookmark.url}
                </h3>

                {/* Descripción */}
                {bookmark.description && (
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {bookmark.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-12">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center">
          <p className="text-sm text-slate-500">
            🔖 Compartido desde{" "}
            <span className="text-blue-400 font-medium">Bookmark DPB</span>
          </p>
        </div>
      </div>
    </div>
  );
}