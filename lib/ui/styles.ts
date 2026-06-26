export const chatComposerShellClass =
  "chat-composer relative z-0 flex w-full items-end gap-1 overflow-visible px-2 py-2";

export const chatComposerFieldClass =
  "chat-composer-field max-h-40 min-h-8 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-1.5 pl-1.5 pr-0 text-[13px] leading-5 text-ink outline-none focus:outline-none focus-visible:outline-none";

export const skeletonButtonCompactClass =
  "h-9 w-9 shrink-0 animate-pulse rounded-xl bg-surface-raised sm:h-10 sm:w-30";

export const skeletonButtonFullClass =
  "h-10 w-full shrink-0 animate-pulse rounded-xl bg-surface-raised sm:w-36";

export const btnInteractive =
  "cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50";

export const btnPrimaryClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50`;

export const btnGreenClass = `${btnInteractive} shrink-0 rounded-lg border border-green bg-green px-2.5 py-1.5 text-[10px] font-semibold text-on-green hover:bg-green-hover sm:px-3 sm:text-[11px]`;

export const btnGhostClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-muted hover:text-ink`;

export const btnOutlineClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-input px-3 py-2 text-[13px] font-medium text-ink hover:bg-surface-raised`;

export const btnDangerClass = `${btnInteractive} inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-border bg-red-soft px-3 py-2 text-[13px] font-medium text-red disabled:opacity-40`;

export const lmsFrameClass =
  "lms-frame flex h-full w-full min-w-0 flex-col";

export const appShellClass =
  "app-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row md:gap-3 md:p-3 lg:gap-4 lg:p-4";

export const floatingSidebarClass =
  "floating-sidebar flex min-h-0 w-full flex-1 flex-col overflow-hidden";

export const mainHeaderClass =
  "main-header flex flex-none flex-col border-b border-border";

export const mainBodyClass = "main-body flex min-h-0 min-w-0 flex-1 flex-col";

export const floatingMainClass =
  "floating-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export const contentCardClass = "content-card flex h-full min-h-0 min-w-0 flex-col";

export const contentCardLearnClass = `${contentCardClass} overflow-hidden p-0`;

export const contentCardTabClass = `${contentCardClass} p-2.5 sm:p-4 md:p-6`;

export const chatTabShellClass = "relative flex min-h-0 flex-1 overflow-hidden";

export const chatTabInnerClass =
  "relative flex min-h-0 min-w-0 flex-1 flex-col";

export const chatTabBodyClass = "flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4";

export const chatComposerFooterClass =
  "relative z-10 mt-3 w-full flex-none border-t border-border pt-3";

export const scrollClipClass = "scroll-clip";

export const scrollAreaClass =
  "scroll-area flex min-h-0 min-w-0 flex-1 flex-col";

export const tabsScrollClipClass = "tabs-scroll-clip";

export const tabsScrollClass =
  "flex w-max min-w-full flex-row flex-nowrap items-center gap-1";

export const overlayBackdropClass = "overlay-backdrop absolute inset-0";

export const overlayBackdropStrongClass =
  "overlay-backdrop-strong absolute inset-0 backdrop-blur-[1px]";

export const cardClass =
  "rounded-xl border border-border bg-surface-raised p-4 shadow-sm sm:p-5";

export const panelHeadingClass = "text-[15px] font-semibold tracking-tight text-ink";

export const panelSubtextClass = "text-[12px] leading-relaxed text-muted";

export const pageTitleClass =
  "truncate text-lg font-semibold leading-tight tracking-tight text-ink sm:text-[22px]";

export const pageSubtitleClass =
  "mt-1 line-clamp-2 max-w-3xl text-[12px] leading-relaxed text-muted sm:line-clamp-none sm:text-[13px]";

export const brandIconClass =
  "brand-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";

export const breakAnywhereClass = "min-w-0 break-anywhere";

export const plainFieldClass =
  "plain-field outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none";

export const inputFieldClass = `${plainFieldClass} border border-border-strong bg-input text-ink`;

export const raisedFieldClass = `${plainFieldClass} border border-border-strong bg-surface-raised text-ink`;

export const tabBtnClass =
  "relative flex shrink-0 flex-row items-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200";

export const tabBtnActiveClass = "bg-accent-soft font-semibold text-ink";

export const tabBtnInactiveClass = "text-muted hover:text-ink";

export const tabIndicatorClass =
  "absolute right-0 bottom-0 left-0 h-0.5 origin-center rounded-t-full bg-accent transition-transform duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const quizOptionDefaultClass =
  "bg-panel border-border text-ink cursor-pointer hover:bg-surface-raised";

export const quizOptionSelectedClass =
  "bg-selection border-selection text-selection-fg cursor-pointer";

export const quizOptionCorrectClass =
  "bg-green-soft border-green-border text-green cursor-default";

export const quizOptionWrongClass =
  "bg-red-soft border-red-border text-red cursor-default";

export const quizOptionDimmedClass = "text-muted cursor-default";

export const chatBubbleUserClass =
  "rounded-br-sm bg-chat-user text-chat-user-fg";

export const chatBubbleAssistantClass =
  "rounded-bl-sm border border-chat-assistant-border bg-chat-assistant text-ink";
