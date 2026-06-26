"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lesson } from "../data/lessons";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiPencilLine,
  RiSaveLine,
  RiStickyNoteLine,
} from "react-icons/ri";
import {
  deriveNoteTitle,
  formatNoteDate,
  type NoteItem,
} from "@/lib/api/notes";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useNotesQuery,
  useUpdateNoteMutation,
} from "@/lib/hooks/queries/useNotes";
import {
  confirmDiscardDraft,
  createDraftNoteId,
  hasDraftContent,
  isDraftNoteId,
} from "@/lib/notes/draft";
import { showSuccess } from "@/lib/utils/toast";
import NoteCard from "./notes/NoteCard";
import EmptyState from "./ui/EmptyState";
import { SkeletonNoteGrid } from "./ui/Skeleton";
import {
  btnInteractive,
  panelHeadingClass,
  panelSubtextClass,
  plainFieldClass,
} from "@/lib/ui/styles";

const LABEL_NOTES = "Notes";
const LABEL_NEW = "New Note";
const LABEL_CANCEL = "Cancel";
const LABEL_SAVE = "Save";
const LABEL_EDIT = "Edit";
const LABEL_DELETE = "Delete";
const LABEL_WORDS = "words";
const LABEL_EMPTY_LIST = "No notes yet";
const LABEL_EMPTY_HINT =
  "Create a note to capture your understanding of this lesson.";
const LABEL_SELECT_HINT = "Select a note or create a new one";
const PLACEHOLDER =
  "Start with a title line, then write your notes…\n\nTip: Summarize key points in your own words — it helps you remember better.";

type NotesTabProps = {
  lesson: Lesson;
};

export default function NotesTab({ lesson }: NotesTabProps) {
  const { data, isLoading, isFetching } = useNotesQuery(lesson.id);
  const createMutation = useCreateNoteMutation(lesson.id);
  const updateMutation = useUpdateNoteMutation(lesson.id);
  const deleteMutation = useDeleteNoteMutation(lesson.id);

  const notes = useMemo(() => data?.notes ?? [], [data?.notes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [locked, setLocked] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const isDraft = isDraftNoteId(selectedId);
  const selectedNote = useMemo(
    () => (isDraft ? null : notes.find((n) => n.id === selectedId) ?? null),
    [notes, selectedId, isDraft],
  );
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isSaving = updateMutation.isPending || createMutation.isPending;

  const resetEditor = useCallback(() => {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setLocked(false);
    setMobileShowEditor(false);
  }, []);

  const selectNote = useCallback(
    (note: NoteItem) => {
      if (note.id === selectedId && locked && !isDraft) {
        resetEditor();
        return;
      }

      setSelectedId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setLocked(true);
      setMobileShowEditor(true);
    },
    [selectedId, locked, isDraft, resetEditor],
  );

  const handleNewNote = useCallback(() => {
    setSelectedId(createDraftNoteId());
    setTitle("");
    setContent("");
    setLocked(false);
    setMobileShowEditor(true);
  }, []);

  const handleCancelDraft = useCallback(() => {
    if (!isDraft || !selectedId) return;

    if (hasDraftContent(title, content)) {
      confirmDiscardDraft(resetEditor);
      return;
    }

    resetEditor();
  }, [isDraft, selectedId, content, title, resetEditor]);

  const handleSave = useCallback(() => {
    if (!selectedId || !content.trim()) return;

    const resolvedTitle = deriveNoteTitle(title, content);
    const trimmedContent = content.trim();

    if (isDraft) {
      createMutation.mutate(
        { title: resolvedTitle, content: trimmedContent },
        {
          onSuccess: (result) => {
            setSelectedId(result.note.id);
            setTitle(result.note.title);
            setContent(result.note.content);
            setLocked(true);
            showSuccess("Note saved");
          },
        },
      );
      return;
    }

    updateMutation.mutate(
      {
        noteId: selectedId,
        title: resolvedTitle,
        content: trimmedContent,
      },
      {
        onSuccess: (result) => {
          setTitle(result.note.title);
          setContent(result.note.content);
          setLocked(true);
          showSuccess("Note saved");
        },
      },
    );
  }, [selectedId, content, title, isDraft, createMutation, updateMutation]);

  const performDelete = useCallback(
    (noteId: string) => {
      if (isDraftNoteId(noteId)) {
        resetEditor();
        showSuccess("Draft discarded");
        return;
      }

      deleteMutation.mutate(noteId, {
        onSuccess: () => {
          if (selectedId === noteId) resetEditor();
          showSuccess("Note deleted");
        },
      });
    },
    [deleteMutation, resetEditor, selectedId],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;

    const noteTitle = deriveNoteTitle(title, content);

    if (isDraft) {
      confirmDiscardDraft(() => performDelete(selectedId));
      return;
    }

    toast(`Delete "${noteTitle}"?`, {
      description: "This cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => performDelete(selectedId),
      },
    });
  }, [selectedId, title, content, isDraft, performDelete]);

  const showEditor = selectedId !== null;
  const hasSavedNoteSelected = selectedId !== null && !isDraft;
  const dateLabel = isDraft
    ? "New note"
    : selectedNote
      ? formatNoteDate(selectedNote.updatedAt)
      : "";

  const noteCountLabel =
    isDraft && notes.length === 0
      ? "1 draft"
      : isDraft
        ? `${notes.length} saved + 1 draft`
        : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  const handleCancelEdit = useCallback(() => {
    if (isDraft) {
      handleCancelDraft();
      return;
    }

    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setLocked(true);
      return;
    }

    resetEditor();
  }, [isDraft, handleCancelDraft, selectedNote, resetEditor]);

  const showMobileEditorToolbar = mobileShowEditor && showEditor;

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!content.trim() || isSaving}
      className={`${btnInteractive} flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[13px]`}
      style={{
        background: "var(--accent)",
        color: "var(--on-accent)",
        opacity: content.trim() && !isSaving ? 1 : 0.4,
        cursor: content.trim() && !isSaving ? "pointer" : "not-allowed",
      }}
    >
      <RiSaveLine size={13} className="hidden sm:block" />
      {isSaving ? "Saving…" : LABEL_SAVE}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      onClick={handleCancelEdit}
      className={`${btnInteractive} flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-medium sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[13px]`}
      style={{
        borderColor: "var(--border-strong)",
        color: "var(--text)",
        background: "var(--input-bg)",
      }}
    >
      <RiCloseLine size={14} className="hidden sm:block" />
      {LABEL_CANCEL}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className={`flex flex-none gap-2 sm:items-center sm:justify-between ${
          showMobileEditorToolbar
            ? "hidden md:flex md:flex-row"
            : "flex-row items-start justify-between"
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2
            className={panelHeadingClass}
            style={{ color: "var(--text)" }}
          >
            {LABEL_NOTES}
          </h2>
          <p
            className={`truncate ${panelSubtextClass}`}
            style={{ color: "var(--text-muted)" }}
          >
            {lesson.title} · {noteCountLabel}
          </p>
        </div>

        <div className="hidden min-h-[37px] shrink-0 flex-nowrap items-center gap-2 md:flex">

          {(isDraft || (hasSavedNoteSelected && !locked)) && saveButton}

          {hasSavedNoteSelected && locked && (
            <button
              type="button"
              onClick={() => setLocked(false)}
              className={`${btnInteractive} flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium`}
              style={{
                borderColor: "var(--border-strong)",
                color: "var(--text)",
                background: "var(--input-bg)",
              }}
            >
              <RiPencilLine size={13} />
              {LABEL_EDIT}
            </button>
          )}

          {hasSavedNoteSelected && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={`${btnInteractive} flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium`}
              style={{
                borderColor: "var(--red-border)",
                color: "var(--red)",
                background: "var(--red-soft)",
                opacity: deleteMutation.isPending ? 0.4 : 1,
                cursor: deleteMutation.isPending ? "not-allowed" : "pointer",
              }}
            >
              <RiDeleteBinLine size={13} />
              {LABEL_DELETE}
            </button>
          )}

          {isDraft ? (
            cancelButton
          ) : (
            <button
              type="button"
              onClick={handleNewNote}
              className={`${btnInteractive} flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold`}
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
              }}
            >
              <RiAddLine size={14} />
              {LABEL_NEW}
            </button>
          )}
        </div>

        {!showMobileEditorToolbar && (
          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={handleNewNote}
              className={`${btnInteractive} flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold`}
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
              }}
            >
              <RiAddLine size={14} />
              {LABEL_NEW}
            </button>
          </div>
        )}
      </div>

      {isLoading && notes.length === 0 ? (
        <SkeletonNoteGrid />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4">
          <div
            className={`min-h-0 md:w-56 lg:w-64 ${
              mobileShowEditor ? "hidden md:block" : "block"
            }`}
          >
            {notes.length === 0 && !isDraft ? (
              <EmptyState
                icon={<RiStickyNoteLine size={22} />}
                title={LABEL_EMPTY_LIST}
                description={LABEL_EMPTY_HINT}
                compact
              />
            ) : (
              <div className="grid max-h-full grid-cols-2 gap-2 overflow-y-auto pr-0.5 md:grid-cols-1 lg:grid-cols-2">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    active={note.id === selectedId}
                    onSelect={() => selectNote(note)}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            className={`min-h-0 min-w-0 flex-1 flex-col ${
              mobileShowEditor || showEditor ? "flex" : "hidden md:flex"
            }`}
          >
            {showMobileEditorToolbar && (
              <div className="mb-2 flex items-center justify-between gap-2 md:hidden">
                <button
                  type="button"
                  onClick={resetEditor}
                  className="flex min-w-0 items-center gap-1 text-[14px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  <RiArrowLeftLine
                    size={16}
                    className="shrink-0"
                    style={{ color: "var(--accent)" }}
                  />
                  <span className="truncate">{LABEL_NOTES}</span>
                </button>

                <div className="flex shrink-0 items-center gap-1.5">
                  {locked ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setLocked(false)}
                        className={`${btnInteractive} flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-medium`}
                        style={{
                          borderColor: "var(--border-strong)",
                          color: "var(--text)",
                          background: "var(--input-bg)",
                        }}
                      >
                        {LABEL_EDIT}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className={`${btnInteractive} flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-medium`}
                        style={{
                          borderColor: "var(--red-border)",
                          color: "var(--red)",
                          background: "var(--red-soft)",
                          opacity: deleteMutation.isPending ? 0.4 : 1,
                        }}
                      >
                        {LABEL_DELETE}
                      </button>
                    </>
                  ) : (
                    <>
                      {saveButton}
                      {cancelButton}
                    </>
                  )}
                </div>
              </div>
            )}

            {showEditor ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex-none min-w-0">
                  {locked ? (
                    <h3
                      className="truncate text-[15px] font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      {deriveNoteTitle(title, content)}
                    </h3>
                  ) : (
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title"
                      className={`${plainFieldClass} w-full rounded-lg border px-3 py-2 text-[14px] font-semibold`}
                      style={{
                        background: "var(--input-bg)",
                        borderColor: "var(--border-strong)",
                        color: "var(--text)",
                      }}
                    />
                  )}
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {dateLabel}
                    {dateLabel ? " · " : ""}
                    {wordCount} {LABEL_WORDS}
                    {isFetching && !isDraft ? " · syncing…" : ""}
                  </p>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  {locked ? (
                    <div
                      className="h-full overflow-y-auto rounded-xl border p-4 sm:p-5"
                      style={{
                        background: "var(--surface-raised)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <p
                        className="whitespace-pre-wrap wrap-wrap-wrap-break-word text-[13px] leading-relaxed"
                        style={{ color: "var(--text)" }}
                      >
                        {content || "Empty note"}
                      </p>
                    </div>
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={PLACEHOLDER}
                      autoFocus
                      className={`${plainFieldClass} h-full w-full min-w-0 resize-none rounded-xl border p-4 text-[13px] leading-relaxed sm:p-5`}
                      style={{
                        background: "var(--surface-raised)",
                        borderColor: "var(--border-strong)",
                        color: "var(--text)",
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<RiStickyNoteLine size={22} />}
                title="Select a note"
                description={LABEL_SELECT_HINT}
                fill
                className="rounded-xl border border-dashed"
                style={{ borderColor: "var(--border-strong)" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
