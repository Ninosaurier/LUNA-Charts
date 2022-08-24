import type { Static } from '@sinclair/typebox';
declare const BarValueSchema: import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TNumber;
    ariaLabel: import("@sinclair/typebox").TString;
}>;
export declare type BarValue = Static<typeof BarValueSchema>;
declare const BarSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    barValues: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TNumber;
        ariaLabel: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare type Bar = Static<typeof BarSchema>;
declare const BarSeriesSchema: import("@sinclair/typebox").TObject<{
    series: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        barValues: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TNumber;
            ariaLabel: import("@sinclair/typebox").TString;
        }>>;
    }>>;
    category: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export declare type BarSeries = Static<typeof BarSeriesSchema>;
export {};
