"use client";

import type { AnalysisResults, FrameData } from "@/types/types";
import ShearForceDiagram from "./shear-force-diagram";
import BendingMomentDiagram from "./bending-moment-diagram";

interface DiagramsPanelProps {
  analysisResults: AnalysisResults ;
//   frameData: FrameData;
}

export default function DiagramsPanel({
  analysisResults ,
//   frameData,
}: DiagramsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Shear Force Diagram */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Shear Force Diagram
        </h2>
        <div className="flex items-center justify-center h-96">
          <ShearForceDiagram analysisResults={analysisResults} />
        </div>
      </div>

      {/* Bending Moment Diagram */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Bending Moment Diagram
        </h2>
        <div className="flex items-center justify-center h-96">
          <BendingMomentDiagram analysisResults={analysisResults} />
        </div>
      </div>
    </div>
  );
}
