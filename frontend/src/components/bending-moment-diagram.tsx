"use client";

import { useEffect, useRef } from "react";
import type { AnalysisResults } from "@/types/types";

interface BendingMomentDiagramProps {
  analysisResults: AnalysisResults;
}

export default function BendingMomentDiagram({
  analysisResults,
}: BendingMomentDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const spans = Object.entries(analysisResults.spans)
      .map(([spanId, spanData]) => {
        const start =
          spanData.axis === "y"
            ? spanData.vertical_distance_from_left_end_origin
            : spanData.horizontal_distance_from_left_end_origin;
        const end = start + spanData.length;
        return { spanId, spanData, start, end };
      })
      .sort((a, b) => a.start - b.start || a.end - b.end);

    if (spans.length === 0) {
      return;
    }

    const minSpanPosition = Math.min(...spans.map((span) => span.start));
    const maxSpanPosition = Math.max(...spans.map((span) => span.end));
    const totalLength = maxSpanPosition - minSpanPosition || 1;

    // Find min and max moment values
    let minMoment = 0;
    let maxMoment = 0;
    spans.forEach(({ spanData }) => {
      minMoment = Math.min(
        minMoment,
        spanData.moment_left,
        spanData.moment_right
      );
      maxMoment = Math.max(
        maxMoment,
        spanData.moment_left,
        spanData.moment_right
      );
    });

    const momentRange = maxMoment - minMoment || 1;

    // Draw bending moment diagram
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;

    spans.forEach(({ spanData, start, end }) => {
      const momentLeft = spanData.moment_left;
      const momentRight = spanData.moment_right;

      // Convert moment value to canvas Y position
      const yLeft =
        height -
        padding -
        ((momentLeft - minMoment) / momentRange) * plotHeight;
      const yRight =
        height -
        padding -
        ((momentRight - minMoment) / momentRange) * plotHeight;

      const spanStart =
        padding + ((start - minSpanPosition) / totalLength) * plotWidth;
      const spanEnd =
        padding + ((end - minSpanPosition) / totalLength) * plotWidth;

      if (firstPoint) {
        ctx.moveTo(spanStart, yLeft);
        firstPoint = false;
      }
      ctx.lineTo(spanStart, yLeft);
      ctx.lineTo(spanEnd, yRight);
    });

    ctx.stroke();

    // Fill area under curve
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    spans.forEach(({ spanData, start, end }) => {
      const momentLeft = spanData.moment_left;
      const momentRight = spanData.moment_right;

      const yLeft =
        height -
        padding -
        ((momentLeft - minMoment) / momentRange) * plotHeight;
      const yRight =
        height -
        padding -
        ((momentRight - minMoment) / momentRange) * plotHeight;

      const spanStart =
        padding + ((start - minSpanPosition) / totalLength) * plotWidth;
      const spanEnd =
        padding + ((end - minSpanPosition) / totalLength) * plotWidth;

      ctx.lineTo(spanStart, yLeft);
      ctx.lineTo(spanEnd, yRight);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw reference line at zero moment
    if (minMoment < 0 && maxMoment > 0) {
      const zeroY =
        height - padding - ((0 - minMoment) / momentRange) * plotHeight;
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, zeroY);
      ctx.lineTo(width - padding, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw axis labels
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Distance", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Bending Moment (kN·m)", 0, 0);
    ctx.restore();
  }, [analysisResults]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={400}
      className="border border-gray-300 rounded"
    />
  );
}
