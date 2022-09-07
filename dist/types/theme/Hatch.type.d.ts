import type { Static } from '@sinclair/typebox';
declare const HatchSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    pattern: import("@sinclair/typebox").TString;
}>;
export declare type HatchPattern = Static<typeof HatchSchema>;
export declare const enum HATCH_PATTERNS {
    CIRCLES = "circles",
    SQUARE = "square",
    H_LINE = "hLine",
    DIAGONAL = "diagonal"
}
export {};
