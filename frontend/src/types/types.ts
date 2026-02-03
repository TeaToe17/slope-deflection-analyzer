export interface Span {
  length: number;
  ei: number;
  axis: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
}

export interface Support {
  name: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
  deflection: number;
}

export interface PointLoad {
  name: "point_load";
  point_load_magnitude: number;
  axis: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
}

export interface UDL {
  name: "udl";
  load_per_distance: number;
  load_span: number;
  axis: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
}

export interface VDL {
  name: "vdl";
  left_load_per_distance: number;
  right_load_per_distance: number;
  load_span: number;
  axis: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
}

export type Load = PointLoad | UDL | VDL;

export interface SpanResults {
  fem_left: number;
  fem_right: number;
  moment_left_eqn: string;
  moment_right_eqn: string;
  moment_left: number;
  moment_right: number;
  shear_left: number;
  shear_right: number;
  length: number;
  axis: string;
  horizontal_distance_from_left_end_origin: number;
  vertical_distance_from_left_end_origin: number;
  ei: number;
  loads_on_span: Load[];
}

export interface SupportResults {
  id: number;
  reaction_vertical: number;
  reaction_horizontal: number;
  reaction_moment: number;
  deflection: number;
}

export interface AnalysisResults {
  status: string;
  spans: Record<string, SpanResults>;
  supports: Record<string, SupportResults>;
}

export interface FrameData {
  title: string;
  spans: Span[];
  supports: Support[];
  loads: Load[];
}

export interface AnalysisResponse extends FrameData {
  id: number;
  analysis_results?: AnalysisResults;
}


