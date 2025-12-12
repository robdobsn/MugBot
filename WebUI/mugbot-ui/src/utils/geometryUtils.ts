// Geometry utility functions for infill generation

import { type BoundingBox, type Point, type InfillLine } from '../types/infill'

/**
 * Parse an SVG path and calculate its bounding box
 */
export function parsePathToBounds(pathD: string): BoundingBox {
  const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
  
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  
  let currentX = 0
  let currentY = 0
  
  commands.forEach(cmd => {
    const type = cmd[0]
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
    
    switch (type.toUpperCase()) {
      case 'M':
      case 'L':
        for (let i = 0; i < coords.length; i += 2) {
          const x = type === type.toUpperCase() ? coords[i] : currentX + coords[i]
          const y = type === type.toUpperCase() ? coords[i + 1] : currentY + coords[i + 1]
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
          currentX = x
          currentY = y
        }
        break
      
      case 'H':
        for (let i = 0; i < coords.length; i++) {
          const x = type === 'H' ? coords[i] : currentX + coords[i]
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          currentX = x
        }
        break
      
      case 'V':
        for (let i = 0; i < coords.length; i++) {
          const y = type === 'V' ? coords[i] : currentY + coords[i]
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
          currentY = y
        }
        break
      
      case 'C': // Cubic Bezier
        for (let i = 0; i < coords.length; i += 6) {
          const points = type === 'C' 
            ? [coords[i], coords[i+1], coords[i+2], coords[i+3], coords[i+4], coords[i+5]]
            : [currentX + coords[i], currentY + coords[i+1], currentX + coords[i+2], 
               currentY + coords[i+3], currentX + coords[i+4], currentY + coords[i+5]]
          
          minX = Math.min(minX, points[0], points[2], points[4])
          maxX = Math.max(maxX, points[0], points[2], points[4])
          minY = Math.min(minY, points[1], points[3], points[5])
          maxY = Math.max(maxY, points[1], points[3], points[5])
          
          currentX = points[4]
          currentY = points[5]
        }
        break
      
      case 'Q': // Quadratic Bezier
        for (let i = 0; i < coords.length; i += 4) {
          const points = type === 'Q'
            ? [coords[i], coords[i+1], coords[i+2], coords[i+3]]
            : [currentX + coords[i], currentY + coords[i+1], currentX + coords[i+2], currentY + coords[i+3]]
          
          minX = Math.min(minX, points[0], points[2])
          maxX = Math.max(maxX, points[0], points[2])
          minY = Math.min(minY, points[1], points[3])
          maxY = Math.max(maxY, points[1], points[3])
          
          currentX = points[2]
          currentY = points[3]
        }
        break
    }
  })
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Check if an SVG path is closed
 */
export function isPathClosed(pathD: string): boolean {
  // Check for explicit Z command
  if (/[Zz]\s*$/.test(pathD.trim())) {
    return true
  }
  
  // Check if first and last points are close (within tolerance)
  const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
  if (commands.length < 2) return false
  
  const firstPoint = getFirstPoint(pathD)
  const lastPoint = getLastPoint(pathD)
  
  if (!firstPoint || !lastPoint) return false
  
  const distance = Math.sqrt(
    Math.pow(lastPoint.x - firstPoint.x, 2) + 
    Math.pow(lastPoint.y - firstPoint.y, 2)
  )
  
  const tolerance = 0.1 // mm
  return distance < tolerance
}

/**
 * Get the first point in an SVG path
 */
function getFirstPoint(pathD: string): Point | null {
  const firstCmd = pathD.match(/[Mm][^MmLlHhVvCcSsQqTtAaZz]*/)?.[0]
  if (!firstCmd) return null
  
  const coords = firstCmd.slice(1).trim().split(/[\s,]+/).map(parseFloat)
  if (coords.length < 2) return null
  
  return { x: coords[0], y: coords[1] }
}

/**
 * Get the last point in an SVG path
 */
function getLastPoint(pathD: string): Point | null {
  const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
  if (commands.length === 0) return null
  
  let currentX = 0
  let currentY = 0
  
  commands.forEach(cmd => {
    const type = cmd[0]
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
    
    switch (type.toUpperCase()) {
      case 'M':
      case 'L':
        if (coords.length >= 2) {
          currentX = type === type.toUpperCase() ? coords[coords.length - 2] : currentX + coords[coords.length - 2]
          currentY = type === type.toUpperCase() ? coords[coords.length - 1] : currentY + coords[coords.length - 1]
        }
        break
      
      case 'H':
        if (coords.length > 0) {
          currentX = type === 'H' ? coords[coords.length - 1] : currentX + coords[coords.length - 1]
        }
        break
      
      case 'V':
        if (coords.length > 0) {
          currentY = type === 'V' ? coords[coords.length - 1] : currentY + coords[coords.length - 1]
        }
        break
      
      case 'C':
        if (coords.length >= 6) {
          currentX = type === 'C' ? coords[coords.length - 2] : currentX + coords[coords.length - 2]
          currentY = type === 'C' ? coords[coords.length - 1] : currentY + coords[coords.length - 1]
        }
        break
      
      case 'Q':
        if (coords.length >= 4) {
          currentX = type === 'Q' ? coords[coords.length - 2] : currentX + coords[coords.length - 2]
          currentY = type === 'Q' ? coords[coords.length - 1] : currentY + coords[coords.length - 1]
        }
        break
    }
  })
  
  return { x: currentX, y: currentY }
}

/**
 * Point-in-polygon test using ray casting algorithm
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  const x = point.x
  const y = point.y
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Calculate intersection point between two line segments
 */
export function lineSegmentIntersection(
  line1: InfillLine,
  line2: InfillLine
): Point | null {
  const x1 = line1.start.x
  const y1 = line1.start.y
  const x2 = line1.end.x
  const y2 = line1.end.y
  const x3 = line2.start.x
  const y3 = line2.start.y
  const x4 = line2.end.x
  const y4 = line2.end.y
  
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  
  if (Math.abs(denominator) < 1e-10) {
    return null // Lines are parallel
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    }
  }
  
  return null
}

/**
 * Clip a line to polygon boundaries
 */
export function clipLineToPolygon(line: InfillLine, polygon: Point[]): InfillLine[] {
  const intersections: Array<{ point: Point; t: number }> = []
  
  // Find all intersection points with polygon edges
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    const edge: InfillLine = {
      start: polygon[i],
      end: polygon[j]
    }
    
    const intersection = lineSegmentIntersection(line, edge)
    if (intersection) {
      // Calculate parameter t along the line
      const dx = line.end.x - line.start.x
      const dy = line.end.y - line.start.y
      const t = Math.abs(dx) > Math.abs(dy)
        ? (intersection.x - line.start.x) / dx
        : (intersection.y - line.start.y) / dy
      
      intersections.push({ point: intersection, t })
    }
  }
  
  // Sort intersections by parameter t
  intersections.sort((a, b) => a.t - b.t)
  
  // If no intersections, check if entire line is inside
  if (intersections.length === 0) {
    const midpoint = {
      x: (line.start.x + line.end.x) / 2,
      y: (line.start.y + line.end.y) / 2
    }
    
    if (pointInPolygon(midpoint, polygon)) {
      return [line]
    }
    return []
  }
  
  // Build clipped line segments
  const clippedLines: InfillLine[] = []
  
  // Check if line starts inside
  const startInside = pointInPolygon(line.start, polygon)
  
  if (startInside && intersections.length > 0) {
    clippedLines.push({
      start: line.start,
      end: intersections[0].point
    })
  }
  
  // Add segments between pairs of intersections
  for (let i = 0; i < intersections.length - 1; i += 2) {
    if (i + 1 < intersections.length) {
      const midpoint = {
        x: (intersections[i].point.x + intersections[i + 1].point.x) / 2,
        y: (intersections[i].point.y + intersections[i + 1].point.y) / 2
      }
      
      if (pointInPolygon(midpoint, polygon)) {
        clippedLines.push({
          start: intersections[i].point,
          end: intersections[i + 1].point
        })
      }
    }
  }
  
  // Check if line ends inside
  const endInside = pointInPolygon(line.end, polygon)
  
  if (endInside && intersections.length > 0) {
    clippedLines.push({
      start: intersections[intersections.length - 1].point,
      end: line.end
    })
  }
  
  return clippedLines
}

/**
 * Rotate a point around origin
 */
export function rotatePoint(point: Point, angleRadians: number): Point {
  const cos = Math.cos(angleRadians)
  const sin = Math.sin(angleRadians)
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  }
}

/**
 * Rotate a line
 */
export function rotateLine(line: InfillLine, angleRadians: number): InfillLine {
  return {
    start: rotatePoint(line.start, angleRadians),
    end: rotatePoint(line.end, angleRadians)
  }
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}
