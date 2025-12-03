import { type MugParameters } from '../App'

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

      <div className="alert alert-info small mb-0">
        <strong>Note:</strong> Z position is fixed at 0. Use bed calibration on your Duet 2 to adjust the mug surface height.
      </div>
    </div>
  )
}

export default ParameterControls
