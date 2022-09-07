import type { Static } from '@sinclair/typebox';
declare const LabelsSchema: import("@sinclair/typebox").TObject<{
    x: import("@sinclair/typebox").TString;
    y: import("@sinclair/typebox").TString;
    secondY: import("@sinclair/typebox").TString;
}>;
export declare type Labels = Static<typeof LabelsSchema>;
export declare const defaultLabel: Labels;
export {};
