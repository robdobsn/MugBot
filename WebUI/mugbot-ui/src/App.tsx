import { useState } from 'react'
import './App.css'
import FileUploader from './components/FileUploader'
import MugVisualization from './components/MugVisualization'
import ParameterControls from './components/ParameterControls'
import GCodeGenerator from './components/GCodeGenerator'

export interface MugParameters {
  xRange: number // 0-280 (rotation around mug)
  yRange: number // 0-80 (height up the mug)
  extrusionRate: number
  duetIp: string
  xOffset: number // X offset in mm
  yOffset: number // Y offset in mm
}

function App() {
  const [svgData, setSvgData] = useState<string | null>(null)
  const [svgPaths, setSvgPaths] = useState<any[]>([])
  const [viewBox, setViewBox] = useState<{ width: number, height: number } | undefined>()
  const [parameters, setParameters] = useState<MugParameters>({
    xRange: 280,
    yRange: 80,
    extrusionRate: 1.0,
    duetIp: '192.168.1.100',
    xOffset: 0,
    yOffset: 0
  })

  const handleSvgLoad = (data: string, paths: any[], viewBoxData?: { width: number, height: number }) => {
    console.log('App: SVG loaded with', paths.length, 'paths')
    console.log('App: ViewBox:', viewBoxData)
    setSvgData(data)
    setSvgPaths(paths)
    setViewBox(viewBoxData)
  }

  return (
    <div className="app-container">
      <header className="bg-primary text-white p-3 mb-4">
        <div className="container">
          <h1 className="h3 mb-0">MugBot GCODE Generator</h1>
          <p className="mb-0 small">Convert vector graphics to GCODE for cylindrical printing</p>
        </div>
      </header>

      <div className="container-fluid">
        <div className="row">
          {/* Left Panel - Controls */}
          <div className="col-lg-4 mb-4">
            <div className="card mb-3">
              <div className="card-header">
                <h5 className="mb-0">1. Load Vector File</h5>
              </div>
              <div className="card-body">
                <FileUploader onFileLoad={handleSvgLoad} />
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header">
                <h5 className="mb-0">2. Configure Parameters</h5>
              </div>
              <div className="card-body">
                <ParameterControls 
                  parameters={parameters}
                  onChange={setParameters}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">3. Generate & Send GCODE</h5>
              </div>
              <div className="card-body">
                <GCodeGenerator 
                  svgPaths={svgPaths}
                  parameters={parameters}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - 3D Visualization */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Mug Preview</h5>
              </div>
              <div className="card-body p-0">
                <MugVisualization 
                  svgPaths={svgPaths}
                  parameters={parameters}
                  viewBox={viewBox}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
