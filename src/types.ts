import type ts from "typescript/lib/tsserverlibrary";

/**
 * This interface originates from TypeScript, but is marked as @internal and intentionally not made public.
 *
 * See: https://github.com/microsoft/TypeScript/blob/27bcd4cb5a98bce46c9cdd749752703ead021a4b/src/compiler/types.ts#L9661-L9665
 */
export interface DocumentPosition {
    fileName: string;
    pos: number;
}

/**
 * This interface originates from TypeScript, but is marked as @internal and intentionally not made public.
 *
 * See: https://github.com/microsoft/TypeScript/blob/27bcd4cb5a98bce46c9cdd749752703ead021a4b/src/services/sourcemaps.ts#L33-L39
 */
export interface SourceMapper {
    toLineColumnOffset(fileName: string, position: number): ts.LineAndCharacter;
    tryGetSourcePosition(info: DocumentPosition): DocumentPosition | undefined;
    tryGetGeneratedPosition(info: DocumentPosition): DocumentPosition | undefined;
    clearCache(): void;
}

export interface LanguageService extends ts.LanguageService {
    getSourceMapper(): SourceMapper | undefined;
}
