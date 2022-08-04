import type { Point } from "../types/Point.type";
export interface Line {
    name: string;
    points: Point[];
    color: string;
}
export interface LineChartType {
    title: string;
    description: string;
    source: string;
    yLabel: string;
    xLabel: string;
    secondYLabel: string;
    series: Line[];
}
export declare const printPoints: (line: Line) => void;
export declare const LineChartTestData: LineChartType;
