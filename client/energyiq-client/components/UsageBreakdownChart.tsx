import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { GET_TOTAL_ENERGY_USAGE_BY_DEVICE } from "../constants/ApiEndpoint";

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
};

type UsageBreakdownChartProps = {
  date: string;
  type: string;
};

const UsageBreakdownChart = ({ date, type }: UsageBreakdownChartProps) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Reset loading state to true
      try {
        const response = await fetch(
          GET_TOTAL_ENERGY_USAGE_BY_DEVICE(date, type)
        );
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

  const chartHtml = chartData
    ? `
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
      </head>
      <body>
        <canvas id="myChart" width="400" height="${
          chartData.labels.length * 50
        }"></canvas>
        <script>
          var ctx = document.getElementById('myChart').getContext('2d');
          var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ${JSON.stringify(chartData.labels)},
              datasets: [{
                label: ${JSON.stringify(chartData.datasets[0].label)},
                data: ${JSON.stringify(chartData.datasets[0].data)},
                backgroundColor: [
                  '#f4a261',
                  '#8e7ef0',
                  '#64c3d3',
                  '#f08b8b'
                ],
                borderWidth: 0,
                barThickness: 80,  
                maxBarThickness: 80,  
                categoryPercentage: 1.0,  // Ensure bars occupy full category space
                barPercentage: 1.0
              }]
            },
            options: {
              responsive: true,
              indexAxis: 'y',
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true
                },
                datalabels: {
                  anchor: 'end',
                  align: 'end',
                  color: 'black',
                  font: {
                    size: 32
                  },
                  formatter: function(value) {
                    return value.toFixed(2);
                  }
                }
              },
              scales: {
                y: {
                  ticks: {
                    font: {
                      size: 32
                    }
                  }
                },
                x: {
                  ticks: {
                    font: {
                      size: 28  // Increase the font size of x-axis labels
                    }
                  }
                }
              },
              layout: {
                padding: {
                  right: 50
                }
              },
            },
            plugins: [ChartDataLabels]
          });
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
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    height: 400,
  },
});

export default UsageBreakdownChart;
