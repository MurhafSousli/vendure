/**
 * Takes a predicate function and returns a negated version.
 */
export function not(predicate: (...args: any[]) => boolean) {
    return (...args: any[]) => !predicate(...args);
}

/**
 * Returns a predicate function which returns true if the item is found in the set,
 * as determined by a === equality check on the given compareBy property.
 */
export function foundIn<T>(set: T[], compareBy: keyof T) {
    return (item: T) => set.some(t => t[compareBy] === item[compareBy]);
}

/**
 * Indentity function which asserts to the type system that a promise which can resolve to T or undefined
 * does in fact resolve to T.
 * Used when performing a "find" operation on an entity which we are sure exists, as in the case that we
 * just successfully created or updated it.
 */
export function assertFound<T>(promise: Promise<T | undefined>): Promise<T> {
    return promise as Promise<T>;
}
