import type { ProgressKind } from "@/src/lib/types";
import { getRepository } from "@/src/server/repositories/repository";

export async function saveProgress(input: {
  userId: string;
  kind: ProgressKind;
  key: string;
  value: Record<string, unknown>;
  completed: boolean;
}) {
  const repository = getRepository();
  return repository.upsertProgress(input);
}

export async function listProgress(userId: string) {
  const repository = getRepository();
  return repository.listProgress(userId);
}

export async function toggleBookmark(input: { userId: string; slug: string; label: string }) {
  const repository = getRepository();
  return repository.toggleBookmark(input);
}

export async function listBookmarks(userId: string) {
  const repository = getRepository();
  return repository.listBookmarks(userId);
}
