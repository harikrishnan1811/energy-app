import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Carousel from "pinar";
import { GET_INSIGHTS } from "@/constants/ApiEndpoint";
import { Insight } from "@/constants/Types";

export default function InsightCarousel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(GET_INSIGHTS)
      .then((response) => response.json())
      .then((response) => {
        setInsights(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching insights:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", margin: 10 }}>
        <ActivityIndicator size="small" color="#00A696" />
      </View>
    );
  }

  return (
    <Carousel
      mergeStyles
      style={{
        height: 80,
        maxHeight: 80,
        backgroundColor: "#fff",
        borderColor: "#e6e6e6",
        borderWidth: 1,
        margin: 10,
        padding: 10,
        position: "relative",
      }}
      loop
      showsControls={false}
      showsDots={true}
      dotsContainerStyle={{
        position: "absolute",
        bottom: 0,
      }}
    >
      {insights.map((insight, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            width: "90%",
          }}
        >
          <Text
            style={{
              color: "#00A696",
              opacity: 0.6,
              fontSize: 14,
              width: "auto",
            }}
          >
            {insight.insight_text}
          </Text>
        </View>
      ))}
    </Carousel>
  );
}
