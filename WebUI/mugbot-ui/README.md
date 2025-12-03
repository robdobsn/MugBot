# MugBot GCODE Generator

A single-page web application for converting SVG vector graphics to GCODE for cylindrical printing on a Duet 2-based MugBot.

## Features

- **SVG File Upload**: Load vector graphics (SVG format) for conversion
- **3D Visualization**: Real-time preview of your design wrapped around a cylindrical mug
- **Adjustable Parameters**:
  - X Range (0-400mm): Rotation around the mug (default: 280mm)
  - Y Range (0-150mm): Vertical height up the mug (default: 80mm)
  - Extrusion Rate (0.1x-3.0x): Control paint flow (default: 1.0x)
  - Duet 2 IP Address: Direct upload capability
- **GCODE Generation**: Automatic conversion of vector paths to machine code
- **Direct Upload**: Send GCODE files directly to your Duet 2 controller via network

## Getting Started

### Prerequisites

- Node.js 22.12.0 or higher
- npm (comes with Node.js)

### Installation

1. Navigate to the project directory:
   ```bash
   cd WebUI/mugbot-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to: http://localhost:5173/

## Usage

### 1. Load Vector File
- Click "Choose File" and select an SVG file
- The file will be parsed and paths extracted automatically
- Supported elements: path, line, polyline, polygon, circle

### 2. Configure Parameters
- **X Range**: Controls how far the design wraps around the mug (circumference mapping)
- **Y Range**: Controls the vertical height of the design on the mug
- **Extrusion Rate**: Adjust paint flow (lower for fine details, higher for bold lines)
- **Duet 2 IP**: Enter your Duet controller's IP address for direct upload

### 3. Generate & Send GCODE
- Click "Generate GCODE" to convert your design
- Review the GCODE in the preview window
- Options:
  - **Download GCODE**: Save the file locally
  - **Send to Duet 2**: Upload directly to your printer

## Technical Details

### Coordinate System
- **X Axis**: Represents rotation around the mug (0-280mm default, maps to angular position)
- **Y Axis**: Vertical position up the mug side (0-80mm default)
- **Z Axis**: Fixed at Z=0 (use bed calibration on Duet 2 to adjust mug surface height)

### GCODE Format
- Uses absolute positioning (G90)
- Relative extrusion mode (M83)
- Extrusion calculated based on path distance and extrusion rate
- Compatible with RepRapFirmware (Duet 2)

### Duet 2 Upload
The application uses the RepRapFirmware HTTP API to upload files:
- Endpoint: `http://<duet-ip>/rr_upload?name=0:/gcodes/<filename>`
- Files are uploaded to the `/gcodes` directory on the SD card
- Note: May require CORS configuration on your Duet 2

## Technologies Used

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Bootstrap 5**: UI styling
- **Three.js**: 3D graphics
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Three.js helpers

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Tips

1. **SVG Preparation**: 
   - Keep designs simple for best results
   - Convert text to paths before exporting
   - Use single-color designs (colors are ignored)

2. **Parameter Tuning**:
   - Start with default settings
   - Test with small designs first
   - Adjust extrusion rate based on paint viscosity

3. **Bed Calibration**:
   - Run mesh bed compensation on your Duet 2
   - Calibrate with the actual mug in place
   - Z=0 represents the calibrated surface

4. **Network Setup**:
   - Ensure your computer and Duet 2 are on the same network
   - Find Duet IP in your router's DHCP table or on the Duet display
   - Test connection by browsing to `http://<duet-ip>` first

## Troubleshooting

- **CORS Errors**: Configure your Duet 2 to allow cross-origin requests, or use the download option and upload manually via Duet Web Control
- **Visualization Issues**: Ensure WebGL is enabled in your browser
- **Large Files**: Complex SVGs may take time to process; consider simplifying the design
