import type { Static } from '@sinclair/typebox';
declare const PieDimensionSchema: import("@sinclair/typebox").TObject<{
    width: import("@sinclair/typebox").TString;
    height: import("@sinclair/typebox").TString;
    resolution: import("@sinclair/typebox").TNumber;
    zoom: import("@sinclair/typebox").TNumber;
}>;
export declare type PieDimension = Static<typeof PieDimensionSchema>;
export {};
