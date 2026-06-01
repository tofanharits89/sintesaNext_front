/**
 * Normalizes LLM math output into delimiters that remark-math / KaTeX understands.
 *
 * The model frequently emits non-standard LaTeX that does not render with
 * remark-math out of the box, for example:
 *   - bracket display math:  "[ \frac{a}{b} \times 100% ]"
 *   - escaped delimiters:    "\[ ... \]" and "\( ... \)"
 *   - unescaped percent:     "100%" inside math (% starts a LaTeX comment and
 *                            swallows the rest of the line)
 *
 * This helper rewrites those into standard `$$...$$` (display) and `$...$`
 * (inline) delimiters and escapes characters that would otherwise break KaTeX.
 */

// Heuristic: does a chunk of text look like LaTeX math (vs. a regular sentence
// that happens to be wrapped in brackets)?
function looksLikeMath(inner: string): boolean {
    return /\\(?:frac|times|div|cdot|approx|sqrt|sum|int|alpha|beta|geq|leq|neq|pm|infty|partial|left|right|begin|end|le|ge|ne)\b/.test(
        inner,
    ) || /[\^_]\{?\w/.test(inner) || /\\[a-zA-Z]+/.test(inner);
}

// Escape characters that are valid in plain markdown but break inside KaTeX.
function escapeMathInner(inner: string): string {
    // Escape standalone percent signs (LaTeX treats % as a line comment).
    // Skip ones already escaped as \%.
    return inner.replace(/(?<!\\)%/g, "\\%");
}

export function normalizeMath(content: string): string {
    if (!content) return content;

    let result = content;

    // 1) Convert escaped TeX delimiters \[...\] -> $$...$$ and \(...\) -> $...$
    result = result.replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner) => `$$${escapeMathInner(inner)}$$`);
    result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${escapeMathInner(inner)}$`);

    // 2) Convert bare bracket display math "[ \frac... ]" -> $$...$$,
    //    but only when the bracket content actually looks like LaTeX so we do
    //    not clobber legitimate prose like "[1]" citations or "[lihat tabel]".
    result = result.replace(/\[([^\[\]]*?)\]/g, (match, inner) => {
        if (looksLikeMath(inner)) {
            return `$$${escapeMathInner(inner.trim())}$$`;
        }
        return match;
    });

    // 3) Escape unescaped percent signs inside existing $...$ / $$...$$ blocks.
    result = result.replace(/(\${1,2})([\s\S]+?)\1/g, (_m, delim, inner) => {
        return `${delim}${escapeMathInner(inner)}${delim}`;
    });

    return result;
}
