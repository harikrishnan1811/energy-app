const API_BASE_URL = "https://energyiq.onrender.com/api";

export const GET_INSIGHTS: string = `${API_BASE_URL}/insights`;
export const GET_STATS = (date: string, type: string): string => {
  return `${API_BASE_URL}/energy/stats?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_PEAK_OFF_PEAK_RATIO = (date: string, type: string): string => {
  return `${API_BASE_URL}/energy/peakOffPeakRatio?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_TOTAL_USAGE = (date: string, type: string): string => {
  return `${API_BASE_URL}/energy/totalUsage?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_PEAK_HOUR = (date: string, type: string): string => {
  return `${API_BASE_URL}/energy/peakHour?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_CONSUMPTION_CHART_DATA = (
  date: string,
  type: string
): string => {
  return `${API_BASE_URL}/energy/getConsumptionChartData?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_TOTAL_COST = (date: string, type: string): string => {
  return `${API_BASE_URL}/energy/getTotalCost?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_COST_BREAKDOWN_BY_DEVICES = (
  date: string,
  type: string
): string => {
  return `${API_BASE_URL}/energy/getCostBreakDownByDevices?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_TOTAL_ENERGY_USAGE_BY_DEVICE = (
  date: string,
  type: string
): string => {
  return `${API_BASE_URL}/energy/getTotalEnergyUsageByDevice?date=${date}&type=${type.toLowerCase()}`;
};
export const GET_DEVICES = `${API_BASE_URL}/insights/getDevices`;
export const GET_PROJECTED_ENERGY_USAGE = (deviceId?: string): string => {
  let url = `${API_BASE_URL}/insights/getProjectedEnergyUsage`;
  if (deviceId !== undefined && deviceId !== null) {
    url += `?deviceId=${deviceId}`;
  }
  return url;
};
export const GET_PROJECTED_COST = (deviceId?: string): string => {
  let url = `${API_BASE_URL}/insights/getProjectedCost`;
  if (deviceId !== undefined && deviceId !== null) {
    url += `?deviceId=${deviceId}`;
  }
  return url;
};
