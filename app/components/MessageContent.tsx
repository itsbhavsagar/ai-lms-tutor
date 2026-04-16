import { Fragment, type ReactNode } from "react";

type MessageContentProps = {
  content: string;
};

type MessageBlock =
  | {
      type: "paragraph";
      lines: string[];
    }
  | {
      type: "unordered-list" | "ordered-list";
      items: string[];
    };

function normalizeListFormatting(content: string): string {
  let text = content.replace(/\r\n?/g, "\n").trim();

  text = text.replace(/(\S)\s+([*-])\s+(?=(\*\*)?[A-Za-z])/g, "$1\n$2 ");
  text = text.replace(/(\S)\s+(\d+\.)\s+(?=(\*\*)?[A-Za-z])/g, "$1\n$2 ");

  return text;
}

function parseBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const lines = normalizeListFormatting(content).split("\n");
  let paragraphLines: string[] = [];
  let listBlock: MessageBlock | null = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) return;
    blocks.push({
      type: "paragraph",
      lines: paragraphLines,
    });
    paragraphLines = [];
  }

  function flushList() {
    if (!listBlock) return;
    blocks.push(listBlock);
    listBlock = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (!listBlock || listBlock.type !== "unordered-list") {
        flushList();
        listBlock = {
          type: "unordered-list",
          items: [],
        };
      }
      listBlock.items.push(unorderedMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (!listBlock || listBlock.type !== "ordered-list") {
        flushList();
        listBlock = {
          type: "ordered-list",
          items: [],
        };
      }
      listBlock.items.push(orderedMatch[1]);
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineFormatting(text: string): ReactNode[] {
  return text
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      return <Fragment key={index}>{part}</Fragment>;
    });
}

export default function MessageContent({ content }: MessageContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2 wrap-break-word">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {renderInlineFormatting(line)}
                </Fragment>
              ))}
            </p>
          );
        }

        const ListTag = block.type === "ordered-list" ? "ol" : "ul";
        const listClassName =
          block.type === "ordered-list"
            ? "ml-5 list-decimal space-y-1"
            : "ml-5 list-disc space-y-1";

        return (
          <ListTag key={index} className={listClassName}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInlineFormatting(item)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
