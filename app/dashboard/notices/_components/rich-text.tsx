import type { ReactNode } from "react";

/**
 * Markdown-lite renderer for notice bodies.
 *
 * A full editor would mean a new dependency; this renders the subset the
 * composer's toolbar inserts: `#`/`##` headings, `- ` bullets, `1. ` numbers,
 * blank-line paragraphs, **bold**, *italic*, `code` and [links](url). It builds
 * React nodes — never `dangerouslySetInnerHTML` — so pasted HTML stays text.
 */

const INLINE =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter((part) => part !== "")
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        return (
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {link[1]}
          </a>
        );
      }

      return <span key={key}>{part}</span>;
    });
}

export function RichText({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let numbers: string[] = [];

  const flushLists = () => {
    if (bullets.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5">
          {bullets.map((item, index) => (
            <li key={index}>{inline(item, `b-${blocks.length}-${index}`)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
    if (numbers.length > 0) {
      blocks.push(
        <ol
          key={`ol-${blocks.length}`}
          className="my-2 list-decimal space-y-1 pl-5"
        >
          {numbers.map((item, index) => (
            <li key={index}>{inline(item, `n-${blocks.length}-${index}`)}</li>
          ))}
        </ol>,
      );
      numbers = [];
    }
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushLists();
      return;
    }

    if (line.startsWith("# ")) {
      flushLists();
      blocks.push(
        <h2 key={index} className="mt-3 text-base font-semibold text-foreground">
          {inline(line.slice(2), `h-${index}`)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushLists();
      blocks.push(
        <h3 key={index} className="mt-3 text-sm font-semibold text-foreground">
          {inline(line.slice(3), `h2-${index}`)}
        </h3>,
      );
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*]\s+/, ""));
      return;
    }
    if (/^\d+\.\s+/.test(line)) {
      numbers.push(line.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushLists();
    blocks.push(
      <p key={index} className="my-1.5 leading-relaxed">
        {inline(line, `p-${index}`)}
      </p>,
    );
  });

  flushLists();

  return <div className="text-sm text-muted-foreground">{blocks}</div>;
}
