import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Platform, Text } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";
import InsightCarousel from "@/components/InsightCarousel";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button, ButtonGroup, Icon } from "@ui-kitten/components";
import DateScroller from "@/components/DateScroller";
import DataCard from "@/components/DataCard";
import LineChartView from "@/components/LineChartView";
import { TimePeriod } from "@/constants/TimePeriod";
import { GET_STATS, GET_CONSUMPTION_CHART_DATA } from "@/constants/ApiEndpoint";
import { ConsumptionChartData, EnergyStats, Insight } from "@/constants/Types";
import LineChartViewD3 from "@/components/LineChartViewD3";
import LoadingIndicator from "@/components/LoadingIndicator";

export default function HomeScreen() {
  const [selectedButtonIndex, setSelectedButtonIndex] = useState(0); // Default to "Hourly"
  const currentDate = new Date("2024-12-26");
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const timePeriods = [TimePeriod.Hourly, TimePeriod.Monthly];
  const [chartData, setChartData] = useState<ConsumptionChartData>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            GET_CONSUMPTION_CHART_DATA(
              selectedDate.toISOString(),
              timePeriods[selectedButtonIndex]
            )
          );
          const data = await response.json();
          setChartData(data.data);
        } catch (error) {
          console.error("Error fetching chart data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedDate, selectedButtonIndex]);

  const _onDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#21CABA", dark: "#21CABA" }}
      headerImage={<ThemedText style={styles.headerImage}>EnergyIQ</ThemedText>}
    >
      <InsightCarousel />
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="defaultSemiBold">Time period</ThemedText>
        <ThemedView>
          <ButtonGroup
            style={styles.buttonGroup}
            appearance="ghost"
            size="small"
          >
            <Button
              style={selectedButtonIndex === 0 && styles.selectedButton}
              onPress={() => setSelectedButtonIndex(0)}
            >
              Hourly
            </Button>
            <Button
              style={selectedButtonIndex === 1 && styles.selectedButton}
              onPress={() => setSelectedButtonIndex(1)}
            >
              Monthly
            </Button>
          </ButtonGroup>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <DateScroller
          timePeriod={timePeriods[selectedButtonIndex]}
          currentDate={currentDate}
          onDateChange={(date) => _onDateChange(date)}
        />
      </ThemedView>
      <ThemedView style={styles.cardContainer}>
        <DataCard>
          <DataCard.TotalUsage
            date={selectedDate?.toISOString() ?? ""}
            type={timePeriods[selectedButtonIndex]}
          />
          <DataCard.PeakHour
            date={selectedDate?.toISOString() ?? ""}
            type={timePeriods[selectedButtonIndex]}
          />
          <DataCard.PeakVsOffPeakRatio
            date={selectedDate?.toISOString() ?? ""}
            type={timePeriods[selectedButtonIndex]}
          />
          <DataCard.Cost
            date={selectedDate?.toISOString() ?? ""}
            type={timePeriods[selectedButtonIndex]}
          />
        </DataCard>
      </ThemedView>
      <ThemedView style={styles.chartContainer}>
        <ThemedText type="defaultSemiBold">Consumption chart</ThemedText>
        <ThemedView>
          {loading ? (
            <LoadingIndicator />
          ) : (
            <LineChartViewD3
              data={chartData?.data ?? []}
              previousData={chartData?.previousData ?? []}
              color="#21CABA"
              label="Energy Consumption"
              stat="kWh"
            />
          )}
        </ThemedView>
      </ThemedView>
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
    justifyContent: "space-between",
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    alignItems: "center",
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
