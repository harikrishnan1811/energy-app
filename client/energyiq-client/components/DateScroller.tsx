import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TimePeriod } from "@/constants/TimePeriod";

interface DateScrollerProps {
  style?: object;
  timePeriod: TimePeriod;
  currentDate: Date;
  onDateChange?: (date: Date) => void;
}

const currentDate = new Date("2024-12-26");

const DateScroller = (props: DateScrollerProps) => {
  const { timePeriod, style, onDateChange } = props;
  const [hourlyEntries, setHourlyEntries] = useState<
    { day: string; date: string }[]
  >([]);
  const [monthlyEntries, setMonthlyEntries] = useState<
    { day: string; date: string }[]
  >([]);
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState<number>(4); // Initially select the current date item
  const [selectedMonthlyIndex, setSelectedMonthlyIndex] = useState<number>(5); // Initially select the current month item
  const carouselRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const newHourlyEntries = [];
    const newMonthlyEntries = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      newHourlyEntries.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate().toString().padStart(2, "0"),
      });
    }
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      newMonthlyEntries.push({
        day: date.getFullYear().toString().slice(-2),
        date: date.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    setHourlyEntries(newHourlyEntries);
    setMonthlyEntries(newMonthlyEntries);
    setSelectedHourlyIndex(4); // Initially select the current date item
    setSelectedMonthlyIndex(4); // Initially select the current month item
  }, []);

  const _renderItem = (
    item: { day: string; date: string },
    index: number,
    isMonthly: boolean
  ) => {
    const isSelected = isMonthly
      ? index === selectedMonthlyIndex
      : index === selectedHourlyIndex;
    return (
      <TouchableOpacity
        style={[styles.slide, isSelected && styles.selectedSlide]}
        key={index}
        onPress={() => {
          if (isMonthly) {
            setSelectedMonthlyIndex(index);
            const newDate = new Date(currentDate);
            newDate.setMonth(currentDate.getMonth() - (4 - index));
            onDateChange?.(newDate);
          } else {
            setSelectedHourlyIndex(index);
            const newDate = new Date(currentDate);
            newDate.setDate(currentDate.getDate() - (4 - index));
            onDateChange?.(newDate);
          }
        }}
      >
        <Text
          style={[
            styles.title,
            isSelected && styles.selectedTitle,
            isMonthly && styles.monthlyTitle,
          ]}
        >
          {item.day}
        </Text>
        <Text
          style={[
            styles.text,
            isSelected && styles.selectedText,
            isMonthly && styles.monthlyText,
          ]}
        >
          {item.date}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      {timePeriod === TimePeriod.Hourly &&
        hourlyEntries.length > 0 &&
        hourlyEntries.map((item, index) => _renderItem(item, index, false))}
      {timePeriod === TimePeriod.Monthly &&
        monthlyEntries.length > 0 &&
        monthlyEntries.map((item, index) => _renderItem(item, index, true))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  slide: {
    flex: 1,
    flexDirection: "column",
    borderColor: "#e6e6e6",
    borderWidth: 1,
    margin: 5,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    alignContent: "center",
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 15,
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    color: "#000",
  },
  text: {
    fontSize: 24,
    textAlign: "center",
    color: "#000",
    fontWeight: "bold",
  },
  selectedSlide: {
    borderColor: "#2BBDFF",
    backgroundColor: "#2BBDFF",
  },
  selectedTitle: {
    color: "#FFF",
  },
  selectedText: {
    color: "#FFF",
  },
  monthlyTitle: {
    fontSize: 16,
  },
  monthlyText: {
    fontSize: 18,
  },
});

export default DateScroller;
