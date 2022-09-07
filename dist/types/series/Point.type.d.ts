import type { Static } from '@sinclair/typebox';
export declare const PointSchema: import("@sinclair/typebox").TObject<{
    x: import("@sinclair/typebox").TInteger;
    y: import("@sinclair/typebox").TInteger;
    ariaLabel: import("@sinclair/typebox").TString;
}>;
export declare type Point = Static<typeof PointSchema>;
