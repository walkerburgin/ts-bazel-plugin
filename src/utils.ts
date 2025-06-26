import path from "node:path";
import fs from "node:fs";

/** Helper method to create a clone of an object that we can mutate, binding any functions to the original value of `this`. */
export function clone<T>(obj: T): T {
    const clone: Partial<T> = {};
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === "function") {
            clone[key] = value.bind(obj);
        } else {
            clone[key] = value;
        }
    }
    return clone as T;
}

/** Helper method to search "up" until we find the root of the Bazel workspace. */
export function findBazelWorkspaceRoot(cwd: string): string | undefined {
    let current = cwd;
    while (current !== "/") {
        for (let marker of ["MODULE.bazel", "MODULE", "WORKSPACE.bazel", "WORKSPACE"]) {
            const markerPath = path.join(current, marker);
            if (fs.existsSync(markerPath) && fs.statSync(markerPath).isDirectory() === false) {
                return current;
            }
        }
        current = path.dirname(current);
    }
    return undefined;
}
