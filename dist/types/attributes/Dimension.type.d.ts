import type { Static } from '@sinclair/typebox';
declare const DimensionSchema: import("@sinclair/typebox").TObject<{
    width: import("@sinclair/typebox").TString;
    height: import("@sinclair/typebox").TString;
}>;
export declare type Dimension = Static<typeof DimensionSchema>;
export {};
