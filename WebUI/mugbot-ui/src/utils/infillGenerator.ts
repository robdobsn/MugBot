// Infill pattern generator for closed shapes

import { type InfillParameters, type ClosedShape, type InfillLine, type Point } from '../types/infill'
import { clipLineToPolygon } from './geometryUtils'

/**
 * Generate horizontal raster infill for a closed shape
 * "Horizontal" means around the circumference of the cylindrical mug
 */
export function generateRasterInfill(
  shape: ClosedShape,
  params: InfillParameters
): InfillLine[] {
  const { lineSpacing, angle } = params
  const { bounds, polygon } = shape
  
  // For horizontal infill (around circumference), we generate vertical lines
  // that will wrap around the cylinder
  const angleRad = (angle * Math.PI) / 180
  
  // Calculate the range for line generation
  // We'll generate lines perpendicular to the infill angle
  const { minY, maxY } = bounds
  
  // Generate candidate lines across the bounding box
  const candidateLines: InfillLine[] = []
  
  // Start from minY and step by lineSpacing
  let currentY = minY + lineSpacing / 2
  
  while (currentY <= maxY) {
    // Create a horizontal line across the entire bounding box width
    // We extend beyond bounds to ensure complete coverage
    const extend = Math.max(bounds.width, bounds.height) * 2
    
    const line: InfillLine = {
      start: { x: bounds.minX - extend, y: currentY },
      end: { x: bounds.maxX + extend, y: currentY }
    }
    
    // Rotate line if angle is specified
    if (Math.abs(angleRad) > 0.001) {
      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2
      
      const rotatedLine = rotateLineAroundPoint(line, angleRad, { x: centerX, y: centerY })
      candidateLines.push(rotatedLine)
    } else {
      candidateLines.push(line)
    }
    
    currentY += lineSpacing
  }
  
  // Clip each candidate line to the polygon
  const infillLines: InfillLine[] = []
  
  for (const line of candidateLines) {
    const clippedSegments = clipLineToPolygon(line, polygon)
    infillLines.push(...clippedSegments)
  }
  
  return infillLines
}

/**
 * Rotate a line around a specific point
 */
function rotateLineAroundPoint(line: InfillLine, angleRad: number, center: Point): InfillLine {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  
  const rotatePoint = (p: Point): Point => {
    const dx = p.x - center.x
    const dy = p.y - center.y
    
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    }
  }
  
  return {
    start: rotatePoint(line.start),
    end: rotatePoint(line.end)
  }
}

/**
 * Generate gyroid infill pattern (placeholder for future implementation)
 * Gyroid patterns create a triply periodic minimal surface
 */
export function generateGyroidInfill(
  shape: ClosedShape,
  params: InfillParameters
): InfillLine[] {
  // TODO: Implement gyroid pattern
  // For now, fall back to raster
  console.warn('Gyroid infill not yet implemented, using raster pattern')
  return generateRasterInfill(shape, params)
}

/**
 * Generate honeycomb/hexagonal infill pattern (placeholder for future implementation)
 */
export function generateHoneycombInfill(
  shape: ClosedShape,
  params: InfillParameters
): InfillLine[] {
  // TODO: Implement honeycomb pattern
  console.warn('Honeycomb infill not yet implemented, using raster pattern')
  return generateRasterInfill(shape, params)
}

/**
 * Generate concentric infill pattern (follows shape contours)
 * Useful for cylindrical surfaces
 */
export function generateConcentricInfill(
  shape: ClosedShape,
  params: InfillParameters
): InfillLine[] {
  // TODO: Implement concentric pattern using polygon offsetting
  console.warn('Concentric infill not yet implemented, using raster pattern')
  return generateRasterInfill(shape, params)
}

/**
 * Main infill generation function
 * Routes to specific pattern generators based on parameters
 */
export function generateInfill(
  shape: ClosedShape,
  params: InfillParameters
): InfillLine[] {
  // For now, only raster pattern is implemented
  // Future: Add pattern type to InfillParameters
  return generateRasterInfill(shape, params)
}

/**
 * Generate infill for multiple shapes
 */
export function generateInfillForShapes(
  shapes: ClosedShape[],
  params: InfillParameters
): Map<string, InfillLine[]> {
  const infillMap = new Map<string, InfillLine[]>()
  
  for (const shape of shapes) {
    const lines = generateInfill(shape, params)
    if (lines.length > 0) {
      infillMap.set(shape.id, lines)
    }
  }
  
  return infillMap
}

/**
 * Optimize infill lines by merging collinear segments
 * Reduces GCODE size and printing time
 */
export function optimizeInfillLines(lines: InfillLine[]): InfillLine[] {
  if (lines.length === 0) return lines
  
  const optimized: InfillLine[] = []
  let currentLine = { ...lines[0] }
  
  for (let i = 1; i < lines.length; i++) {
    const nextLine = lines[i]
    
    // Check if lines are collinear and connected
    if (areCollinearAndConnected(currentLine, nextLine)) {
      // Merge by extending current line
      currentLine.end = nextLine.end
    } else {
      // Save current line and start new one
      optimized.push(currentLine)
      currentLine = { ...nextLine }
    }
  }
  
  // Add the last line
  optimized.push(currentLine)
  
  return optimized
}

/**
 * Check if two lines are collinear and connected
 */
function areCollinearAndConnected(line1: InfillLine, line2: InfillLine, tolerance: number = 0.01): boolean {
  // Check if end of line1 is close to start of line2
  const dx = line2.start.x - line1.end.x
  const dy = line2.start.y - line1.end.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance > tolerance) return false
  
  // Check if lines are collinear
  const dx1 = line1.end.x - line1.start.x
  const dy1 = line1.end.y - line1.start.y
  const dx2 = line2.end.x - line2.start.x
  const dy2 = line2.end.y - line2.start.y
  
  // Normalize vectors
  const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
  
  if (len1 < tolerance || len2 < tolerance) return false
  
  const nx1 = dx1 / len1
  const ny1 = dy1 / len1
  const nx2 = dx2 / len2
  const ny2 = dy2 / len2
  
  // Check if normalized vectors are parallel (dot product close to ±1)
  const dotProduct = nx1 * nx2 + ny1 * ny2
  
  return Math.abs(Math.abs(dotProduct) - 1.0) < tolerance
}

/**
 * Calculate total infill line length
 */
export function calculateInfillLength(lines: InfillLine[]): number {
  let totalLength = 0
  
  for (const line of lines) {
    const dx = line.end.x - line.start.x
    const dy = line.end.y - line.start.y
    totalLength += Math.sqrt(dx * dx + dy * dy)
  }
  
  return totalLength
}

/**
 * Calculate estimated print time for infill
 */
export function estimateInfillPrintTime(
  lines: InfillLine[],
  printSpeed: number = 60 // mm/s
): number {
  const length = calculateInfillLength(lines)
  return length / printSpeed // seconds
}
