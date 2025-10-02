declare module "react-calendar-heatmap" {
  import type { ComponentType } from "react";

  export type Value = {
    date: string | Date;
    count?: number;
    [key: string]: unknown;
  } | null | undefined;

  export type CalendarHeatmapProps = {
    values: Array<Value>;
    startDate: string | Date;
    endDate: string | Date;
    gutterSize?: number;
    showWeekdayLabels?: boolean;
    classForValue?: (value: Value) => string | undefined;
    titleForValue?: (value: Value) => string | undefined;
  } & Record<string, unknown>;

  const CalendarHeatmap: ComponentType<CalendarHeatmapProps>;

  export default CalendarHeatmap;
}
