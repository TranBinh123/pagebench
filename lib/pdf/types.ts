export type Rotation = 0 | 90 | 180 | 270;

export interface PageRef {
  id: string;
  srcId: string;
  index: number;
  rotation: Rotation;
}

export interface DocModel {
  id: string;
  name: string;
  pages: PageRef[];
}

export interface ExportJob {
  name: string;
  pages: { srcId: string; index: number; rotation: Rotation }[];
}
