import type { Static } from '@sinclair/typebox';
export declare const PieSliceSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    percent: import("@sinclair/typebox").TNumber;
    color: import("@sinclair/typebox").TString;
}>;
export declare const PieSeriesSchema: import("@sinclair/typebox").TObject<{
    slices: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        percent: import("@sinclair/typebox").TNumber;
        color: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare type PieSlice = Static<typeof PieSliceSchema>;
export declare type PieSeries = Static<typeof PieSeriesSchema>;
