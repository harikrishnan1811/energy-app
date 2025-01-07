import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, ScrollView } from "react-native";
import { Text as SvgText, Circle } from "react-native-svg";
import * as d3 from "d3";
import Svg, { Defs, LinearGradient, Path, Stop, G } from "react-native-svg";
import { HourlyEnergyUsage } from "@/constants/Types";

export type ProjectedUsageProps = {
  data: HourlyEnergyUsage[];
  color: string;
};

const GRAPH_ASPECT_RATIO = 9 / 16;
const PADDING = 30;
const POINT_SPACING = 35;

const ProjectedUsageChart = ({ data, color }: ProjectedUsageProps) => {
  const [width, setWidth] = useState(Dimensions.get("window").width);
  const height = width * GRAPH_ASPECT_RATIO;
  const scrollViewRef = useRef<ScrollView>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: string | null;
  }>({
    x: 0,
    y: 0,
    value: null,
  });

  // Convert timestamps to local time and aggregate daily energy usage
  const localData = data.map((d) => ({
    ...d,
    timestamp: new Date(d.timestamp).toLocaleString(),
  }));

  // Sum up energy usage for each day and calculate cumulative usage
  const dailyData = d3
    .rollups(
      localData,
      (v) => d3.sum(v, (d) => parseFloat(d.energy_kwh)),
      (d) => d.timestamp.split(",")[0]
    )
    .map(([x, y]) => ({ x: new Date(x), y }));

  let cumulativeUsage = 0;
  const cumulativeData = dailyData.map((d) => {
    cumulativeUsage += d.y;
    return { x: d.x, y: cumulativeUsage };
  });

  const maxLength = cumulativeData.length;
  const calculatedWidth = Math.max(
    width,
    maxLength * POINT_SPACING + 2 * PADDING
  );

  const xScale = d3
    .scaleLinear()
    .domain([0, maxLength - 1])
    .range([PADDING, calculatedWidth - PADDING]);

  const min = d3.min(cumulativeData, (d) => d.y) || 0;
  const max = d3.max(cumulativeData, (d) => d.y) || 0;

  const yScale = d3.scaleLinear().domain([min, max]).range([height, 0]);

  const lineFn = d3
    .line<{ x: Date; y: number }>()
    .curve(d3.curveCatmullRom)
    .x((_, index) => xScale(index))
    .y((d) => yScale(d.y));

  const svgLine = lineFn(cumulativeData) || "";

  const areaFn = d3
    .area<{ x: Date; y: number }>()
    .curve(d3.curveCatmullRom)
    .x((_, index) => xScale(index))
    .y0(height)
    .y1((d) => yScale(d.y));

  const svgArea = areaFn(cumulativeData) || "";

  useEffect(() => {
    if (scrollViewRef.current) {
      const scrollToX = xScale(cumulativeData.length - 1);
      scrollViewRef.current.scrollTo({
        x: scrollToX + PADDING,
        animated: true,
      });
    }
  }, [cumulativeData.length]);

  const handleDotPress = (x: number, y: number, value: number) => {
    setTooltip({ x, y, value: value.toFixed(2) });
  };

  return (
    <View
      style={styles.chartContainer}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        ref={scrollViewRef}
      >
        <Svg width={calculatedWidth} height={height + 50}>
          <Defs>
            <LinearGradient
              id="gradient-current"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset={"0%"} stopColor={color} stopOpacity={0.2} />
              <Stop offset={"100%"} stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Area for Current Data */}
          <G>
            <Path d={svgArea} fill="url(#gradient-current)" stroke="none" />
          </G>

          {/* Line for Current Data */}
          <G>
            <Path d={svgLine} fill="none" stroke={color} strokeWidth="2" />
          </G>

          {/* Dots for Current Data */}
          {cumulativeData.map((point, index) => (
            <G key={`data-${index}`}>
              <Circle
                cx={xScale(index)}
                cy={yScale(point.y)}
                r={12}
                fill="transparent"
                onPressIn={() =>
                  handleDotPress(xScale(index), yScale(point.y), point.y)
                }
              />
              <Circle
                cx={xScale(index)}
                cy={yScale(point.y)}
                r={3}
                fill={color}
              />
            </G>
          ))}

          {/* X-Axis Labels */}
          {cumulativeData.map((point, index) => (
            <SvgText
              key={`x-axis-${index}`}
              x={xScale(index)}
              y={height + 30}
              fill="#888888"
              fontSize="12"
              textAnchor="middle"
            >
              {point.x.getDate()}
            </SvgText>
          ))}

          {/* X-Axis Line */}
          <Path
            d={`M ${PADDING} ${height} H ${calculatedWidth - PADDING}`}
            stroke="#888888"
            strokeWidth="1"
          />

          {/* Tooltip */}
          {tooltip.value !== null && (
            <>
              <Circle
                cx={tooltip.x}
                cy={tooltip.y}
                r={10}
                fill="white"
                stroke="black"
              />
              <SvgText
                x={tooltip.x}
                y={tooltip.y - 15}
                fill="black"
                fontSize="14"
                textAnchor="middle"
                fontWeight="bold"
              >
                {tooltip.value}
              </SvgText>
            </>
          )}
        </Svg>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    borderWidth: 1,
    borderColor: "#f8f8f8",
    padding: 10,
    width: "100%",
    marginTop: 10,
  },
});

export default ProjectedUsageChart;
