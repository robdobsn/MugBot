// Infill-related type definitions

export interface InfillParameters {
  enabled: boolean
  minSize: number        // mm - minimum bounding box dimension
  lineSpacing: number    // mm - distance between infill lines
  angle: number          // degrees - 0 = horizontal (around circumference)
}

export interface ClosedShape {
  id: string             // Shape identifier
  pathD: string          // SVG path data
  bounds: BoundingBox    // Calculated bounds
  polygon: Point[]       // Polygon approximation of path
  fill?: boolean         // Whether SVG indicates filled (true) or none/transparent (false)
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface InfillLine {
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface Point {
  x: number
  y: number
}
