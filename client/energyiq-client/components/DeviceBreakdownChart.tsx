import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { GET_COST_BREAKDOWN_BY_DEVICES } from "../constants/ApiEndpoint";

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
  }[];
};

type DeviceBreakdownChartProps = {
  date: string;
  type: string;
};

const DeviceBreakdownChart = ({ date, type }: DeviceBreakdownChartProps) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Reset loading state to true
      try {
        const response = await fetch(GET_COST_BREAKDOWN_BY_DEVICES(date, type));
        const result = await response.json();
        if (result.success) {
          setChartData(result.data);
          console.log("Chart data:", result.data);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, type]);

  const screenWidth = Dimensions.get("window").width;

  const chartHtml = chartData
    ? `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1"></script>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          canvas {
            display: block;
          }
        </style>
      </head>
      <body>
        <canvas id="myChart" width="${screenWidth}" height="${screenWidth}"></canvas>
        <script>
          setTimeout(function() {
            var ctx = document.getElementById('myChart').getContext('2d');
            var total = ${JSON.stringify(
              chartData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(2)
            )};
            new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: ${JSON.stringify(chartData.labels)},
                datasets: [{
                  data: ${JSON.stringify(chartData.datasets[0].data)},
                  backgroundColor: [
                    '#f4a261',
                    '#8e7ef0',
                    '#64c3d3',
                    '#f08b8b'
                  ],
                  borderWidth: 0
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true
                  },
                  tooltip: {
                    enabled: true,
                    bodyFont: {
                      size: 24
                    },
                    titleFont: {
                      size: 24
                    }
                  }
                },
                cutout: '50%'
              },
              plugins: [{
                beforeDraw: function(chart) {
                  var width = chart.width,
                      height = chart.height,
                      ctx = chart.ctx;
                  ctx.restore();
                  var fontSize = (height / 200).toFixed(2);
                  ctx.font = fontSize + "em sans-serif";
                  ctx.textBaseline = "middle";
                  var text = total + ' NOK',
                      textX = Math.round((width - ctx.measureText(text).width) / 2),
                      textY = height / 2;
                  ctx.fillText(text, textX, textY + 20); // Adjusted position
                  ctx.save();
                }
              }]
            });
          }, 500);
        </script>
      </body>
    </html>
  `
    : "";

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      {loading ? (
        <ActivityIndicator size="small" color="#21CABA" />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html: chartHtml }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    width: "100%",
    height: Dimensions.get("window").width,
  },
});

export default DeviceBreakdownChart;
