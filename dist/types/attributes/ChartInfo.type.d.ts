import type { Static } from '@sinclair/typebox';
declare const InfoSchema: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    desc: import("@sinclair/typebox").TString;
    source: import("@sinclair/typebox").TString;
}>;
export declare type ChartInfo = Static<typeof InfoSchema>;
export {};
