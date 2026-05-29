"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code as CodeIcon } from "lucide-react";
import { Code, CodeBlock, CodeHeader } from "@/components/animate-ui/components/animate/code";

interface MarkdownRendererProps {
    content: string;
}

/**
 * Markdown renderer with custom styling and code block support.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    // Memoize markdown components to prevent flickering during streaming re-renders
    const components = useMemo(() => ({
        p: ({ node, ...props }: any) => (
            <p className="mb-1 last:mb-0" {...props} />
        ),
        ul: ({ node, ...props }: any) => (
            <ul
                className="list-disc list-outside pl-5 space-y-1"
                {...props}
            />
        ),
        ol: ({ node, ...props }: any) => (
            <ol
                className="list-decimal list-outside pl-5 space-y-1"
                {...props}
            />
        ),
        li: ({ node, ...props }: any) => (
            <li className="mb-0 pl-1" {...props} />
        ),
        strong: ({ node, ...props }: any) => (
            <strong className="font-semibold" {...props} />
        ),
        table: ({ node, ...props }: any) => (
            <div className="overflow-x-auto my-3 rounded-md border border-border">
                <table className="w-full text-[10px] text-left border-collapse tabular-nums" {...props} />
            </div>
        ),
        thead: ({ node, ...props }: any) => (
            <thead className="bg-primary/5 text-foreground font-semibold border-b border-border" {...props} />
        ),
        tbody: ({ node, ...props }: any) => (
            <tbody className="divide-y divide-border/50" {...props} />
        ),
        tr: ({ node, ...props }: any) => (
            <tr className="hover:bg-primary/5 transition-colors" {...props} />
        ),
        th: ({ node, ...props }: any) => (
            <th className="px-3 py-2 border-r border-border last:border-0 align-middle" {...props} />
        ),
        td: ({ node, ...props }: any) => (
            <td className="px-3 py-2 border-r border-border/50 last:border-0 align-top text-foreground/90 font-mono" {...props} />
        ),
        // Code block renderer using animate-ui
        code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && !codeString.includes("\n");

            if (isInline) {
                // Inline code styling
                return (
                    <code
                        className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-mono"
                        {...props}
                    >
                        {children}
                    </code>
                );
            }

            // Code block with animate-ui
            const language = match?.[1] ?? "text";
            return (
                <Code
                    className="my-2 w-full max-w-full overflow-hidden text-[10px]"
                    code={codeString}
                >
                    <CodeHeader icon={CodeIcon} copyButton className="h-7 text-[10px] px-2 bg-zinc-500 text-zinc-200 border-zinc-500">
                        {language}
                    </CodeHeader>
                    <CodeBlock
                        lang={language}
                        className="max-h-[180px] overflow-auto p-2 bg-zinc-200 [&_code]:!text-[10px] [&_.line]:!leading-4"
                    />
                </Code>
            );
        },
        // Override pre to avoid double wrapping
        pre: ({ children }: any) => (
            <div className="not-prose">
                {children}
            </div>
        ),
    }), []);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {content}
        </ReactMarkdown>
    );
}
