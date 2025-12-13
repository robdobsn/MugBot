// Shape analysis utilities for detecting and processing closed shapes

import { type ClosedShape, type Point } from '../types/infill'
import { parsePathToBounds, isPathClosed } from './geometryUtils'

// Simple SVG transform parsing and application to match generator/visualization
function parseTransform(transformStr: string | null): { a: number, b: number, c: number, d: number, e: number, f: number } | null {
  if (!transformStr) return null
  const matrixMatch = transformStr.match(/matrix\(([-\d.,\s]+)\)/)
  if (matrixMatch) {
    const values = matrixMatch[1].split(/[\s,]+/).map(parseFloat)
    if (values.length === 6) {
      return { a: values[0], b: values[1], c: values[2], d: values[3], e: values[4], f: values[5] }
    }
  }
  const translateMatch = transformStr.match(/translate\(([-\d.,\s]+)\)/)
  if (translateMatch) {
    const values = translateMatch[1].split(/[\s,]+/).map(parseFloat)
    const tx = values[0] || 0
    const ty = values[1] || 0
    return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }
  }
  const scaleMatch = transformStr.match(/scale\(([-\d.,\s]+)\)/)
  if (scaleMatch) {
    const values = scaleMatch[1].split(/[\s,]+/).map(parseFloat)
    const sx = values[0] || 1
    const sy = values[1] || sx
    return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
  }
  return null
}

function applyTransform(x: number, y: number, m: { a: number, b: number, c: number, d: number, e: number, f: number }): { x: number, y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

/**
 * Convert SVG path to polygon (array of points)
 * Simplifies Bezier curves to line segments
 */
export function convertPathToPolygon(pathD: string, tolerance: number = 1.0): Point[] {
  const points: Point[] = []
  const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
  
  let currentX = 0
  let currentY = 0
  let startX = 0
  let startY = 0
  
  commands.forEach(cmd => {
    const type = cmd[0]
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
    
    switch (type.toUpperCase()) {
      case 'M': // Move
        if (coords.length >= 2) {
          currentX = type === 'M' ? coords[0] : currentX + coords[0]
          currentY = type === 'M' ? coords[1] : currentY + coords[1]
          startX = currentX
          startY = currentY
          points.push({ x: currentX, y: currentY })
        }
        break
      
      case 'L': // Line
        for (let i = 0; i < coords.length; i += 2) {
          currentX = type === 'L' ? coords[i] : currentX + coords[i]
          currentY = type === 'L' ? coords[i + 1] : currentY + coords[i + 1]
          points.push({ x: currentX, y: currentY })
        }
        break
      
      case 'H': // Horizontal line
        for (let i = 0; i < coords.length; i++) {
          currentX = type === 'H' ? coords[i] : currentX + coords[i]
          points.push({ x: currentX, y: currentY })
        }
        break
      
      case 'V': // Vertical line
        for (let i = 0; i < coords.length; i++) {
          currentY = type === 'V' ? coords[i] : currentY + coords[i]
          points.push({ x: currentX, y: currentY })
        }
        break
      
      case 'C': // Cubic Bezier
        for (let i = 0; i < coords.length; i += 6) {
          const p0 = { x: currentX, y: currentY }
          const p1 = type === 'C' 
            ? { x: coords[i], y: coords[i + 1] }
            : { x: currentX + coords[i], y: currentY + coords[i + 1] }
          const p2 = type === 'C'
            ? { x: coords[i + 2], y: coords[i + 3] }
            : { x: currentX + coords[i + 2], y: currentY + coords[i + 3] }
          const p3 = type === 'C'
            ? { x: coords[i + 4], y: coords[i + 5] }
            : { x: currentX + coords[i + 4], y: currentY + coords[i + 5] }
          
          // Sample cubic Bezier curve
          const samples = bezierSamples(p0, p1, p2, p3, tolerance)
          points.push(...samples.slice(1)) // Skip first point (already added)
          
          currentX = p3.x
          currentY = p3.y
        }
        break
      
      case 'Q': // Quadratic Bezier
        for (let i = 0; i < coords.length; i += 4) {
          const p0 = { x: currentX, y: currentY }
          const p1 = type === 'Q'
            ? { x: coords[i], y: coords[i + 1] }
            : { x: currentX + coords[i], y: currentY + coords[i + 1] }
          const p2 = type === 'Q'
            ? { x: coords[i + 2], y: coords[i + 3] }
            : { x: currentX + coords[i + 2], y: currentY + coords[i + 3] }
          
          // Sample quadratic Bezier curve
          const samples = quadraticBezierSamples(p0, p1, p2, tolerance)
          points.push(...samples.slice(1))
          
          currentX = p2.x
          currentY = p2.y
        }
        break
      
      case 'Z': // Close path
        if (points.length > 0 && (currentX !== startX || currentY !== startY)) {
          // Ensure path is actually closed by adding start point if needed
          points.push({ x: startX, y: startY })
        }
        currentX = startX
        currentY = startY
        break
    }
  })
  
  return points
}

/**
 * Sample a cubic Bezier curve into line segments
 */
function bezierSamples(p0: Point, p1: Point, p2: Point, p3: Point, tolerance: number): Point[] {
  const points: Point[] = [p0]
  
  // Calculate number of samples based on curve length estimate
  const chordLength = Math.sqrt(
    Math.pow(p3.x - p0.x, 2) + Math.pow(p3.y - p0.y, 2)
  )
  const numSamples = Math.max(2, Math.ceil(chordLength / tolerance))
  
  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples
    const mt = 1 - t
    
    const x = mt * mt * mt * p0.x +
              3 * mt * mt * t * p1.x +
              3 * mt * t * t * p2.x +
              t * t * t * p3.x
    
    const y = mt * mt * mt * p0.y +
              3 * mt * mt * t * p1.y +
              3 * mt * t * t * p2.y +
              t * t * t * p3.y
    
    points.push({ x, y })
  }
  
  return points
}

/**
 * Sample a quadratic Bezier curve into line segments
 */
function quadraticBezierSamples(p0: Point, p1: Point, p2: Point, tolerance: number): Point[] {
  const points: Point[] = [p0]
  
  const chordLength = Math.sqrt(
    Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2)
  )
  const numSamples = Math.max(2, Math.ceil(chordLength / tolerance))
  
  for (let i = 1; i <= numSamples; i++) {
    const t = i / numSamples
    const mt = 1 - t
    
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    
    points.push({ x, y })
  }
  
  return points
}

/**
 * Extract all closed shapes from SVG content
 */
export function extractClosedShapes(svgContent: string): ClosedShape[] {
  const shapes: ClosedShape[] = []
  
  // Parse SVG and extract path elements
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')
  const paths = doc.querySelectorAll('path')
  
  paths.forEach((pathElement, index) => {
    const d = pathElement.getAttribute('d')
    const transformStr = pathElement.getAttribute('transform')
    const transform = parseTransform(transformStr)
    // Read fill and fill-opacity from attribute or style
    let fillAttr = pathElement.getAttribute('fill')
    let fillOpacityAttr = pathElement.getAttribute('fill-opacity')
    const styleAttr = pathElement.getAttribute('style')
    if (styleAttr) {
      // Prefer style fill/opacity when attribute is missing or explicitly 'none'
      const attrIsNone = (fillAttr || '').trim().toLowerCase() === 'none'
      if (!fillAttr || attrIsNone) {
        const m = styleAttr.match(/fill\s*:\s*([^;]+)/)
        if (m) fillAttr = m[1]
      }
      if (!fillOpacityAttr) {
        const mo = styleAttr.match(/fill-opacity\s*:\s*([^;]+)/)
        if (mo) fillOpacityAttr = mo[1]
      }
    }
    const fillOpacity = fillOpacityAttr ? parseFloat(fillOpacityAttr) : undefined
    const isTransparent = typeof fillOpacity === 'number' && fillOpacity <= 0.01
    const normalizedFill = (fillAttr || '').trim().toLowerCase()
    const isNone = normalizedFill === 'none'
    const isWhite = normalizedFill === '#fff' || normalizedFill === '#ffffff' || normalizedFill === 'white' || normalizedFill.startsWith('rgb(') && (() => {
      const m = normalizedFill.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
      if (!m) return false
      const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10)
      const tol = 250
      return r >= tol && g >= tol && b >= tol
    })()
    if (!d) return
    
    // Check if path is closed
    if (isPathClosed(d)) {
      const bounds = parsePathToBounds(d)
      let polygon = convertPathToPolygon(d)
      if (transform) {
        polygon = polygon.map(p => applyTransform(p.x, p.y, transform))
      }
      // Recompute bounds if transformed
      const xs = polygon.map(p => p.x)
      const ys = polygon.map(p => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      
      const shape: ClosedShape = {
        id: `shape-${index}`,
        pathD: d,
        bounds: {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX,
          height: maxY - minY
        },
        polygon,
        // fill flag: true for non-white visible fill, false for white visible fill (hole), undefined for none/transparent
        fill: isNone || isTransparent ? undefined : (!isWhite)
      }
      console.log('[Shapes] Extracted path', {
        id: shape.id,
        fillAttr,
        fillOpacity,
        normalizedFill,
        isWhite,
        isNone,
        isTransparent,
        classifiedFill: shape.fill
      })
      shapes.push(shape)
    }
  })
  
  // Also check for basic shapes (rect, circle, ellipse, polygon)
  extractBasicShapes(doc, shapes)
  
  return shapes
}

/**
 * Extract basic SVG shapes (rect, circle, ellipse, polygon) as closed shapes
 */
function extractBasicShapes(doc: Document, shapes: ClosedShape[]): void {
  // Rectangles
  doc.querySelectorAll('rect').forEach((rect, index) => {
    const x = parseFloat(rect.getAttribute('x') || '0')
    const y = parseFloat(rect.getAttribute('y') || '0')
    const width = parseFloat(rect.getAttribute('width') || '0')
    const height = parseFloat(rect.getAttribute('height') || '0')
    
    if (width > 0 && height > 0) {
      const polygon: Point[] = [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
        { x, y } // Close
      ]
      
      shapes.push({
        id: `rect-${index}`,
        pathD: `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`,
        bounds: {
          minX: x,
          minY: y,
          maxX: x + width,
          maxY: y + height,
          width,
          height
        },
        polygon
      })
    }
  })
  
  // Circles
  doc.querySelectorAll('circle').forEach((circle, index) => {
    const cx = parseFloat(circle.getAttribute('cx') || '0')
    const cy = parseFloat(circle.getAttribute('cy') || '0')
    const r = parseFloat(circle.getAttribute('r') || '0')
    
    if (r > 0) {
      const segments = Math.max(16, Math.ceil(2 * Math.PI * r / 2)) // 2mm segment length
      const polygon: Point[] = []
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI
        polygon.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle)
        })
      }
      
      shapes.push({
        id: `circle-${index}`,
        pathD: `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy - 0.001} Z`,
        bounds: {
          minX: cx - r,
          minY: cy - r,
          maxX: cx + r,
          maxY: cy + r,
          width: 2 * r,
          height: 2 * r
        },
        polygon
      })
    }
  })
  
  // Ellipses
  doc.querySelectorAll('ellipse').forEach((ellipse, index) => {
    const cx = parseFloat(ellipse.getAttribute('cx') || '0')
    const cy = parseFloat(ellipse.getAttribute('cy') || '0')
    const rx = parseFloat(ellipse.getAttribute('rx') || '0')
    const ry = parseFloat(ellipse.getAttribute('ry') || '0')
    
    if (rx > 0 && ry > 0) {
      const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
      const segments = Math.max(16, Math.ceil(perimeter / 2))
      const polygon: Point[] = []
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI
        polygon.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle)
        })
      }
      
      shapes.push({
        id: `ellipse-${index}`,
        pathD: `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy - 0.001} Z`,
        bounds: {
          minX: cx - rx,
          minY: cy - ry,
          maxX: cx + rx,
          maxY: cy + ry,
          width: 2 * rx,
          height: 2 * ry
        },
        polygon
      })
    }
  })
  
  // Polygons
  doc.querySelectorAll('polygon').forEach((poly, index) => {
    const points = poly.getAttribute('points')
    if (!points) return
    
    const coords = points.trim().split(/[\s,]+/).map(parseFloat)
    const polygon: Point[] = []
    
    for (let i = 0; i < coords.length; i += 2) {
      if (i + 1 < coords.length) {
        polygon.push({ x: coords[i], y: coords[i + 1] })
      }
    }
    
    if (polygon.length >= 3) {
      // Close polygon
      polygon.push({ ...polygon[0] })
      
      const xs = polygon.map(p => p.x)
      const ys = polygon.map(p => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      
      const pathD = 'M ' + polygon.map((p, i) => 
        (i === 0 ? '' : 'L ') + `${p.x} ${p.y}`
      ).join(' ') + ' Z'
      
      shapes.push({
        id: `polygon-${index}`,
        pathD,
        bounds: {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX,
          height: maxY - minY
        },
        polygon
      })
    }
  })
}

/**
 * Filter shapes by minimum size
 */
export function filterShapesBySize(shapes: ClosedShape[], minSize: number): ClosedShape[] {
  return shapes.filter(shape => {
    const { width, height } = shape.bounds
    return width >= minSize && height >= minSize
  })
}

/**
 * Sort shapes by area (largest first)
 */
export function sortShapesByArea(shapes: ClosedShape[]): ClosedShape[] {
  return [...shapes].sort((a, b) => {
    const areaA = a.bounds.width * a.bounds.height
    const areaB = b.bounds.width * b.bounds.height
    return areaB - areaA
  })
}
