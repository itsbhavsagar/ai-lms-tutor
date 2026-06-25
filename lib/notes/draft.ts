import { toast } from "sonner";

export const DRAFT_NOTE_ID_PREFIX = "draft-";

export function isDraftNoteId(id: string | null): boolean {
  return !!id && id.startsWith(DRAFT_NOTE_ID_PREFIX);
}

export function createDraftNoteId(): string {
  return `${DRAFT_NOTE_ID_PREFIX}${crypto.randomUUID()}`;
}

export function hasDraftContent(title: string, content: string): boolean {
  return Boolean(title.trim() || content.trim());
}

export function confirmDiscardDraft(onDiscard: () => void): void {
  toast("Discard this draft?", {
    description: "Unsaved changes will be lost.",
    action: {
      label: "Discard",
      onClick: onDiscard,
    },
  });
}
