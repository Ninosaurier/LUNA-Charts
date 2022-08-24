import type { Static } from '@sinclair/typebox';
declare const LineSeriesSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    points: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        x: import("@sinclair/typebox").TInteger;
        y: import("@sinclair/typebox").TInteger;
        ariaLabel: import("@sinclair/typebox").TString;
    }>>;
    color: import("@sinclair/typebox").TString;
}>;
export declare type LineSeries = Static<typeof LineSeriesSchema>;
export {};
