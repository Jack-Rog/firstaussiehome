import { Card, CardText, CardTitle } from "@/components/ui/card";
import { getActiveUserId } from "@/src/lib/route-guards";
import { listBookmarks } from "@/src/server/services/progress-service";

export default async function BookmarksPage() {
  const userId = await getActiveUserId();
  const bookmarks = await listBookmarks(userId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Card className="space-y-4">
        <CardTitle>Bookmarks</CardTitle>
        {bookmarks.length === 0 ? (
          <CardText>No bookmarks saved yet.</CardText>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                <p className="font-semibold">{bookmark.label}</p>
                <p className="text-sm text-foreground-soft">/{bookmark.slug}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
