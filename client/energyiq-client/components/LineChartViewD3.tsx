import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, Text, Dimensions, ScrollView } from "react-native";
import { Text as SvgText, Circle } from "react-native-svg";
import * as d3 from "d3";
import Svg, { Defs, LinearGradient, Path, Stop, G } from "react-native-svg";

export type LineGrapProps = {
  data: { x: string; y: number }[];
  previousData: { x: string; y: number }[];
  color: string;
  label: string;
  stat: string;
};

const GRAPH_ASPECT_RATIO = 9 / 16;
const PADDING = 30;
const POINT_SPACING = 35;

const LineChartViewD3 = ({
  data,
  previousData,
  color,
  label,
  stat,
}: LineGrapProps) => {
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

  // Calculate based on the longest dataset
  const maxLength = Math.max(data.length, previousData.length);
  const calculatedWidth = Math.max(
    width,
    maxLength * POINT_SPACING + 2 * PADDING
  );

  // Scale to fit both datasets but scroll only for `data` length
  const xScale = d3
    .scaleLinear()
    .domain([0, maxLength - 1])
    .range([PADDING, calculatedWidth - PADDING]);

  const min = Math.min(
    ...data.map((point) => point.y).concat(previousData.map((point) => point.y))
  );
  const max = Math.max(
    ...data.map((point) => point.y).concat(previousData.map((point) => point.y))
  );

  const yScale = d3.scaleLinear().domain([min, max]).range([height, 0]);

  const lineFn = d3
    .line<{ x: string; y: number }>()
    .curve(d3.curveCatmullRom)
    .x((_, index) => xScale(index))
    .y((d) => yScale(d.y));

  const svgLine = lineFn(data) || "";
  const svgPreviousLine = lineFn(previousData) || "";

  const areaFn = d3
    .area<{ x: string; y: number }>()
    .curve(d3.curveCatmullRom)
    .x((_, index) => xScale(index))
    .y0(height)
    .y1((d) => yScale(d.y));

  const svgArea = areaFn(data) || "";
  const svgPreviousArea = areaFn(previousData) || "";

  // Scroll to the last point of the current data length only
  useEffect(() => {
    if (scrollViewRef.current) {
      let scrollToX = 0;
      if (data.length === previousData.length) {
        scrollToX = xScale(data.length - 1);
      } else if (data.length > previousData.length) {
        scrollToX = data.length * POINT_SPACING;
      } else {
        scrollToX = (data.length * POINT_SPACING) / 2;
      }
      console.log("scrollToX", scrollToX);
      scrollViewRef.current.scrollTo({
        x: scrollToX + PADDING,
        animated: true,
      });
    }
  }, [data.length]);

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
            <LinearGradient
              id="gradient-previous"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset={"0%"} stopColor="lightcoral" stopOpacity={0.2} />
              <Stop offset={"100%"} stopColor="lightcoral" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Area for Previous Data */}
          <G>
            <Path
              d={svgPreviousArea}
              fill="url(#gradient-previous)"
              stroke="none"
            />
          </G>

          {/* Area for Current Data */}
          <G>
            <Path d={svgArea} fill="url(#gradient-current)" stroke="none" />
          </G>

          {/* Line for Previous Data */}
          <G>
            <Path
              d={svgPreviousLine}
              fill="none"
              stroke="lightcoral"
              strokeWidth="2"
            />
          </G>

          {/* Line for Current Data */}
          <G>
            <Path d={svgLine} fill="none" stroke={color} strokeWidth="2" />
          </G>

          {/* Dots for Current Data */}
          {data.map((point, index) => (
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

          {/* Dots for Previous Data */}
          {previousData.map((point, index) => (
            <G key={`previousData-${index}`}>
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
                fill="lightcoral"
              />
            </G>
          ))}

          {/* X-Axis Labels */}
          {[...Array(maxLength)].map((_, index) => (
            <SvgText
              key={`x-axis-${index}`}
              x={xScale(index)}
              y={height + 30}
              fill="#888888"
              fontSize="12"
              textAnchor="middle"
            >
              {data[index]?.x || previousData[index]?.x || ""}
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

export default LineChartViewD3;
