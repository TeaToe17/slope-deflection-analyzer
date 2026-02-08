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

    let minX = Math.min(...diagramPoints.map((point) => point.x));
    let maxX = Math.max(...diagramPoints.map((point) => point.x));
    let minY = Math.min(...diagramPoints.map((point) => point.y));
    let maxY = Math.max(...diagramPoints.map((point) => point.y));

      const spanStart =
        padding + ((start - minSpanPosition) / totalLength) * plotWidth;
      const spanEnd =
        padding + ((end - minSpanPosition) / totalLength) * plotWidth;

      ctx.lineTo(spanStart, yLeft);
      ctx.lineTo(spanEnd, yRight);
    });

    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw base spans
    ctx.strokeStyle = "#6b7280";
    ctx.lineWidth = 2;
    spans.forEach(({ startX, startY, endX, endY }) => {
      const start = toCanvas(startX, startY);
      const end = toCanvas(endX, endY);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // Draw shear force diagram per span
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    perSpanSamples.forEach(
      ({ startX, startY, axisDirection, positions, shearValues }) => {
        const polyline = positions.map((position, index) => {
          const baseX = startX + axisDirection.x * position;
          const baseY = startY + axisDirection.y * position;
          const shearValue = shearValues[index];
          return {
            base: toCanvas(baseX, baseY),
            offset: toCanvas(
              baseX + axisDirection.normalX * shearValue * shearScale,
              baseY + axisDirection.normalY * shearValue * shearScale
            ),
          };
        });

        ctx.beginPath();
        polyline.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.offset.x, point.offset.y);
          } else {
            ctx.lineTo(point.offset.x, point.offset.y);
          }
        });
        ctx.stroke();

        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.beginPath();
        polyline.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.base.x, point.base.y);
            ctx.lineTo(point.offset.x, point.offset.y);
          } else {
            ctx.lineTo(point.offset.x, point.offset.y);
          }
        });
        const lastBase = polyline[polyline.length - 1].base;
        ctx.lineTo(lastBase.x, lastBase.y);
        ctx.closePath();
        ctx.fill();
      }
    );

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

type AxisDirection = {
  x: number;
  y: number;
  normalX: number;
  normalY: number;
};

function getAxisDirection(axis: string): AxisDirection {
  if (axis === "-x") {
    return { x: -1, y: 0, normalX: 0, normalY: -1 };
  }
  if (axis === "y") {
    return { x: 0, y: 1, normalX: 1, normalY: 0 };
  }
  if (axis === "-y") {
    return { x: 0, y: -1, normalX: 1, normalY: 0 };
  }
  return { x: 1, y: 0, normalX: 0, normalY: -1 };
}

type NormalizedLoad =
  | {
      type: "point_load";
      position: number;
      magnitude: number;
    }
  | {
      type: "udl";
      start: number;
      length: number;
      magnitude: number;
    }
  | {
      type: "vdl";
      start: number;
      length: number;
      leftMagnitude: number;
      rightMagnitude: number;
    };

function normalizeLoads(spanData: AnalysisResults["spans"][string]) {
  return (spanData.loads_on_span || []).map((load) => {
    const start = getLocalPosition(spanData, load);
    if (load.name === "point_load") {
      return {
        type: "point_load",
        position: clamp(start, 0, spanData.length),
        magnitude: load.point_load_magnitude,
      } satisfies NormalizedLoad;
    }
    if (load.name === "udl") {
      return {
        type: "udl",
        start: clamp(start, 0, spanData.length),
        length: load.load_span,
        magnitude: load.load_per_distance,
      } satisfies NormalizedLoad;
    }
    return {
      type: "vdl",
      start: clamp(start, 0, spanData.length),
      length: load.load_span,
      leftMagnitude: load.left_load_per_distance,
      rightMagnitude: load.right_load_per_distance,
    } satisfies NormalizedLoad;
  });
}

function getLocalPosition(
  spanData: AnalysisResults["spans"][string],
  load: AnalysisResults["spans"][string]["loads_on_span"][number]
) {
  if (spanData.axis === "x") {
    return (
      load.horizontal_distance_from_left_end_origin -
      spanData.horizontal_distance_from_left_end_origin
    );
  }
  if (spanData.axis === "-x") {
    return (
      spanData.horizontal_distance_from_left_end_origin -
      load.horizontal_distance_from_left_end_origin
    );
  }
  if (spanData.axis === "y") {
    return (
      load.vertical_distance_from_left_end_origin -
      spanData.vertical_distance_from_left_end_origin
    );
  }
  return (
    spanData.vertical_distance_from_left_end_origin -
    load.vertical_distance_from_left_end_origin
  );
}

function buildSamplePositions(
  length: number,
  loads: NormalizedLoad[],
  includeJumps: boolean
) {
  const positions = new Set<number>();
  const epsilon = Math.max(length * 1e-4, 1e-6);
  positions.add(0);
  positions.add(length);

  const stepCount = 20;
  for (let i = 1; i < stepCount; i += 1) {
    positions.add((length * i) / stepCount);
  }

  loads.forEach((load) => {
    if (load.type === "point_load") {
      positions.add(load.position);
      if (includeJumps) {
        positions.add(clamp(load.position - epsilon, 0, length));
        positions.add(clamp(load.position + epsilon, 0, length));
      }
    } else {
      if (load.length > 0) {
        positions.add(load.start);
        positions.add(clamp(load.start + load.length, 0, length));
        const segmentCount = 8;
        for (let i = 1; i < segmentCount; i += 1) {
          const segment = load.start + (load.length * i) / segmentCount;
          positions.add(clamp(segment, 0, length));
        }
      }
    }
  });

  return Array.from(positions).sort((a, b) => a - b);
}

function computeShearAt(
  position: number,
  shearLeft: number,
  loads: NormalizedLoad[]
) {
  let shear = shearLeft;
  loads.forEach((load) => {
    if (load.type === "point_load") {
      if (position >= load.position) {
        shear -= load.magnitude;
      }
      return;
    }
    const length = clamp(position - load.start, 0, load.length);
    if (length <= 0 || load.length <= 0) {
      return;
    }
    if (load.type === "udl") {
      shear -= load.magnitude * length;
      return;
    }
    const slope = (load.rightMagnitude - load.leftMagnitude) / load.length;
    shear -= load.leftMagnitude * length + 0.5 * slope * length * length;
  });
  return shear;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
