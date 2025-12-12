import { type MugParameters } from '../App'
import { type InfillParameters } from '../types/infill'

interface ParameterControlsProps {
  parameters: MugParameters
  onChange: (params: MugParameters) => void
}

function ParameterControls({ parameters, onChange }: ParameterControlsProps) {
  const handleChange = (field: keyof MugParameters, value: number | string) => {
    onChange({
      ...parameters,
      [field]: value
    })
  }

  const handleInfillChange = (field: keyof InfillParameters, value: number | boolean) => {
    onChange({
      ...parameters,
      infill: {
        ...parameters.infill,
        [field]: value
      }
    })
  }

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">
          X Range (Rotation): {parameters.xRange}mm
        </label>
        <input
          type="range"
          className="form-range"
          min="50"
          max="400"
          step="10"
          value={parameters.xRange}
          onChange={(e) => handleChange('xRange', parseFloat(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <small className="text-muted">50mm</small>
          <small className="text-muted">400mm</small>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Y Range (Height): {parameters.yRange}mm
        </label>
        <input
          type="range"
          className="form-range"
          min="20"
          max="150"
          step="5"
          value={parameters.yRange}
          onChange={(e) => handleChange('yRange', parseFloat(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <small className="text-muted">20mm</small>
          <small className="text-muted">150mm</small>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Extrusion Rate: {parameters.extrusionRate.toFixed(2)}
        </label>
        <input
          type="range"
          className="form-range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={parameters.extrusionRate}
          onChange={(e) => handleChange('extrusionRate', parseFloat(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <small className="text-muted">0.1x</small>
          <small className="text-muted">3.0x</small>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">
          X Offset: {parameters.xOffset}mm
        </label>
        <input
          type="range"
          className="form-range"
          min="0"
          max={parameters.xRange}
          step="1"
          value={parameters.xOffset}
          onChange={(e) => handleChange('xOffset', parseFloat(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <small className="text-muted">0mm</small>
          <small className="text-muted">{parameters.xRange}mm</small>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">
          Y Offset: {parameters.yOffset}mm
        </label>
        <input
          type="range"
          className="form-range"
          min="0"
          max={parameters.yRange}
          step="1"
          value={parameters.yOffset}
          onChange={(e) => handleChange('yOffset', parseFloat(e.target.value))}
        />
        <div className="d-flex justify-content-between">
          <small className="text-muted">0mm</small>
          <small className="text-muted">{parameters.yRange}mm</small>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="duetIp" className="form-label">
          Duet 2 IP Address
        </label>
        <input
          type="text"
          className="form-control"
          id="duetIp"
          value={parameters.duetIp}
          onChange={(e) => handleChange('duetIp', e.target.value)}
          placeholder="192.168.1.100"
        />
        <small className="form-text text-muted">
          Enter the IP address of your Duet 2 controller
        </small>
      </div>

      <hr className="my-4" />

      <h5 className="mb-3">Infill Settings</h5>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="infillEnabled"
          checked={parameters.infill.enabled}
          onChange={(e) => handleInfillChange('enabled', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="infillEnabled">
          Enable Infill
        </label>
        <small className="form-text text-muted d-block">
          Fill closed shapes with horizontal lines (around circumference)
        </small>
      </div>

      {parameters.infill.enabled && (
        <>
          <div className="mb-3">
            <label className="form-label">
              Minimum Shape Size: {parameters.infill.minSize.toFixed(1)}mm
            </label>
            <input
              type="range"
              className="form-range"
              min="1"
              max="50"
              step="0.5"
              value={parameters.infill.minSize}
              onChange={(e) => handleInfillChange('minSize', parseFloat(e.target.value))}
            />
            <div className="d-flex justify-content-between">
              <small className="text-muted">1mm</small>
              <small className="text-muted">50mm</small>
            </div>
            <small className="form-text text-muted">
              Only fill shapes larger than this size
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">
              Line Spacing: {parameters.infill.lineSpacing.toFixed(1)}mm
            </label>
            <input
              type="range"
              className="form-range"
              min="0.5"
              max="10"
              step="0.1"
              value={parameters.infill.lineSpacing}
              onChange={(e) => handleInfillChange('lineSpacing', parseFloat(e.target.value))}
            />
            <div className="d-flex justify-content-between">
              <small className="text-muted">0.5mm</small>
              <small className="text-muted">10mm</small>
            </div>
            <small className="form-text text-muted">
              Distance between infill lines
            </small>
          </div>

          <div className="mb-3">
            <label className="form-label">
              Infill Angle: {parameters.infill.angle}°
            </label>
            <input
              type="range"
              className="form-range"
              min="-90"
              max="90"
              step="5"
              value={parameters.infill.angle}
              onChange={(e) => handleInfillChange('angle', parseFloat(e.target.value))}
            />
            <div className="d-flex justify-content-between">
              <small className="text-muted">-90°</small>
              <small className="text-muted">90°</small>
            </div>
            <small className="form-text text-muted">
              Rotation angle for infill lines
            </small>
          </div>
        </>
      )}

      <div className="alert alert-info small mb-0">
        <strong>Note:</strong> Z position is fixed at 0. Use bed calibration on your Duet 2 to adjust the mug surface height.
      </div>
    </div>
  )
}

export default ParameterControls
