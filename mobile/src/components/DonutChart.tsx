import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

const GAP_PX = 3;
const TRACK_COLOR = "#e1e0d9";

export default function DonutChart({
  segments,
  size = 168,
  strokeWidth = 26,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Base track circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TRACK_COLOR}
            strokeWidth={strokeWidth}
          />
          {/* Colored segments */}
          {total > 0 &&
            segments.map((s) => {
              if (s.value <= 0) return null;
              const len = (s.value / total) * circumference;
              const dash = Math.max(len - GAP_PX, 0);
              const offset = -cumulative;
              cumulative += len;

              return (
                <Circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={[dash, circumference - dash]}
                  strokeDashoffset={offset}
                />
              );
            })}
        </Svg>
      </View>
      {(centerLabel || centerValue) && (
        <View style={styles.centerContainer}>
          {centerLabel && <Text style={styles.label}>{centerLabel}</Text>}
          {centerValue && <Text style={styles.value}>{centerValue}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94a3b8",
    textAlign: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0d463a", // brand-900 equivalent
    textAlign: "center",
    marginTop: 2,
  },
});
