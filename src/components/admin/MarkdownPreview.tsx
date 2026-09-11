"use client";

import { useEffect, useState, useRef } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Icon from "@/components/ui/Icon";

const mdxComponents = {
  h1: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className="text-3xl md:text-4xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />
  ),
  h2: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="text-2xl md:text-3xl font-bold text-white mt-7 mb-3" {...props} />
  ),
  h3: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="text-xl md:text-2xl font-semibold text-white mt-5 mb-2" {...props} />
  ),
  h4: (props: React.HTMLProps<HTMLHeadingElement>) => (
    <h4 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="text-gray-300 leading-relaxed mb-4 text-base" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: (props: React.HTMLProps<HTMLUListElement>) => (
    <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 pl-2" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 pl-2" {...props} />
  ),
  li: (props: React.HTMLProps<HTMLLIElement>) => (
    <li className="text-gray-300 leading-relaxed" {...props} />
  ),
  blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-purple-500 pl-4 py-1 italic text-gray-400 bg-purple-500/5 rounded-r-lg my-4"
      {...props}
    />
  ),
  code: (props: React.HTMLProps<HTMLElement>) => (
    <code
      className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono"
      {...props}
    />
  ),
  pre: (props: React.HTMLProps<HTMLPreElement>) => (
    <pre
      className="bg-black/80 border border-gray-800 rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono text-gray-200"
      {...props}
    />
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span className="block my-6">
      <img
        className="rounded-2xl border border-white/10 max-h-[480px] w-auto max-w-full mx-auto object-cover shadow-xl"
        loading="lazy"
        {...props}
      />
      {props.alt && (
        <span className="block text-center text-xs text-gray-400 mt-2 italic">
          {props.alt}
        </span>
      )}
    </span>
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-left text-sm text-gray-300 border border-gray-800 rounded-xl overflow-hidden" {...props} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
    <th className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-white font-semibold" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
    <td className="px-4 py-2 border-b border-gray-800/60" {...props} />
  ),
  hr: () => <hr className="my-8 border-gray-800" />,
};

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!content || !content.trim()) {
      setMdxSource(null);
      setCompileError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/blog/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();
        if (!res.ok) {
          setCompileError(data.error || "Failed to compile MDX content");
        } else {
          setMdxSource(data.mdxSource);
          setCompileError(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error compiling preview";
        setCompileError(msg);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Icon name="fileText" size={28} className="mb-2" />
        <p className="italic text-sm">Preview will appear here when you write content...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading indicator bar */}
      {loading && (
        <div className="absolute top-0 right-0 flex items-center gap-2 text-xs text-purple-400 bg-gray-900/90 px-3 py-1 rounded-lg border border-purple-500/30 z-10">
          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Rendering preview…</span>
        </div>
      )}

      {/* Compile Error Banner */}
      {compileError && (
        <div className="p-4 mb-6 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Icon name="alertTriangle" size={14} />
            <span>MDX Syntax Error:</span>
          </div>
          <p className="font-mono whitespace-pre-wrap">{compileError}</p>
          <p className="mt-2 text-[11px] text-red-400/80">
            Tip: Check whether all JSX/HTML tags are properly closed (e.g., &lt;img ... /&gt; or &lt;div&gt;&lt;/div&gt;).
          </p>
        </div>
      )}

      {/* Rendered MDX */}
      {mdxSource ? (
        <div className="prose prose-invert max-w-none text-gray-300">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </div>
      ) : (
        !loading && !compileError && (
          <div className="text-gray-500 italic text-center py-12">
            No content to display.
          </div>
        )
      )}
    </div>
  );
}
