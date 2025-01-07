import React from "react";
import { StyleSheet, SafeAreaView, View, Text, Dimensions } from "react-native";
import { Svg, Path, Line, G, Text as SvgText } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width } = Dimensions.get("window");

type DataPoint = {
  x: number;
  y: number;
};

const hardcodedData: DataPoint[] = [
  { x: 10, y: 100 },
  { x: 50, y: 80 },
  { x: 90, y: 120 },
  { x: 130, y: 60 },
  { x: 170, y: 90 },
];

const generatePath = (data: DataPoint[]): string => {
  return data
    .map((point, index) =>
      index === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`
    )
    .join(" ");
};

const LineChartView = () => {
  const path = generatePath(hardcodedData);
  const transition = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => {
    return {
      d: path,
    };
  });

  React.useEffect(() => {
    transition.value = withTiming(1, { duration: 1000 });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Simple Line Chart</Text>
      </View>
      <Animated.View style={styles.chartContainer}>
        <Svg width={width} height={200} stroke="#6231ff">
          <G y={0}>
            <Line
              x1={0}
              y1={200}
              x2={width}
              y2={200}
              stroke={"#d7d7d7"}
              strokeWidth="1"
            />
            <Line
              x1={50}
              y1={0}
              x2={50}
              y2={200}
              stroke={"#d7d7d7"}
              strokeWidth="1"
            />
            <SvgText x={5} y={20} fontSize="12">
              Y Axis
            </SvgText>
            <SvgText x={width - 40} y={190} fontSize="12">
              X Axis
            </SvgText>
            <AnimatedPath
              animatedProps={animatedProps}
              strokeWidth="2"
              stroke="#6231ff"
            />
          </G>
        </Svg>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chartContainer: {
    borderWidth: 1,
    borderColor: "#d7d7d7",
    padding: 10,
  },
});

export default LineChartView;
