"use client";

import { useState } from "react";
import FrameInput from "@/components/input";
import FrameVisualizer from "@/components/visualizer";
import DiagramsPanel from "@/components/diagrams-panel";
import type { FrameData, AnalysisResults } from "@/types/types";

export default function Home() {
  const [frameData, setFrameData] = useState<FrameData>();
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVisualize = (data: FrameData) => {
    setFrameData(data);
  };

  const handleSubmit = (data: FrameData) => {
    setFrameData(data);
    setLoading(true);
    console.log(data);

    fetch("http://localhost:8000/slope_deflection_analyzer/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to submit frame data");
        }
        return res.json();
      })
      .then((response) => {
        console.log("Frame data submitted successfully");
        console.log("Analysis results:", response.analysis_results);
        if (response.analysis_results) {
          setAnalysisResults(response.analysis_results);
        }
      })
      .catch((error) => {
        console.error("Error submitting frame data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Structural Frame Analyzer
          </h1>
          <p className="text-gray-600">
            Define your frame geometry, supports, and loads to visualize the
            structure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <FrameInput
              onSubmit={handleSubmit}
              onVisualize={handleVisualize}
              loading={loading}
            />
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Frame Diagram
            </h2>
            <div className="flex-1 flex items-center justify-center">
              {frameData && <FrameVisualizer frameData={frameData} />}
            </div>
          </div>
        </div>

        {/* Diagrams Section */}
        {analysisResults && (
          <div className="mt-8">
            <DiagramsPanel analysisResults={analysisResults} />
          </div>
        )}
      </div>
    </main>
  );
}
