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

    // Get span IDs from analysis results to maintain order
    const spanIds = Object.keys(analysisResults.spans).sort(
      (a, b) => Number(a) - Number(b)
    );

    // Calculate total span length from analysis results
    let totalLength = 0;
    spanIds.forEach((spanId) => {
      const spanData = analysisResults.spans[spanId];
      totalLength += spanData.length;
    });

    // Find min and max moment values
    let minMoment = 0;
    let maxMoment = 0;
    spanIds.forEach((spanId) => {
      const spanData = analysisResults.spans[spanId];
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

    let xPos = padding;
    let firstPoint = true;

    spanIds.forEach((spanId) => {
      const spanResults = analysisResults.spans[spanId];
      if (!spanResults) return;

      const momentLeft = spanResults.moment_left;
      const momentRight = spanResults.moment_right;

      // Convert moment value to canvas Y position
      const yLeft =
        height -
        padding -
        ((momentLeft - minMoment) / momentRange) * plotHeight;
      const yRight =
        height -
        padding -
        ((momentRight - minMoment) / momentRange) * plotHeight;

      const spanPixelWidth = (spanResults.length / totalLength) * plotWidth;

      if (firstPoint) {
        ctx.moveTo(xPos, yLeft);
        firstPoint = false;
      }
      ctx.lineTo(xPos, yLeft);
      ctx.lineTo(xPos + spanPixelWidth, yRight);

      xPos += spanPixelWidth;
    });

    ctx.stroke();

    // Fill area under curve
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    xPos = padding;
    spanIds.forEach((spanId) => {
      const spanResults = analysisResults.spans[spanId];
      if (!spanResults) return;

      const momentLeft = spanResults.moment_left;
      const momentRight = spanResults.moment_right;

      const yLeft =
        height -
        padding -
        ((momentLeft - minMoment) / momentRange) * plotHeight;
      const yRight =
        height -
        padding -
        ((momentRight - minMoment) / momentRange) * plotHeight;

      const spanPixelWidth = (spanResults.length / totalLength) * plotWidth;

      ctx.lineTo(xPos, yLeft);
      ctx.lineTo(xPos + spanPixelWidth, yRight);

      xPos += spanPixelWidth;
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
