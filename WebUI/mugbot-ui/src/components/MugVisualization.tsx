import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { type MugParameters } from '../App'

interface MugVisualizationProps {
  svgPaths: any[]
  parameters: MugParameters
}

interface MugMeshProps {
  svgPaths: any[]
  parameters: MugParameters
}

function MugMesh({ svgPaths, parameters }: MugMeshProps) {
  const mugRef = useRef<THREE.Mesh>(null)
  const pathsRef = useRef<THREE.Group>(null)
  const handleRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (mugRef.current) {
      mugRef.current.rotation.y += 0.002
    }
    if (pathsRef.current) {
      pathsRef.current.rotation.y += 0.002
    }
    if (handleRef.current) {
      handleRef.current.rotation.y += 0.002
    }
  })

  // Create mug geometry
  const mugRadius = 30
  const mugHeight = parameters.yRange

  // Convert SVG paths to 3D lines on the cylinder surface
  const createPathGeometry = () => {
    if (svgPaths.length === 0) {
      console.log('No SVG paths to render')
      return null
    }

    console.log('Creating path geometry for', svgPaths.length, 'paths')
    const group = new THREE.Group()

    svgPaths.forEach((pathData, index) => {
      console.log(`Processing path ${index}:`, pathData.d)
      const points = parseSvgPath(pathData.d, parameters)
      console.log(`Path ${index} generated ${points.length} 3D points`)
      
      if (points.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ 
          color: 0xff0000,
          linewidth: 2
        })
        const line = new THREE.Line(geometry, material)
        group.add(line)
        console.log(`Added line ${index} to group`)
      }
    })

    console.log('Total lines in group:', group.children.length)
    return group
  }

  const parseSvgPath = (pathD: string, params: MugParameters): THREE.Vector3[] => {
    const points: THREE.Vector3[] = []
    const commands = pathD.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []
    
    let currentX = 0
    let currentY = 0
    let startX = 0
    let startY = 0

    // Find SVG bounds for normalization
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    commands.forEach(cmd => {
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))
      
      for (let i = 0; i < coords.length; i += 2) {
        if (coords[i] !== undefined) minX = Math.min(minX, coords[i])
        if (coords[i] !== undefined) maxX = Math.max(maxX, coords[i])
        if (coords[i + 1] !== undefined) minY = Math.min(minY, coords[i + 1])
        if (coords[i + 1] !== undefined) maxY = Math.max(maxY, coords[i + 1])
      }
    })

    const svgWidth = maxX - minX || 1
    const svgHeight = maxY - minY || 1
    
    console.log('SVG bounds:', { minX, maxX, minY, maxY, svgWidth, svgHeight })

    commands.forEach(cmd => {
      const type = cmd[0]
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n))

      switch (type.toUpperCase()) {
        case 'M': // Move to
          if (coords.length >= 2) {
            currentX = type === 'M' ? coords[0] : currentX + coords[0]
            currentY = type === 'M' ? coords[1] : currentY + coords[1]
            startX = currentX
            startY = currentY
            // Add the starting point
            points.push(convertToMugSurface(currentX, currentY, minX, minY, svgWidth, svgHeight, mugRadius, params))
          }
          break

        case 'L': // Line to
          for (let i = 0; i < coords.length; i += 2) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined) {
              const newX = type === 'L' ? coords[i] : currentX + coords[i]
              const newY = type === 'L' ? coords[i + 1] : currentY + coords[i + 1]
              
              // Add intermediate points for smooth wrapping
              const steps = 10
              for (let step = 0; step <= steps; step++) {
                const t = step / steps
                const x = currentX + (newX - currentX) * t
                const y = currentY + (newY - currentY) * t
                points.push(convertToMugSurface(x, y, minX, minY, svgWidth, svgHeight, mugRadius, params))
              }
              
              currentX = newX
              currentY = newY
            }
          }
          break

        case 'H': // Horizontal line
          for (let i = 0; i < coords.length; i++) {
            if (coords[i] !== undefined) {
              const newX = type === 'H' ? coords[i] : currentX + coords[i]
              const steps = 10
              for (let step = 0; step <= steps; step++) {
                const t = step / steps
                const x = currentX + (newX - currentX) * t
                points.push(convertToMugSurface(x, currentY, minX, minY, svgWidth, svgHeight, mugRadius, params))
              }
              currentX = newX
            }
          }
          break

        case 'V': // Vertical line
          for (let i = 0; i < coords.length; i++) {
            if (coords[i] !== undefined) {
              const newY = type === 'V' ? coords[i] : currentY + coords[i]
              const steps = 10
              for (let step = 0; step <= steps; step++) {
                const t = step / steps
                const y = currentY + (newY - currentY) * t
                points.push(convertToMugSurface(currentX, y, minX, minY, svgWidth, svgHeight, mugRadius, params))
              }
              currentY = newY
            }
          }
          break

        case 'Q': // Quadratic Bezier curve
          for (let i = 0; i < coords.length; i += 4) {
            if (coords[i] !== undefined && coords[i + 1] !== undefined && 
                coords[i + 2] !== undefined && coords[i + 3] !== undefined) {
              const cpX = type === 'Q' ? coords[i] : currentX + coords[i]
              const cpY = type === 'Q' ? coords[i + 1] : currentY + coords[i + 1]
              const newX = type === 'Q' ? coords[i + 2] : currentX + coords[i + 2]
              const newY = type === 'Q' ? coords[i + 3] : currentY + coords[i + 3]
              
              // Approximate quadratic bezier with line segments
              const steps = 10
              for (let step = 0; step <= steps; step++) {
                const t = step / steps
                const x = (1 - t) * (1 - t) * currentX + 2 * (1 - t) * t * cpX + t * t * newX
                const y = (1 - t) * (1 - t) * currentY + 2 * (1 - t) * t * cpY + t * t * newY
                points.push(convertToMugSurface(x, y, minX, minY, svgWidth, svgHeight, mugRadius, params))
              }
              
              currentX = newX
              currentY = newY
            }
          }
          break

        case 'Z': // Close path
          if (startX !== currentX || startY !== currentY) {
            const steps = 10
            for (let step = 0; step <= steps; step++) {
              const t = step / steps
              const x = currentX + (startX - currentX) * t
              const y = currentY + (startY - currentY) * t
              points.push(convertToMugSurface(x, y, minX, minY, svgWidth, svgHeight, mugRadius, params))
            }
          }
          currentX = startX
          currentY = startY
          break
      }
    })

    return points
  }

  const convertToMugSurface = (
    svgX: number,
    svgY: number,
    minX: number,
    minY: number,
    svgWidth: number,
    svgHeight: number,
    radius: number,
    params: MugParameters
  ): THREE.Vector3 => {
    // Convert SVG coordinates from their origin (minX, minY) to mm from origin
    // SVG units are assumed to be in mm
    // Invert X for left-to-right rendering (negate to flip horizontally)
    const xInMm = (svgWidth - (svgX - minX)) + params.xOffset
    // Flip Y coordinate (SVG Y increases downward, mug Y increases upward)
    const yInMm = (svgHeight - (svgY - minY)) + params.yOffset

    // Map to mug dimensions using actual mm values
    // X wraps around the cylinder (xRange is the usable circumference in mm)
    // Calculate angle as a fraction of the full circumference (2π radians)
    const angle = (xInMm / params.xRange) * Math.PI * 2
    // Y is vertical height (yRange is the height in mm), centered
    const height = (yInMm / params.yRange) * params.yRange - params.yRange / 2

    // Convert to 3D cylindrical coordinates
    const x = radius * Math.cos(angle)
    const y = height
    const z = radius * Math.sin(angle)

    return new THREE.Vector3(x, y, z)
  }

  const pathGroup = useMemo(() => createPathGeometry(), [svgPaths, parameters])

  // Update the pathsRef when pathGroup changes
  useEffect(() => {
    if (pathsRef.current && pathGroup) {
      console.log('Updating pathsRef with new geometry')
    }
  }, [pathGroup])

  // Create handle on the side of the mug at X=-20mm (rotation position)
  const handleGroup = useMemo(() => {
    const group = new THREE.Group()
    const handleWidth = 15 // 15mm wide (how far it extends from mug radially) - CONSTANT
    const handleMargin = 10 // 10mm margin from top and bottom of mug
    const handleHeight = mugHeight - (2 * handleMargin) // Height spans from 10mm from bottom to 10mm from top
    const handleThickness = 3 // 3mm tube thickness
    const handleXPosition = -20 // -20mm in the X coordinate system (rotation around mug)
    
    // Calculate the angle for X=-20mm around the circumference
    const angle = (handleXPosition / parameters.xRange) * 2 * Math.PI
    
    // Create handle as a vertical torus (semicircle)
    // The torus by default is in the XY plane - we need it in a radial-vertical plane
    const torusGeometry = new THREE.TorusGeometry(
      handleWidth / 2,  // major radius - CONSTANT, determines how far it sticks out
      handleThickness / 2,  // minor radius (tube thickness)
      16,  // tubular segments
      32,  // radial segments
      Math.PI  // arc length (semicircle)
    )
    
    const handleMaterial = new THREE.MeshStandardMaterial({ 
      color: "#cccccc",
      transparent: false,
      opacity: 1
    })
    
    const torus = new THREE.Mesh(torusGeometry, handleMaterial)
    
    // The torus starts in XY plane (horizontal circle)
    // After rotation around Z by 90°, X becomes -Y and Y becomes X
    // So to stretch it vertically (final Z direction), we need to scale X initially
    
    // Step 1: Scale first - scale in X which will become the vertical after rotation
    torus.scale.set(handleHeight / handleWidth, 1, 1)
    
    // Step 2: Rotate 90° around Z to orient the semicircle vertically
    torus.rotation.z = Math.PI / 2
    
    // Step 3: Flip it 180° around Y so it curves outward instead of inward
    torus.rotation.y = Math.PI
    
    // Step 4: Move the torus forward (in local X) so it's at the mug surface
    // Also shift it vertically so the top is 10mm from top of mug and bottom is 10mm from bottom
    // The handle center should be at Y=0, so we don't need vertical offset since mug is centered at Y=0
    torus.position.set(mugRadius, 0, 0)
    
    // Step 5: Create a group and rotate it around Y axis (vertical) to the correct angular position
    // The handle will be in a vertical plane passing through the mug center
    const handleWithRotation = new THREE.Group()
    handleWithRotation.add(torus)
    handleWithRotation.rotation.y = angle
    
    // The mug is centered at Y=0, so top is at +mugHeight/2 and bottom is at -mugHeight/2
    // We want the handle to span from (bottom + 10mm) to (top - 10mm)
    // The handle center should be at Y=0 (mug center) which is already correct
    // No vertical adjustment needed since handle and mug are both centered at Y=0
    
    group.add(handleWithRotation)
    return group
  }, [mugRadius, parameters.xRange, mugHeight])

  return (
    <>
      {/* Mug cylinder */}
      <mesh ref={mugRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[mugRadius, mugRadius, mugHeight, 32, 1, true]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Mug handle */}
      <primitive object={handleGroup} ref={handleRef} />

      {/* SVG paths wrapped on cylinder */}
      {pathGroup && (
        <primitive object={pathGroup} ref={pathsRef} />
      )}

      {/* Grid helper */}
      <gridHelper args={[100, 10]} position={[0, -mugHeight / 2 - 1, 0]} />
    </>
  )
}

function MugVisualization({ svgPaths, parameters }: MugVisualizationProps) {
  return (
    <div style={{ width: '100%', height: '800px', background: '#f0f0f0' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[120, 0, 0]} fov={50} />
        <OrbitControls enableDamping dampingFactor={0.05} target={[0, 0, 0]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <MugMesh svgPaths={svgPaths} parameters={parameters} />
      </Canvas>
      
      {svgPaths.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666',
          pointerEvents: 'none'
        }}>
          <p className="mb-0">Load an SVG file to preview</p>
        </div>
      )}
    </div>
  )
}

export default MugVisualization
