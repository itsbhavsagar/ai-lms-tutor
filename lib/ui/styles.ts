export const btnInteractive =
  "cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50";

export const btnPrimaryClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent disabled:opacity-50`;

export const btnGhostClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium hover:opacity-80`;

export const btnOutlineClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-input px-3 py-2 text-[13px] font-medium text-ink`;

export const btnDangerClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-border bg-red-soft px-3 py-2 text-[13px] font-medium text-red disabled:opacity-40`;

export const cardClass =
  "rounded-xl border border-border bg-surface-raised p-4 shadow-sm sm:p-5";

export const panelHeadingClass = "text-[15px] font-semibold tracking-tight text-ink";

export const panelSubtextClass = "text-[12px] leading-relaxed text-muted";

/** Long strings (code snippets, URLs) wrap instead of overflowing on narrow screens. */
export const breakAnywhereClass = "min-w-0 break-anywhere";

/** No accent focus ring — use on inputs/textareas (notes, chat, etc.). */
export const plainFieldClass =
  "plain-field outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none";

export const inputFieldClass = `${plainFieldClass} border border-border-strong bg-input text-ink`;

export const raisedFieldClass = `${plainFieldClass} border border-border-strong bg-surface-raised text-ink`;

export const lessonNavItemClass =
  "flex min-w-0 items-start gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-sidebar-text transition-colors duration-200";

export const lessonNavItemActiveClass =
  "bg-sidebar-active text-sidebar-text-active";

export const lessonDotActiveClass = "bg-green opacity-100";

export const lessonDotInactiveClass = "bg-sidebar-text opacity-45";

export const quizOptionDefaultClass =
  "bg-panel border-border text-ink cursor-pointer";

export const quizOptionSelectedClass =
  "bg-selection border-selection text-selection-fg cursor-pointer";

export const quizOptionCorrectClass =
  "bg-green-soft border-green-border text-green cursor-default";

export const quizOptionWrongClass =
  "bg-red-soft border-red-border text-red cursor-default";

export const quizOptionDimmedClass = "text-muted cursor-default";
