"use client";

import { useState } from "react";
import type {
  FrameData,
  Span,
  Support,
  Load,
  PointLoad,
  UDL,
  VDL,
} from "@/types/types";

interface FrameInputProps {
  onSubmit: (data: FrameData) => void;
  onVisualize: (data: FrameData) => void;
  loading: boolean;
}

export function FrameInput({
  onSubmit,
  onVisualize,
  loading,
}: FrameInputProps) {
  const [title, setTitle] = useState("My Frame");
  const [spans, setSpans] = useState<Span[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);

  const handleAddSpan = () => {
    setSpans([
      ...spans,
      {
        length: 4,
        ei: 2,
        axis: "x",
        horizontal_distance_from_left_end_origin: 0,
        vertical_distance_from_left_end_origin: 0,
      },
    ]);
  };

  const handleAddSupport = () => {
    setSupports([
      ...supports,
      {
        name: "hinge",
        horizontal_distance_from_left_end_origin: 0,
        vertical_distance_from_left_end_origin: 0,
        deflection: 0,
      },
    ]);
  };

  const handleAddLoad = () => {
    setLoads([
      ...loads,
      {
        name: "point_load",
        point_load_magnitude: 10,
        axis: "x",
        horizontal_distance_from_left_end_origin: 0,
        vertical_distance_from_left_end_origin: 0,
      } as Load,
    ]);
  };

  const handleUpdateSpan = (index: number, updates: Partial<Span>) => {
    const newSpans = [...spans];
    newSpans[index] = { ...newSpans[index], ...updates };
    setSpans(newSpans);
  };

  const handleUpdateSupport = (index: number, updates: Partial<Support>) => {
    const newSupports = [...supports];
    newSupports[index] = { ...newSupports[index], ...updates };
    setSupports(newSupports);
  };

  const handleUpdateLoad = (index: number, field: string, value: unknown) => {
    const newLoads = [...loads];
    const load = newLoads[index];

    if (field === "name") {
      const newType = value as "point_load" | "udl" | "vdl";
      if (newType === "point_load") {
        newLoads[index] = {
          name: "point_load",
          point_load_magnitude: 10,
          axis: load.axis,
          horizontal_distance_from_left_end_origin:
            load.horizontal_distance_from_left_end_origin,
          vertical_distance_from_left_end_origin:
            load.vertical_distance_from_left_end_origin,
        } as PointLoad;
      } else if (newType === "udl") {
        newLoads[index] = {
          name: "udl",
          load_per_distance: 10,
          load_span: 4,
          axis: load.axis,
          horizontal_distance_from_left_end_origin:
            load.horizontal_distance_from_left_end_origin,
          vertical_distance_from_left_end_origin:
            load.vertical_distance_from_left_end_origin,
        } as UDL;
      } else if (newType === "vdl") {
        newLoads[index] = {
          name: "vdl",
          left_load_per_distance: 10,
          right_load_per_distance: 15,
          load_span: 4,
          axis: load.axis,
          horizontal_distance_from_left_end_origin:
            load.horizontal_distance_from_left_end_origin,
          vertical_distance_from_left_end_origin:
            load.vertical_distance_from_left_end_origin,
        } as VDL;
      }
    } else if (load.name === "point_load" && field === "point_load_magnitude") {
      (load as PointLoad).point_load_magnitude = value as number;
    } else if (load.name === "udl" && field === "load_per_distance") {
      (load as UDL).load_per_distance = value as number;
    } else if (load.name === "udl" && field === "load_span") {
      (load as UDL).load_span = value as number;
    } else if (load.name === "vdl" && field === "left_load_per_distance") {
      (load as VDL).left_load_per_distance = value as number;
    } else if (load.name === "vdl" && field === "right_load_per_distance") {
      (load as VDL).right_load_per_distance = value as number;
    } else if (load.name === "vdl" && field === "load_span") {
      (load as VDL).load_span = value as number;
    } else if (field === "axis") {
      load.axis = value as string;
    } else if (field === "horizontal_distance_from_left_end_origin") {
      load.horizontal_distance_from_left_end_origin = value as number;
    } else if (field === "vertical_distance_from_left_end_origin") {
      load.vertical_distance_from_left_end_origin = value as number;
    }

    setLoads(newLoads);
  };

  const handleRemoveSpan = (index: number) => {
    setSpans(spans.filter((_, i) => i !== index));
  };

  const handleRemoveSupport = (index: number) => {
    setSupports(supports.filter((_, i) => i !== index));
  };

  const handleRemoveLoad = (index: number) => {
    setLoads(loads.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const data: FrameData = {
      title,
      spans: spans || [],
      supports: supports || [],
      loads: loads || [],
    };
    onSubmit(data);
  };

  const [frameData, setFrameData] = useState<FrameData>({
    title,
    spans,
    supports,
    loads,
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frame Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter frame title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Spans Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Spans</h3>
          <button
            onClick={handleAddSpan}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            + Add Span
          </button>
        </div>
        {spans.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500 text-sm">
            No spans added. Click "Add Span" to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {spans.map((span, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Length
                    </label>
                    <input
                      type="number"
                      value={span.length}
                      onChange={(e) =>
                        handleUpdateSpan(i, { length: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      EI
                    </label>
                    <input
                      type="number"
                      value={span.ei}
                      onChange={(e) =>
                        handleUpdateSpan(i, { ei: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Axis
                    </label>
                    <select
                      value={span.axis}
                      onChange={(e) =>
                        handleUpdateSpan(i, { axis: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="x">X</option>
                      <option value="-x">-X</option>
                      <option value="y">Y</option>
                      <option value="-y">-Y</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      H Dist
                    </label>
                    <input
                      type="number"
                      value={span.horizontal_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateSpan(i, {
                          horizontal_distance_from_left_end_origin: Number(
                            e.target.value
                          ),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      V Dist
                    </label>
                    <input
                      type="number"
                      value={span.vertical_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateSpan(i, {
                          vertical_distance_from_left_end_origin: Number(
                            e.target.value
                          ),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end col-span-2">
                    <button
                      onClick={() => handleRemoveSpan(i)}
                      className="w-full px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supports Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Supports</h3>
          <button
            onClick={handleAddSupport}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            + Add Support
          </button>
        </div>
        {supports.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500 text-sm">
            No supports added. Click "Add Support" to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {supports.map((support, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Type
                    </label>
                    <select
                      value={support.name}
                      onChange={(e) =>
                        handleUpdateSupport(i, { name: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="hinge">Hinge</option>
                      <option value="roller">Roller</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Deflection
                    </label>
                    <input
                      type="number"
                      value={support.deflection || 0}
                      onChange={(e) =>
                        handleUpdateSupport(i, {
                          deflection: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      H Dist
                    </label>
                    <input
                      type="number"
                      value={support.horizontal_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateSupport(i, {
                          horizontal_distance_from_left_end_origin: Number(
                            e.target.value
                          ),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      V Dist
                    </label>
                    <input
                      type="number"
                      value={support.vertical_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateSupport(i, {
                          vertical_distance_from_left_end_origin: Number(
                            e.target.value
                          ),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => handleRemoveSupport(i)}
                      className="w-full px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loads Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Loads</h3>
          <button
            onClick={handleAddLoad}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            + Add Load
          </button>
        </div>
        {loads.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 rounded-md text-center text-gray-500 text-sm">
            No loads added. Click "Add Load" to create one.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loads.map((load, i) => (
              <div
                key={i}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Load Type
                    </label>
                    <select
                      value={load.name}
                      onChange={(e) =>
                        handleUpdateLoad(i, "name", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="point_load">Point Load</option>
                      <option value="udl">UDL</option>
                      <option value="vdl">VDL</option>
                    </select>
                  </div>

                  {load.name === "udl" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Load/Distance
                        </label>
                        <input
                          type="number"
                          value={(load as UDL).load_per_distance}
                          onChange={(e) =>
                            handleUpdateLoad(
                              i,
                              "load_per_distance",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Span Length
                        </label>
                        <input
                          type="number"
                          value={(load as UDL).load_span}
                          onChange={(e) =>
                            handleUpdateLoad(
                              i,
                              "load_span",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {load.name === "point_load" && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Magnitude
                      </label>
                      <input
                        type="number"
                        value={(load as PointLoad).point_load_magnitude}
                        onChange={(e) =>
                          handleUpdateLoad(
                            i,
                            "point_load_magnitude",
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {load.name === "vdl" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Left Load/Distance
                        </label>
                        <input
                          type="number"
                          value={(load as VDL).left_load_per_distance}
                          onChange={(e) =>
                            handleUpdateLoad(
                              i,
                              "left_load_per_distance",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Right Load/Distance
                        </label>
                        <input
                          type="number"
                          value={(load as VDL).right_load_per_distance}
                          onChange={(e) =>
                            handleUpdateLoad(
                              i,
                              "right_load_per_distance",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">
                          Span Length
                        </label>
                        <input
                          type="number"
                          value={(load as VDL).load_span}
                          onChange={(e) =>
                            handleUpdateLoad(
                              i,
                              "load_span",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Axis
                    </label>
                    <select
                      value={load.axis}
                      onChange={(e) =>
                        handleUpdateLoad(i, "axis", e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="x">X</option>
                      <option value="-x">-X</option>
                      <option value="y">Y</option>
                      <option value="-y">-Y</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      H Dist
                    </label>
                    <input
                      type="number"
                      value={load.horizontal_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateLoad(
                          i,
                          "horizontal_distance_from_left_end_origin",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      V Dist
                    </label>
                    <input
                      type="number"
                      value={load.vertical_distance_from_left_end_origin}
                      onChange={(e) =>
                        handleUpdateLoad(
                          i,
                          "vertical_distance_from_left_end_origin",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <button
                      onClick={() => handleRemoveLoad(i)}
                      className="w-full px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onVisualize({ title, spans, supports, loads })}
          className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          Visualize Frame
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Submit to Backend"}
        </button>
      </div>
    </div>
  );
}

export type { FrameInputProps };

export default FrameInput;
