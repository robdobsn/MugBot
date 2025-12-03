import { useRef, type ChangeEvent } from 'react'

interface FileUploaderProps {
  onFileLoad: (data: string, paths: any[]) => void
}

function FileUploader({ onFileLoad }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseSvgPaths = (svgContent: string) => {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
    const paths: any[] = []
    
    console.log('Parsing SVG, content length:', svgContent.length)
    
    // Check for parse errors (Inkscape files sometimes have issues)
    const parserError = svgDoc.querySelector('parsererror')
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent)
      return paths
    }
    
    // Use wildcard selectors to find elements regardless of namespace
    console.log('Searching for all SVG elements...')

    // Extract path elements (with and without namespace)
    const pathElements = svgDoc.querySelectorAll('path, [id*="path"]')
    console.log('Found path elements:', pathElements.length)
    
    if (pathElements.length === 0) {
      console.warn('No path elements found in SVG')
      return paths
    }
    pathElements.forEach((path, index) => {
      const d = path.getAttribute('d')
      console.log(`Path ${index} d:`, d ? d.substring(0, 100) + '...' : 'none')
      if (d) {
        // Get stroke/fill from style or direct attributes or parent element
        const style = path.getAttribute('style')
        let stroke = path.getAttribute('stroke') || 'none'
        let fill = path.getAttribute('fill') || 'none'
        let strokeWidth = parseFloat(path.getAttribute('stroke-width') || '1')
        
        // Check parent g element for inherited styles
        let parent = path.parentElement
        while (parent && parent.tagName !== 'svg') {
          const parentStyle = parent.getAttribute('style')
          if (parentStyle) {
            if (fill === 'none') {
              const fillMatch = parentStyle.match(/fill:\s*([^;]+)/)
              if (fillMatch) fill = fillMatch[1].trim()
            }
            if (stroke === 'none') {
              const strokeMatch = parentStyle.match(/stroke:\s*([^;]+)/)
              if (strokeMatch) stroke = strokeMatch[1].trim()
            }
          }
          if (fill === 'none' && parent.getAttribute('fill')) fill = parent.getAttribute('fill')!
          if (stroke === 'none' && parent.getAttribute('stroke')) stroke = parent.getAttribute('stroke')!
          parent = parent.parentElement
        }
        
        if (style) {
          const strokeMatch = style.match(/stroke:\s*([^;]+)/)
          const fillMatch = style.match(/fill:\s*([^;]+)/)
          const strokeWidthMatch = style.match(/stroke-width:\s*([^;]+)/)
          if (strokeMatch) stroke = strokeMatch[1].trim()
          if (fillMatch) fill = fillMatch[1].trim()
          if (strokeWidthMatch) strokeWidth = parseFloat(strokeWidthMatch[1])
        }
        
        // If path has fill, treat it as a stroke for drawing purposes
        if (fill !== 'none' && stroke === 'none') {
          stroke = fill
        }
        
        console.log(`Path ${index} - stroke: ${stroke}, fill: ${fill}, strokeWidth: ${strokeWidth}`)
        
        paths.push({
          d,
          fill: 'none', // Always use none for fill, only stroke outlines
          stroke: stroke === 'none' ? 'black' : stroke,
          strokeWidth: strokeWidth || 1
        })
      }
    })

    // Extract line elements
    const lineElements = svgDoc.querySelectorAll('line')
    console.log('Found line elements:', lineElements.length)
    lineElements.forEach((line) => {
      const x1 = line.getAttribute('x1')
      const y1 = line.getAttribute('y1')
      const x2 = line.getAttribute('x2')
      const y2 = line.getAttribute('y2')
      console.log('Line:', { x1, y1, x2, y2 })
      if (x1 && y1 && x2 && y2) {
        paths.push({
          d: `M ${x1} ${y1} L ${x2} ${y2}`,
          stroke: line.getAttribute('stroke') || 'black',
          strokeWidth: parseFloat(line.getAttribute('stroke-width') || '1')
        })
      }
    })

    // Extract polyline elements
    const polylineElements = svgDoc.querySelectorAll('polyline, polygon')
    polylineElements.forEach((polyline) => {
      const points = polyline.getAttribute('points')
      if (points) {
        // Handle both space-separated and comma-separated formats
        const pointsArray = points.trim().split(/[\s,]+/)
        let d = ''
        for (let i = 0; i < pointsArray.length; i += 2) {
          if (pointsArray[i] && pointsArray[i + 1]) {
            d += `${i === 0 ? 'M' : 'L'} ${pointsArray[i]} ${pointsArray[i + 1]} `
          }
        }
        if (polyline.tagName === 'polygon') {
          d += 'Z'
        }
        paths.push({
          d,
          stroke: polyline.getAttribute('stroke') || 'black',
          strokeWidth: parseFloat(polyline.getAttribute('stroke-width') || '1')
        })
      }
    })

    // Extract circle elements
    const circleElements = svgDoc.querySelectorAll('circle')
    console.log('Found circle elements:', circleElements.length)
    circleElements.forEach((circle) => {
      const cx = parseFloat(circle.getAttribute('cx') || '0')
      const cy = parseFloat(circle.getAttribute('cy') || '0')
      const r = parseFloat(circle.getAttribute('r') || '0')
      
      // Convert circle to path
      const d = `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
      paths.push({
        d,
        stroke: circle.getAttribute('stroke') || 'black',
        strokeWidth: parseFloat(circle.getAttribute('stroke-width') || '1')
      })
    })

    // Extract rect elements (important for Inkscape files!)
    const rectElements = svgDoc.querySelectorAll('rect')
    console.log('Found rect elements:', rectElements.length)
    rectElements.forEach((rect, index) => {
      const x = parseFloat(rect.getAttribute('x') || '0')
      const y = parseFloat(rect.getAttribute('y') || '0')
      const width = parseFloat(rect.getAttribute('width') || '0')
      const height = parseFloat(rect.getAttribute('height') || '0')
      const ry = parseFloat(rect.getAttribute('ry') || '0')
      
      console.log(`Rect ${index}:`, { x, y, width, height, ry })
      
      // Convert rect to path (ignore rounded corners for now, treat as sharp corners)
      const d = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`
      
      // Get stroke from style attribute if present (Inkscape style)
      const style = rect.getAttribute('style')
      let stroke = rect.getAttribute('stroke') || 'black'
      let strokeWidth = parseFloat(rect.getAttribute('stroke-width') || '1')
      
      if (style) {
        const strokeMatch = style.match(/stroke:\s*([^;]+)/)
        const strokeWidthMatch = style.match(/stroke-width:\s*([^;]+)/)
        if (strokeMatch) stroke = strokeMatch[1].trim()
        if (strokeWidthMatch) strokeWidth = parseFloat(strokeWidthMatch[1])
      }
      
      console.log(`Rect ${index} converted to path:`, d)
      paths.push({
        d,
        stroke,
        fill: 'none', // We only draw outlines
        strokeWidth
      })
    })

    console.log('Total paths extracted:', paths.length)
    console.log('Paths summary:', paths.map((p, i) => ({
      index: i,
      dLength: p.d.length,
      stroke: p.stroke,
      strokeWidth: p.strokeWidth
    })))
    return paths
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        const paths = parseSvgPaths(content)
        console.log('Parsed SVG paths:', paths)
        console.log('Total paths found:', paths.length)
        onFileLoad(content, paths)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,.dxf"
        onChange={handleFileChange}
        className="form-control"
      />
      <small className="form-text text-muted mt-2 d-block">
        Supported formats: SVG (DXF support coming soon)
      </small>
    </div>
  )
}

export default FileUploader
