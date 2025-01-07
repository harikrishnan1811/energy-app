export type Insight = {
  insight_id: number;
  insight_text: string;
  created_at: string;
  is_active: boolean;
};

export type EnergyStats = {
  date: string;
  device_id: string;
  finalized: boolean;
  peak_hour: string;
  total_cost: number;
  total_energy_kwh: number;
  trend: string;
  total_energy_kwh_percentage_change: number;
  total_cost_percentage_change: number;
  previous_peak_hour?: number;
  peak_to_off_peak_ratio?: number;
  peak_to_off_peak_ratio_percentage_change?: number;
};

export type ChartDataPoint = {
  x: string;
  y: number;
};

export type ConsumptionChartData = {
  data: ChartDataPoint[];
  previousData: ChartDataPoint[];
};

export type HourlyEnergyUsage = {
  timestamp: string;
  energy_kwh: string;
};
