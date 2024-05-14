export function parseObj(obj: string) {
    const parsedVertices = new Array<number>();
    const parsedNormals = new Array<number>();
    const parsedFaces = new Array<number[][]>();

    const lines = obj.split('\n');

    for(const line of lines) {
        const cleaned = line.trim();
        const split = cleaned.split(' ');

        switch (split[0]) {
            case 'v':
                parsedVertices.push(...parseVertex(split));
                break;
            case 'vn':
                parsedNormals.push(...parseVertex(split));
                break;
            case 'f':
                parsedFaces.push(parseFace(split));
                break;
            default:
                break;
        }
    }

    const vertexCount = parsedVertices.length / 3;
    const normalCount = parsedNormals.length / 3;

    if(vertexCount !== normalCount)
        throw `OBJ: Mismatch between vertex count (${vertexCount}) and normal count (${normalCount})`;

    const vertices = new Float32Array(parsedVertices);
    const normals = new Float32Array(parsedNormals);

    const faceCount = parsedFaces.length;
    let faces: Uint8Array | Uint16Array | Uint32Array;
    if(vertexCount < 0xFF)
        faces = new Uint8Array(faceCount * 3);
    else if(vertexCount < 0xFFFF)
        faces = new Uint16Array(faceCount * 3);
    else
        faces = new Uint32Array(faceCount * 3);

    for(let f = 0; f < faceCount; f++) {
        const face = parsedFaces[f];
        for(let v = 0; v < 3; v++) {
            const vertex = face[v][0];
            const normal = face[v][2];

            if(vertex !== normal)
                throw `OBJ: Mismatch between vertex index (${vertex}) and normal index (${normal})`;

            faces[f * 3 + v] = vertex - 1;
        }
    }

    return { vertices, normals, faces };
}

function parseVertex(split: string[]) {
    const result = new Array<number>();
    for(let i = 0; i < 3; i++) {
        result.push(Number.parseFloat(split[i + 1]));
    }
    return result;
}

function parseFace(split: string[]) {
    const result = new Array<number[]>();
    for(let i = 0; i < 3; i++) {
        const vertex = split[i + 1].split('/');
        result.push(vertex.map((s) => Number.parseInt(s)));
    }
    return result;
}
