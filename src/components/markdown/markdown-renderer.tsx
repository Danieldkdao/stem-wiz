import { MarkdownAsync, MarkdownHooks, type Components } from "react-markdown";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const markdownClassNames =
  "markdown-renderer w-full min-w-0 max-w-none prose prose-neutral dark:prose-invert font-sans prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-pre:my-0 prose-pre:bg-transparent prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.875em] prose-code:before:content-none prose-code:after:content-none";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "div",
    "figure",
    "figcaption",
    "span",
    "section",
    "input",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...((defaultSchema.attributes?.["*"] as string[]) ?? []),
      "className",
      "id",
      "style",
      "data-theme",
      "dataTheme",
      "data-language",
      "dataLanguage",
      "data-line",
      "dataLine",
      "data-highlighted-line",
      "dataHighlightedLine",
      "data-highlighted-chars",
      "dataHighlightedChars",
      "data-rehype-pretty-code-figure",
      "dataRehypePrettyCodeFigure",
    ],
    a: [
      ...((defaultSchema.attributes?.["a"] as string[]) ?? []),
      "href",
      "name",
      "target",
      "rel",
      "ariaHidden",
      "tabIndex",
    ],
    code: [
      ...((defaultSchema.attributes?.["code"] as string[]) ?? []),
      "className",
      "style",
      "data-theme",
      "dataLanguage",
      "data-language",
      "dataTheme",
    ],
    figure: ["className", "style", "data-rehype-pretty-code-figure"],
    figcaption: ["className"],
    div: ["className", "dataTheme", "dataLanguage", "style"],
    input: ["type", "checked", "disabled"],
    pre: [
      ...((defaultSchema.attributes?.["pre"] as string[]) ?? []),
      "className",
      "style",
      "tabIndex",
      "data-theme",
      "dataLanguage",
      "data-language",
      "dataTheme",
    ],
    span: [
      ...((defaultSchema.attributes?.["span"] as string[]) ?? []),
      "className",
      "style",
      "data-line",
      "dataLine",
      "data-highlighted-line",
      "dataHighlightedLine",
      "data-highlighted-chars",
      "dataHighlightedChars",
      "data-language",
      "dataLanguage",
      "data-theme",
      "dataTheme",
    ],
  },
};

export const MarkdownRenderer = ({
  children,
  isClient = false,
  className,
}: {
  children: string;
  isClient?: boolean;
  className?: string;
}) => {
  const remarkPlugins = [
    remarkGfm,
    remarkBreaks,
    remarkFrontmatter,
    remarkDirective,
  ];
  const rehypePlugins = [
    rehypeRaw,
    [
      rehypePrettyCode,
      {
        keepBackground: true,
        theme: {
          dark: "github-dark",
          light: "github-light",
        },
      },
    ],
    [rehypeSanitize, sanitizeSchema],
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: "append",
        properties: {
          ariaLabel: "Link to section",
          className: ["heading-anchor"],
        },
      },
    ],
  ];
  const components = {
    pre: ({ children, ...props }: { children: ReactNode }) => {
      const language = (props as Record<string, unknown>)["data-language"] as
        | string
        | undefined;
      return (
        <pre
          {...props}
          className="overflow-x-auto rounded-xl border border-border bg-card p-0 shadow-sm"
        >
          {language && (
            <div className="border-b border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
              {language}
            </div>
          )}
          {children}
        </pre>
      );
    },

    table: ({ children }: { children: ReactNode }) => (
      <div className="not-prose my-4 min-w-0 max-w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-max min-w-full border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    a: ({ ...props }) => (
      <a {...props} rel="nofollow noreferrer noopener" target="_blank" />
    ),
  };

  return (
    <div className={cn(markdownClassNames, className)}>
      {isClient ? (
        <MarkdownHooks
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins as PluggableList}
          remarkRehypeOptions={{ allowDangerousHtml: true }}
          components={components as Components}
        >
          {children}
        </MarkdownHooks>
      ) : (
        <MarkdownAsync
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins as PluggableList}
          remarkRehypeOptions={{ allowDangerousHtml: true }}
          components={components as Components}
        >
          {children}
        </MarkdownAsync>
      )}
    </div>
  );
};
