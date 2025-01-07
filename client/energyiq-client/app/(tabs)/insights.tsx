import React, { useState, useEffect } from "react";
import { Image, StyleSheet, Platform } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";
import InsightCarousel from "@/components/InsightCarousel";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button, ButtonGroup, Card, Icon, Text } from "@ui-kitten/components";
import DateScroller from "@/components/DateScroller";
import DataCard from "@/components/DataCard";
import ChartWebView from "@/components/LineChartView";
import { TimePeriod } from "@/constants/TimePeriod";
import { GET_INSIGHTS, GET_DEVICES } from "@/constants/ApiEndpoint";
import LineChartViewD3 from "@/components/LineChartViewD3";
import ProjectedUsageChart from "@/components/ProjectedUsageChart";
import { HourlyEnergyUsage } from "@/constants/Types";

export interface Insight {
  insight_id: number;
  insight_text: string;
  created_at: string;
  is_active: boolean;
  relevancy_score: number | null;
}

export interface Device {
  id: string;
  device_name: string;
}

export default function HomeScreen() {
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(0); // Default to "Hourly"
  const timePeriods = [TimePeriod.Hourly, TimePeriod.Monthly];
  const [selectedButton, setSelectedButton] = useState<string>();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [hourlyEnergyUsage, setHourlyEnergyUsage] = useState<
    HourlyEnergyUsage[]
  >([]);

  useEffect(() => {
    fetch(GET_INSIGHTS)
      .then((response) => response.json())
      .then((data) => {
        setInsights(data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching insights:", error);
        setLoading(false);
      });

    fetch(GET_DEVICES)
      .then((response) => response.json())
      .then((data) => {
        setDevices(data.data);
        setSelectedButton(data.data[0].id);
      })
      .catch((error) => {
        console.error("Error fetching devices:", error);
      });
  }, []);

  const handleButtonPress = (button?: string) => {
    setSelectedButton(button);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#21CABA", dark: "#21CABA" }}
      headerImage={<ThemedText style={styles.headerImage}>EnergyIQ</ThemedText>}
    >
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        insights.map((insight) => (
          <Card
            key={insight.insight_id}
            style={{ marginLeft: 15, marginRight: 15, marginTop: 5 }}
          >
            <Text>{insight.insight_text}</Text>
          </Card>
        ))
      )}
      <ThemedView style={styles.cardContainer}>
        <DataCard>
          <DataCard.ProjectedUsage />
          <DataCard.ProjectedCost />
        </DataCard>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {devices.map((device) => (
          <Button
            key={device.id}
            status={selectedButton === device.id ? "primary" : "basic"}
            size="small"
            onPress={() => handleButtonPress(device.id)}
          >
            {device.device_name}
          </Button>
        ))}
      </ThemedView>
      {/* <ThemedView style={styles.chartContainer}>
        <ThemedView>
          <ProjectedUsageChart data={hourlyEnergyUsage} color="#21CABA" />
        </ThemedView>
      </ThemedView> */}
      {selectedButton && (
        <ThemedView style={styles.cardContainer}>
          <DataCard>
            <DataCard.ProjectedUsage deviceId={selectedButton} />
            <DataCard.ProjectedCost deviceId={selectedButton} />
          </DataCard>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  headerImage: {
    color: "#ffffff",
    bottom: 20,
    left: 10,
    position: "absolute",
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  stepContainer: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 15,
    marginRight: 15,
    marginTop: 5,
    alignItems: "center",
    gap: 8,
  },
  buttonGroup: {
    margin: 0,
  },
  cardContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 0,
  },
  chartContainer: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  selectedButton: {
    backgroundColor: "#f4f4f4", // Very light shade of #2BBDFF
    borderColor: "#e8e8e8",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
