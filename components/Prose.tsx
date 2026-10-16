"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Lesson text as it was written.
 *
 * Scraped material arrives as markdown, so showing it raw puts hashes, stars
 * and bracketed URLs on the page and leaves every link dead. This renders it:
 * headings become headings, links become links.
 *
 * Raw HTML is not enabled. The text comes from someone else's community and
 * is not ours to execute.
 */
export function Prose({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-[14px] leading-[1.75] text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h3 className="pt-2 text-[17px] font-semibold text-slate-900" {...p} />,
          h2: (p) => <h3 className="pt-2 text-[16px] font-semibold text-slate-900" {...p} />,
          h3: (p) => <h4 className="pt-1 text-[15px] font-semibold text-slate-900" {...p} />,
          h4: (p) => <h4 className="pt-1 text-[14px] font-semibold text-slate-900" {...p} />,
          h5: (p) => (
            <p className="pt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500" {...p} />
          ),
          h6: (p) => (
            <p className="pt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-500" {...p} />
          ),
          p: (p) => <p {...p} />,
          a: ({ href, ...p }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-brand-violet underline underline-offset-2 hover:opacity-80"
              {...p}
            />
          ),
          ul: (p) => <ul className="list-disc space-y-1 pl-5" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-1 pl-5" {...p} />,
          li: (p) => <li className="pl-0.5" {...p} />,
          strong: (p) => <strong className="font-semibold text-slate-900" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-2 border-hairline pl-4 text-slate-600" {...p} />
          ),
          code: (p) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px]" {...p} />
          ),
          hr: () => <hr className="border-hairline" />,
          img: ({ alt, ...p }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={alt ?? ""} className="rounded-xl border border-hairline" {...p} />
          ),
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-hairline bg-slate-50 px-2 py-1 text-left" {...p} />,
          td: (p) => <td className="border border-hairline px-2 py-1" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
