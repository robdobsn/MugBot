# MugBot Web UI - Quick Start Guide

## What You Just Built

You now have a fully functional web application that:
1. ✅ Loads SVG vector files
2. ✅ Displays a 3D preview of the design wrapped around a cylindrical mug
3. ✅ Allows parameter adjustment (X/Y dimensions, extrusion rate, Duet IP)
4. ✅ Generates GCODE for your Duet 2 controller
5. ✅ Can upload GCODE directly to the Duet 2 via network

## Access the Application

The dev server is running at: **http://localhost:5173/**

Open this URL in your web browser to use the application.

## Test Files

Two example SVG files are provided in the `public/` folder:
- `test-pattern.svg` - Simple grid and circle pattern
- `flower-pattern.svg` - Decorative flower design

## How to Use

### Step 1: Load an SVG File
1. Click "Choose File" in the "Load Vector File" section
2. Select an SVG file from your computer (or use the examples in `public/`)
3. The file will be parsed and you'll see it in the 3D preview

### Step 2: Adjust Parameters
- **X Range (0-400mm)**: How far around the mug the design wraps
  - Default: 280mm (suitable for average mug circumference)
  - Adjust based on your mug's actual circumference
  
- **Y Range (0-150mm)**: Vertical height of the design
  - Default: 80mm
  - Adjust based on how tall you want the design on the mug
  
- **Extrusion Rate (0.1-3.0x)**: Paint flow multiplier
  - Default: 1.0
  - Lower values (0.5-0.8) for fine details
  - Higher values (1.5-2.0) for bold, thick lines
  
- **Duet 2 IP Address**: Your printer's network address
  - Find this in your router or on the Duet display
  - Example: 192.168.1.100

### Step 3: Generate GCODE
1. Click "Generate GCODE"
2. Review the generated code in the preview box
3. Choose one of two options:
   - **Download GCODE**: Save locally and upload manually via Duet Web Control
   - **Send to Duet 2**: Upload directly (requires network access to Duet)

## 3D Preview Controls

- **Rotate**: Click and drag with left mouse button
- **Zoom**: Scroll wheel or pinch gesture
- **Pan**: Right-click and drag (or Ctrl+click on Mac)

The visualization shows:
- White transparent cylinder (the mug)
- Red lines (your design wrapped around the mug)
- Rotating animation for better viewing

## Understanding the Coordinate System

### X Axis (Rotation)
- In the SVG, X coordinates map to rotation around the mug
- The mug rotates during printing while the extruder moves vertically
- Full X range wraps completely around the mug

### Y Axis (Height)
- In the SVG, Y coordinates map to vertical position on the mug
- The extruder moves up and down the mug surface
- Y=0 is the bottom, Y=max is the top

### Z Axis (Surface Distance)
- Fixed at Z=0 in GCODE
- Use Duet 2's bed mesh compensation to calibrate the mug surface
- The extruder maintains constant distance from the curved surface

## Preparing SVG Files

### Best Practices
1. **Simplify designs**: Complex paths may be slow to process
2. **Convert text to paths**: Text must be converted before export
3. **Use strokes, not fills**: The GCODE traces strokes/outlines
4. **Single color**: Colors are ignored in GCODE generation
5. **Appropriate size**: Design at actual print dimensions when possible

### Supported SVG Elements
- `<path>` - Full support for M, L, H, V, Z commands
- `<line>` - Straight lines
- `<polyline>` and `<polygon>` - Multi-point shapes
- `<circle>` - Converted to circular paths
- More complex curves (C, S, Q, T, A) will be approximated

### Not Yet Supported
- DXF files (planned for future)
- Bezier curves (will be approximated with straight segments)
- Fills (only strokes are traced)
- Text elements (convert to paths first)

## Duet 2 Integration

### Network Upload
The app uploads to: `http://<duet-ip>/rr_upload?name=0:/gcodes/<filename>`

### CORS Configuration
If upload fails, you may need to enable CORS on your Duet 2:
1. Connect to Duet Web Control
2. Add CORS headers in your Duet configuration

### Alternative: Manual Upload
1. Click "Download GCODE"
2. Open Duet Web Control in browser: `http://<duet-ip>`
3. Navigate to Jobs → Upload
4. Select your downloaded GCODE file

## GCODE Structure

The generated GCODE includes:
```gcode
G21                    ; Millimeters
G90                    ; Absolute positioning
M83                    ; Relative extrusion
G92 E0                 ; Reset extruder
G0 Z0 F3000           ; Set Z to calibrated surface
G0 X0 Y0 F3000        ; Move to start
; [Your design paths here]
G1 X... Y... E...     ; Extrusion moves
G0 Z5 F1000           ; Lift at end
M84                    ; Disable motors
```

## Calibration Tips

### First Print Setup
1. Install and secure your mug on the MugBot
2. Run Duet 2 mesh bed compensation with the mug in place
3. Test with a simple design (like `test-pattern.svg`)
4. Adjust extrusion rate based on results

### Fine-Tuning
- **Lines too thin**: Increase extrusion rate
- **Lines too thick/blobby**: Decrease extrusion rate
- **Design too small**: Increase X/Y ranges
- **Design too large**: Decrease X/Y ranges
- **Missed spots**: Check bed mesh calibration

## Troubleshooting

### Application Issues
- **Blank preview**: Make sure you've loaded an SVG file
- **WebGL error**: Enable hardware acceleration in browser
- **Slow performance**: Try a simpler SVG design

### GCODE Issues
- **Skipped lines**: Check extrusion rate (may be too low)
- **Uneven coverage**: Recalibrate bed mesh with mug installed
- **Wrong size**: Adjust X/Y range parameters

### Upload Issues
- **CORS error**: Use download option and upload manually
- **Connection failed**: Verify Duet IP and network connectivity
- **Upload timeout**: Check that Duet is powered and responsive

## Development

### Project Structure
```
src/
├── components/
│   ├── FileUploader.tsx       - SVG file loading & parsing
│   ├── ParameterControls.tsx  - Settings UI
│   ├── MugVisualization.tsx   - Three.js 3D preview
│   └── GCodeGenerator.tsx     - GCODE generation & upload
├── App.tsx                    - Main app component
└── main.tsx                   - Entry point
```

### Making Changes
The dev server has hot module reload enabled. Changes to source files will automatically refresh the browser.

### Building for Production
```bash
npm run build
```

Outputs to `dist/` folder - can be hosted on any static web server or file server accessible to your network.

## Next Steps

1. **Test with simple designs**: Start with the provided example SVGs
2. **Calibrate your MugBot**: Run through first print setup
3. **Create custom designs**: Use Inkscape, Adobe Illustrator, or any SVG editor
4. **Experiment with parameters**: Find optimal settings for your paint and setup
5. **Share your results**: The MugBot community would love to see what you create!

## Support & Resources

- Original MugBot project files in `Design/` folder
- Example GCODE in `Software/Tests/Cad.py/Test Images/`
- Duet 2 documentation: https://docs.duet3d.com/

Enjoy your MugBot! 🎨☕
