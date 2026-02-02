export type Quad = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxModel {
  content: Quad;
  width: number;
  height: number;
}
