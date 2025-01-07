import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

import { ReactNode } from "react";
import { TimePeriod } from "@/constants/TimePeriod";
import {
  GET_PEAK_OFF_PEAK_RATIO,
  GET_TOTAL_USAGE,
  GET_PEAK_HOUR, // Add this import
  GET_TOTAL_COST, // Add this import
  GET_PROJECTED_ENERGY_USAGE, // Add this import
  GET_PROJECTED_COST, // Add this import
} from "@/constants/ApiEndpoint";

export default function DataCard({ children }: { children: ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

DataCard.TotalUsage = function TotalUsage({
  date,
  type,
}: {
  date: string;
  type: TimePeriod;
}) {
  const [data, setData] = useState<{
    total_energy: 0;
    previous_total_energy: 0;
    change_from_previous_current: 0;
  }>({
    total_energy: 0,
    previous_total_energy: 0,
    change_from_previous_current: 0,
  });
  const [loading, setLoading] = useState(true);
  const isUp = data.change_from_previous_current > 0;
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  useEffect(() => {
    if (date) {
      async function fetchData() {
        setLoading(true);
        try {
          const response = await fetch(GET_TOTAL_USAGE(date, type));
          const result = await response.json();
          setData(result.data);
        } catch (error) {
          console.error("Error fetching total usage data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [date, type]);

  return (
    <View style={styles.innerView}>
      <Text style={styles.titleText}>Total Usage</Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>{data.total_energy.toFixed(2)}</Text>{" "}
            kWh
          </Text>
          <Text style={styles.tagText}>
            <Text style={{ color: !isUp ? "green" : "red" }}>
              {Math.abs(data.change_from_previous_current).toFixed(2)}%
            </Text>{" "}
            {isUp ? "up" : "down"} from {period}
          </Text>
        </>
      )}
    </View>
  );
};

DataCard.PeakHour = function PeakHour({
  date,
  type,
}: {
  date: string;
  type: TimePeriod;
}) {
  const [data, setData] = useState<{
    peak_hour: string;
    previous_peak_hour: string;
  }>({
    peak_hour: "0",
    previous_peak_hour: "0",
  });
  const [loading, setLoading] = useState(true);
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  useEffect(() => {
    if (date) {
      async function fetchData() {
        setLoading(true);
        try {
          const response = await fetch(GET_PEAK_HOUR(date, type));
          const result = await response.json();
          setData(result.data);
        } catch (error) {
          console.error("Error fetching peak hour data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [date, type]);

  return (
    <View style={styles.innerView}>
      <Text style={styles.titleText}>Peak Hour</Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>{data.peak_hour}</Text>
          </Text>
          <Text style={styles.tagText}>
            <Text>{`${period} is ${data.previous_peak_hour}`}</Text>{" "}
          </Text>
        </>
      )}
    </View>
  );
};

DataCard.PeakVsOffPeakRatio = function PeakVsOffPeakRatio({
  date,
  type,
}: {
  date: string;
  type: TimePeriod;
}) {
  const [data, setData] = useState<{
    peak_energy_kwh: 0;
    off_peak_energy_kwh: 0;
    peak_to_off_peak_ratio: 0;
    previous_peak_energy_kwh: 0;
    previous_off_peak_energy_kwh: 0;
    previous_peak_to_off_peak_ratio: 0;
  }>({
    peak_energy_kwh: 0,
    off_peak_energy_kwh: 0,
    peak_to_off_peak_ratio: 0,
    previous_peak_energy_kwh: 0,
    previous_off_peak_energy_kwh: 0,
    previous_peak_to_off_peak_ratio: 0,
  });
  const [loading, setLoading] = useState(true);
  const isUp =
    data.peak_to_off_peak_ratio < data.previous_peak_to_off_peak_ratio;
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  useEffect(() => {
    if (date) {
      async function fetchData() {
        setLoading(true);
        try {
          const response = await fetch(GET_PEAK_OFF_PEAK_RATIO(date, type));
          const result = await response.json();
          setData(result.data);
        } catch (error) {
          console.error("Error fetching peak vs off peak ratio data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [date, type]);

  return (
    <View style={styles.innerView}>
      <Text style={styles.titleText}>Peak vs Off Peak Ratio</Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>{data.peak_to_off_peak_ratio}%</Text>
          </Text>
          <Text style={styles.tagText}>
            <Text style={{ color: isUp ? "green" : "red" }}>
              {`${period} is ${Math.abs(
                data.previous_peak_to_off_peak_ratio
              )}%`}
            </Text>{" "}
          </Text>
        </>
      )}
    </View>
  );
};

DataCard.Cost = function Cost({
  date,
  type,
}: {
  date: string;
  type: TimePeriod;
}) {
  const [data, setData] = useState<{
    total_cost: 0;
    previous_total_cost: 0;
    change_from_previous_current: 0;
  }>({
    total_cost: 0,
    previous_total_cost: 0,
    change_from_previous_current: 0,
  });
  const [loading, setLoading] = useState(true);
  const isUp = data.change_from_previous_current > 0;
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  useEffect(() => {
    if (date) {
      async function fetchData() {
        setLoading(true);
        try {
          const response = await fetch(GET_TOTAL_COST(date, type));
          const result = await response.json();
          setData(result.data);
        } catch (error) {
          console.error("Error fetching total cost data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [date, type]);

  return (
    <View style={styles.innerView}>
      <Text style={styles.titleText}>Total Cost</Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>${data.total_cost.toFixed(2)}</Text>
          </Text>
          <Text style={styles.tagText}>
            <Text style={{ color: !isUp ? "green" : "red" }}>
              {Math.abs(data.change_from_previous_current).toFixed(2)}%
            </Text>{" "}
            {isUp ? "up" : "down"} from {period}
          </Text>
        </>
      )}
    </View>
  );
};

type ProjectedUsageData = {
  total_energy: string;
  projected_energy: string;
  days_passed: number;
  total_days_in_month: number;
  average_daily_usage: number;
};

DataCard.ProjectedUsage = function ProjectedUsage({
  deviceId,
}: {
  deviceId?: string;
}) {
  const [data, setData] = useState<ProjectedUsageData>({
    total_energy: "0",
    projected_energy: "0",
    days_passed: 0,
    total_days_in_month: 0,
    average_daily_usage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(GET_PROJECTED_ENERGY_USAGE(deviceId));
        const result = await response.json();
        setData(result.data);
        console.log("Projected usage data:", result.data);
      } catch (error) {
        console.error("Error fetching projected usage data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [deviceId]);

  return (
    <View style={styles.innerView}>
      <Text style={deviceId ? styles.deviceTitleText : styles.titleText}>
        Projected Usage
      </Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>{data.projected_energy}</Text> kWh
          </Text>
          <Text style={styles.avgText}>
            on avg. {data.average_daily_usage} kWh
          </Text>
          <Text style={styles.tagText}>
            <Text>Current usage: {data.total_energy} kWh</Text>
          </Text>
        </>
      )}
    </View>
  );
};

type ProjectedCostData = {
  total_cost: string;
  projected_cost: string;
  average_daily_cost: number;
};

DataCard.ProjectedCost = function ProjectedCost({
  deviceId,
}: {
  deviceId?: string;
}) {
  const [data, setData] = useState<ProjectedCostData>({
    total_cost: "0",
    projected_cost: "0",
    average_daily_cost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(GET_PROJECTED_COST(deviceId));
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error("Error fetching projected cost data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [deviceId]);

  return (
    <View style={styles.innerView}>
      <Text style={deviceId ? styles.deviceTitleText : styles.titleText}>
        Projected Cost
      </Text>
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#2BBDFF"
          style={{ marginTop: 10 }}
        />
      ) : (
        <>
          <Text style={styles.value}>
            <Text style={styles.boldText}>{data.projected_cost} NOK</Text>
          </Text>
          <Text style={styles.avgText}>
            on avg. {data.average_daily_cost} NOK
          </Text>
          <Text style={styles.tagText}>
            <Text>Current cost: {data.total_cost} NOK</Text>
          </Text>
        </>
      )}
    </View>
  );
};

DataCard.ProjectedUsageByDevice = function ProjectedUsageByDevice({
  percentageChange,
  type,
}: {
  percentageChange: number;
  type: TimePeriod;
}) {
  const isUp = percentageChange > 0;
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  return (
    <View style={styles.innerView}>
      <Text style={[styles.titleText, { color: "#2196F3" }]}>
        Projected Usage By Device
      </Text>
      <Text style={styles.value}>
        <Text style={styles.boldText}>1,200</Text> kWh
      </Text>
      <Text style={styles.tagText}>
        <Text style={{ color: isUp ? "green" : "red" }}>
          {Math.abs(percentageChange).toFixed(2)}%
        </Text>{" "}
        {isUp ? "up" : "down"} from {period}
      </Text>
    </View>
  );
};

DataCard.ProjectedCostByDevice = function ProjectedCostByDevice({
  percentageChange,
  type,
}: {
  percentageChange: number;
  type: TimePeriod;
}) {
  const isUp = percentageChange > 0;
  const period = type === TimePeriod.Hourly ? "last day" : "last month";

  return (
    <View style={styles.innerView}>
      <Text style={[styles.titleText, { color: "#2196F3" }]}>
        Projected Cost By Device
      </Text>
      <Text style={styles.value}>
        <Text style={styles.boldText}>${140}</Text>
      </Text>
      <Text style={styles.tagText}>
        <Text style={{ color: isUp ? "green" : "red" }}>
          {Math.abs(percentageChange).toFixed(2)}%
        </Text>{" "}
        {isUp ? "up" : "down"} from {period}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between", // Ensure space between items
    margin: 0,
  },
  innerView: {
    flexBasis: "47%", // Adjust to fit two items per line
    maxWidth: "47%", // Ensure max width to fit two items per line
    flexDirection: "column",
    backgroundColor: "#fff",
    borderColor: "#e6e6e6",
    borderWidth: 1,
    margin: 5,
    padding: 10,
    borderRadius: 5,
  },
  titleText: {
    color: "#21CABA",
    fontSize: 15,
    fontWeight: "bold",
  },
  deviceTitleText: {
    color: "#2BBDFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  value: {
    textAlign: "center",
    fontSize: 18,
    color: "#000",
    marginTop: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  tagText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    color: "#555",
  },
  avgText: {
    fontSize: 15,
    marginTop: 5,
    textAlign: "center",
  },
});
