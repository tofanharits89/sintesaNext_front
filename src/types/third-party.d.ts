declare module "remark-breaks" {
  import type { Plugin } from "unified";
  const remarkBreaks: Plugin<[], unknown>;
  export default remarkBreaks;
}

declare module "shiki" {
  export type CodeToHtmlOptions = {
    lang?: string;
    themes?: { light: string; dark: string };
    defaultColor?: "light" | "dark";
    [key: string]: unknown;
  };

  export function codeToHtml(
    code: string,
    options?: CodeToHtmlOptions,
  ): Promise<string>;
}
