/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModelAnalysis {
  watertight: boolean;
  minThickness: string;
  fragileAreasCount: number;
  openBoundaries: number;
  supportsNeeded: boolean;
  estimatedHours: number;
  material: string;
  polygons: number;
  vertices: number;
  dimensions: {
    x: number; // Width in mm
    y: number; // Height in mm
    z: number; // Depth in mm
  };
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  imagesCount: number;
  status: "idle" | "processing" | "completed" | "failed";
  meshType: "vase" | "mug" | "rocket" | "creative_fox" | "gear";
  geometryStyle: "organic" | "cylindrical" | "boxy" | "smooth" | "mechanical";
  modelColor: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  smoothing: number; // 0 to 3
  detailsLevel: number; // 0 to 100
  analysis: ModelAnalysis;
  summary?: string;
  modelUrl?: string; // Real 3D model path (e.g. GLB or OBJ)
}

export interface CaptureGuideStep {
  title: string;
  description: string;
  badge: string;
  icon: string;
  imageAlt: string;
}
