import type * as DOM from './dom.js';

export interface LayoutViewport {
  pageX: number;
  pageY: number;
  clientWidth: number;
  clientHeight: number;
}

export interface VisualViewport {
  offsetX: number;
  offsetY: number;
  pageX: number;
  pageY: number;
  clientWidth: number;
  clientHeight: number;
  scale: number;
  zoom?: number;
}

export interface LayoutMetrics {
  cssLayoutViewport: LayoutViewport;
  cssVisualViewport: VisualViewport;
  cssContentSize: DOM.Rect;
}

export interface LifecycleEvent {
  frameId: string;
  loaderId: string;
  name: string;
}

export interface Frame {
  id: string;
  loaderId: string;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}
