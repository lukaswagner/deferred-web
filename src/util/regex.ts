// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function regexFromDelimiters(start: string, end: string) {
    return new RegExp(`${escapeRegex(start)}.*${escapeRegex(end)}`, 's');
}
