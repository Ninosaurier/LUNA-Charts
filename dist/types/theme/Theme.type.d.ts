import type { Static } from '@sinclair/typebox';
export declare const CONTRAST_COLORS: string[];
export declare const Colors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
declare const LineThemeSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    colors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    circles: import("@sinclair/typebox").TObject<{
        radius: import("@sinclair/typebox").TString;
        focusColor: import("@sinclair/typebox").TString;
        focusRadius: import("@sinclair/typebox").TString;
    }>;
    grid: import("@sinclair/typebox").TObject<{
        gridColor: import("@sinclair/typebox").TString;
        gridSize: import("@sinclair/typebox").TString;
    }>;
    wrapperStyles: import("@sinclair/typebox").TObject<{
        backgroundColor: import("@sinclair/typebox").TString;
    }>;
}>;
export declare type LineTheme = Static<typeof LineThemeSchema>;
export declare const PieThemeSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    colors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    focusColor: import("@sinclair/typebox").TString;
    wrapperStyles: import("@sinclair/typebox").TObject<{
        backgroundColor: import("@sinclair/typebox").TString;
    }>;
}>;
export declare type PieTheme = Static<typeof PieThemeSchema>;
declare const BarThemeSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    wrapperStyles: import("@sinclair/typebox").TObject<{
        backgroundColor: import("@sinclair/typebox").TString;
    }>;
    colors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    focusColor: import("@sinclair/typebox").TString;
    grid: import("@sinclair/typebox").TObject<{
        gridColor: import("@sinclair/typebox").TString;
        gridSize: import("@sinclair/typebox").TString;
    }>;
    hatches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export declare type BarTheme = Static<typeof BarThemeSchema>;
export {};
