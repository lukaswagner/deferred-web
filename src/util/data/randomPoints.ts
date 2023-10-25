export function randomPoints(count: number) {
    const data = new Float32Array(count * 6);

    for (let i = 0; i < count; i++) {
        const index = i * 6;
        // position [-1, 1]
        data[index + 0] = Math.random() * 2 - 1;
        data[index + 1] = Math.random() * 2 - 1;
        data[index + 2] = Math.random() * 2 - 1;
        // color [0, 1]
        data[index + 3] = Math.random();
        data[index + 4] = Math.random();
        data[index + 5] = Math.random();
    }

    return data;
}
