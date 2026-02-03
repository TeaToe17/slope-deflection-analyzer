"use client";

import { useEffect, useRef } from "react";
import type { AnalysisResults } from "@/types/types";

interface ShearForceDiagramProps {
  analysisResults: AnalysisResults;
}

export default function ShearForceDiagram({
  analysisResults,
}: ShearForceDiagramProps) {
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

    // Find min and max shear values
    let minShear = 0;
    let maxShear = 0;
    spans.forEach(({ spanData }) => {
      minShear = Math.min(minShear, spanData.shear_left, spanData.shear_right);
      maxShear = Math.max(maxShear, spanData.shear_left, spanData.shear_right);
    });

    const shearRange = maxShear - minShear || 1;

    // Draw shear force diagram
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;

    spans.forEach(({ spanData, start, end }) => {
      const shearLeft = spanData.shear_left;
      const shearRight = spanData.shear_right;

      // Convert shear value to canvas Y position
      const yLeft =
        height - padding - ((shearLeft - minShear) / shearRange) * plotHeight;
      const yRight =
        height - padding - ((shearRight - minShear) / shearRange) * plotHeight;

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

    // Fill area under curve (above and below axis)
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    spans.forEach(({ spanData, start, end }) => {
      const shearLeft = spanData.shear_left;
      const shearRight = spanData.shear_right;

      const yLeft =
        height - padding - ((shearLeft - minShear) / shearRange) * plotHeight;
      const yRight =
        height - padding - ((shearRight - minShear) / shearRange) * plotHeight;

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

    // Draw reference line at zero shear
    if (minShear < 0 && maxShear > 0) {
      const zeroY =
        height - padding - ((0 - minShear) / shearRange) * plotHeight;
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
    ctx.fillText("Shear Force (kN)", 0, 0);
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
