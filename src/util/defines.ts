export function replaceDefines(
    src: string,
    values: { key: string, value: { toString(): string }, suffix?: string}[]
) {
    let result = src;
    values.forEach((v) => {
        result = result.replace(
            new RegExp(`(?<=#define ${v.key} ).*`),
            `${v.value}${v.suffix ?? ''}`);
    });
    return result;
}
