"use client";

import { useEffect, useRef } from "react";
import type { FrameData } from "@/types/types";

interface FrameVisualizerProps {
  frameData: FrameData;
}

const SCALE = 40; // pixels per unit
const CANVAS_PADDING = 60;

export default function FrameVisualizer({ frameData }: FrameVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spans = frameData.spans || [];
    const supports = frameData.supports || [];
    const loads = frameData.loads || [];

    // Return early if no spans
    if (spans.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px sans-serif";
      ctx.fillText("No spans defined", CANVAS_PADDING, 100);
      return;
    }

    // Calculate bounds
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0;

    // Include span endpoints in bounds
    spans.forEach((span) => {
      const startX = span.horizontal_distance_from_left_end_origin;
      const startY = -span.vertical_distance_from_left_end_origin;
      let endX = startX,
        endY = startY;

      if (span.axis === "x" || span.axis === "-x") {
        endX = startX + (span.axis === "x" ? span.length : -span.length);
      } else {
        endY = startY + (span.axis === "y" ? span.length : -span.length);
      }

      minX = Math.min(minX, startX, endX);
      maxX = Math.max(maxX, startX, endX);
      minY = Math.min(minY, startY, endY);
      maxY = Math.max(maxY, startY, endY);
    });

    // Include supports in bounds
    supports.forEach((support) => {
      minX = Math.min(minX, support.horizontal_distance_from_left_end_origin);
      maxX = Math.max(maxX, support.horizontal_distance_from_left_end_origin);
      minY = Math.min(minY, -support.vertical_distance_from_left_end_origin);
      maxY = Math.max(maxY, -support.vertical_distance_from_left_end_origin);
    });

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw spans (beams/columns)
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    spans.forEach((span) => {
      const startX = span.horizontal_distance_from_left_end_origin;
      const startY = -span.vertical_distance_from_left_end_origin;
      let endX = startX,
        endY = startY;

      if (span.axis === "x" || span.axis === "-x") {
        endX = startX + (span.axis === "x" ? span.length : -span.length);
      } else {
        endY = startY + (span.axis === "y" ? span.length : -span.length);
      }

      drawLine(
        ctx,
        startX,
        startY,
        endX,
        endY,
        canvas.width,
        canvas.height,
        minX,
        maxX,
        minY,
        maxY
      );
    });

    // Draw supports
    supports.forEach((support) => {
      const x = support.horizontal_distance_from_left_end_origin;
      const y = support.vertical_distance_from_left_end_origin;
      const px = CANVAS_PADDING + (x - minX) * SCALE;
      const py = canvas.height - CANVAS_PADDING - (y - minY) * SCALE;

      if (support.name === "hinge") {
        drawHingeSupport(ctx, px, py);
      } else if (support.name === "roller") {
        drawRollerSupport(ctx, px, py);
      } else if (support.name === "fixed") {
        drawFixedSupport(ctx, px, py);
      }
    });

    // Draw loads
    loads.forEach((load) => {
      const x = load.horizontal_distance_from_left_end_origin;
      const y = load.vertical_distance_from_left_end_origin;

      if (load.name === "udl" && "load_per_distance" in load) {
        drawUDL(
          ctx,
          x,
          y,
          load.load_span,
          load.axis,
          load.load_per_distance,
          canvas.width,
          canvas.height,
          minX,
          maxX,
          minY,
          maxY
        );
      } else if (load.name === "vdl" && "left_load_per_distance" in load) {
        drawVDL(
          ctx,
          x,
          y,
          load.load_span,
          load.axis,
          load.left_load_per_distance,
          load.right_load_per_distance,
          canvas.width,
          canvas.height,
          minX,
          maxX,
          minY,
          maxY
        );
      } else if (load.name === "point_load" && "point_load_magnitude" in load) {
        const px = CANVAS_PADDING + (x - minX) * SCALE;
        const py = canvas.height - CANVAS_PADDING - (y - minY) * SCALE;
        drawPointLoad(ctx, px, py, load.point_load_magnitude, load.axis);
      }
    });

    // Draw title
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(frameData.title || "Frame Diagram", CANVAS_PADDING, 30);
  }, [frameData]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 rounded-lg bg-white"
      style={{ width: "100%", height: "auto" }}
    />
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 0.5;

  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  canvasWidth: number,
  canvasHeight: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  const px1 = CANVAS_PADDING + (x1 - minX) * SCALE;
  const py1 = canvasHeight - CANVAS_PADDING - (y1 - minY) * SCALE;
  const px2 = CANVAS_PADDING + (x2 - minX) * SCALE;
  const py2 = canvasHeight - CANVAS_PADDING - (y2 - minY) * SCALE;

  ctx.beginPath();
  ctx.moveTo(px1, py1);
  ctx.lineTo(px2, py2);
  ctx.stroke();
}

function drawHingeSupport(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number
) {
  const size = 12;
  ctx.fillStyle = "#1e40af";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - size, py + size);
  ctx.lineTo(px + size, py + size);
  ctx.closePath();
  ctx.fill();

  // Draw circle
  ctx.fillStyle = "#1e40af";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRollerSupport(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number
) {
  const size = 12;
  ctx.fillStyle = "#059669";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px - size, py + size);
  ctx.lineTo(px + size, py + size);
  ctx.closePath();
  ctx.fill();

  // Draw rollers
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = "#059669";
    ctx.beginPath();
    ctx.arc(px + i * 8, py + size + 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFixedSupport(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number
) {
  const size = 12;
  ctx.fillStyle = "#991b1b";
  ctx.fillRect(px - size, py, size * 2, size);

  // Draw hatching
  ctx.strokeStyle = "#991b1b";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(px - size + i * 6, py);
    ctx.lineTo(px - size + i * 6 - 4, py + size);
    ctx.stroke();
  }
}

function drawUDL(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  span: number,
  axis: string,
  magnitude: number,
  canvasWidth: number,
  canvasHeight: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  const px = CANVAS_PADDING + (x - minX) * SCALE;
  const py = canvasHeight - CANVAS_PADDING - (y - minY) * SCALE;
  const spanPx = span * SCALE;

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#fecaca";

  const arrowHeight = 30;

  // Draw arrows along the span
  const arrowCount = Math.max(3, Math.floor(span));
  for (let i = 0; i <= arrowCount; i++) {
    const t = i / arrowCount;
    const ax = px + t * spanPx;

    if (axis === "x" || axis === "-x") {
      const direction = axis === "x" ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ax, py - direction * arrowHeight);
      ctx.lineTo(ax, py);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(ax, py - direction * arrowHeight);
      ctx.lineTo(ax - 4, py - direction * (arrowHeight - 6));
      ctx.lineTo(ax + 4, py - direction * (arrowHeight - 6));
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw label
  ctx.fillStyle = "#dc2626";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${magnitude} kN/m`, px + spanPx / 2, py - 45);
}

function drawPointLoad(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  magnitude: number,
  axis: string
) {
  const arrowLength = 35;
  const arrowWidth = 10;

  ctx.strokeStyle = "#16a34a";
  ctx.fillStyle = "#16a34a";
  ctx.lineWidth = 2;

  let dirX = 0,
    dirY = 0;

  if (axis === "x") {
    dirX = 1;
  } else if (axis === "-x") {
    dirX = -1;
  } else if (axis === "y") {
    dirY = -1;
  } else if (axis === "-y") {
    dirY = 1;
  }

  // Start point is offset backwards by arrow length
  const startX = px - dirX * arrowLength;
  const startY = py - dirY * arrowLength;
  const endX = px;
  const endY = py;

  // Draw arrow line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw arrow head
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length;
  const uy = dy / length;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - ux * arrowWidth - uy * arrowWidth,
    endY - uy * arrowWidth + ux * arrowWidth
  );
  ctx.lineTo(
    endX - ux * arrowWidth + uy * arrowWidth,
    endY - uy * arrowWidth - ux * arrowWidth
  );
  ctx.closePath();
  ctx.fill();

  // Draw label
  ctx.fillStyle = "#16a34a";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  const labelX = startX + dx / 2 + uy * 15;
  const labelY = startY + dy / 2 - ux * 15;
  ctx.fillText(`${magnitude} kN`, labelX, labelY);
}

function drawVDL(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  span: number,
  axis: string,
  leftMag: number,
  rightMag: number,
  canvasWidth: number,
  canvasHeight: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
) {
  const px = CANVAS_PADDING + (x - minX) * SCALE;
  const py = canvasHeight - CANVAS_PADDING - (y - minY) * SCALE;
  const spanPx = span * SCALE;

  ctx.strokeStyle = "#9333ea";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#e9d5ff";

  const arrowCount = Math.max(3, Math.floor(span));

  const arrowPositions: Array<{ x: number; y: number }> = [];

  // Draw arrows with varying heights
  for (let i = 0; i <= arrowCount; i++) {
    const t = i / arrowCount;
    const mag = leftMag + (rightMag - leftMag) * t;
    const arrowHeight = 20 + (mag / Math.max(leftMag, rightMag)) * 15;
    const ax = px + t * spanPx;

    if (axis === "x" || axis === "-x") {
      const direction = axis === "x" ? 1 : -1;
      arrowPositions.push({ x: ax, y: py - direction * arrowHeight });

      ctx.beginPath();
      ctx.moveTo(ax, py - direction * arrowHeight);
      ctx.lineTo(ax, py);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(ax, py - direction * arrowHeight);
      ctx.lineTo(ax - 4, py - direction * (arrowHeight - 6));
      ctx.lineTo(ax + 4, py - direction * (arrowHeight - 6));
      ctx.closePath();
      ctx.fill();
    }
  }

  if (arrowPositions.length > 1) {
    ctx.strokeStyle = "#9333ea";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arrowPositions[0].x, arrowPositions[0].y);
    for (let i = 1; i < arrowPositions.length; i++) {
      ctx.lineTo(arrowPositions[i].x, arrowPositions[i].y);
    }
    ctx.stroke();
  }

  // Draw label
  ctx.fillStyle = "#9333ea";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${leftMag} - ${rightMag} kN/m`, px + spanPx / 2, py - 45);
}
