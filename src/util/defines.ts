import { regexFromDelimiters } from "./regex";

const regex = regexFromDelimiters('/* DEFINES START */', '/* DEFINES END */');

export function replaceDefines(
    src: string,
    values: { key: string, value: { toString(): string }, suffix?: string}[]
) {
    const replaceValue = values
        .map((v) => `#define ${v.key} ${v.value}${v.suffix ?? ''}`)
        .join('\n');
    return src.replace(regex, replaceValue);
}
