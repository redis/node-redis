export const FIRST_KEY_INDEX = 1;

interface Sketch {
    name: string;
    weight: number;
}

type Sketches = Array<string> | Array<Sketch>;

export function transformArguments(dest: string, src: Sketches): Array<string> {
    const args = [
        'CMS.MERGE',
        dest,
        src.length.toString()
    ];

    if (isStringSketches(src)) {
        args.push(...src);
    } else {
        for (const sketch of src) {
            args.push(sketch.name);
        }

        args.push('WEIGHTS');
        for (const sketch of src) {
            args.push(sketch.weight.toString());
        }
    }

    return args;
}

function isStringSketches(src: Sketches): src is Array<string> {
    return typeof src[0] === 'string';
}

export declare function transformReply(): 'OK';
