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

    // Find min and max shear values
    let minShear = 0;
    let maxShear = 0;
    spanIds.forEach((spanId) => {
      const spanData = analysisResults.spans[spanId];
      minShear = Math.min(minShear, spanData.shear_left, spanData.shear_right);
      maxShear = Math.max(maxShear, spanData.shear_left, spanData.shear_right);
    });

    const shearRange = maxShear - minShear || 1;

    // Draw shear force diagram
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let xPos = padding;
    let firstPoint = true;

    spanIds.forEach((spanId) => {
      const spanResults = analysisResults.spans[spanId];
      if (!spanResults) return;

      const shearLeft = spanResults.shear_left;
      const shearRight = spanResults.shear_right;

      // Convert shear value to canvas Y position
      const yLeft =
        height - padding - ((shearLeft - minShear) / shearRange) * plotHeight;
      const yRight =
        height - padding - ((shearRight - minShear) / shearRange) * plotHeight;

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

    // Fill area under curve (above and below axis)
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    xPos = padding;
    spanIds.forEach((spanId) => {
      const spanResults = analysisResults.spans[spanId];
      if (!spanResults) return;

      const shearLeft = spanResults.shear_left;
      const shearRight = spanResults.shear_right;

      const yLeft =
        height - padding - ((shearLeft - minShear) / shearRange) * plotHeight;
      const yRight =
        height - padding - ((shearRight - minShear) / shearRange) * plotHeight;

      const spanPixelWidth = (spanResults.length / totalLength) * plotWidth;

      ctx.lineTo(xPos, yLeft);
      ctx.lineTo(xPos + spanPixelWidth, yRight);

      xPos += spanPixelWidth;
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
