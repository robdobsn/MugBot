# Debugging Guide for MugBot UI

## Current Status
The application is running at http://localhost:5173/

## What Was Fixed

### 1. File Upload & Path Parsing
- ✅ Fixed polyline/polygon point parsing to handle both comma and space-separated coordinates
- ✅ Added console logging to see how many paths are parsed
- ✅ Fixed SVG path parsing to include the initial M (move) command point

### 2. 3D Visualization
- ✅ Used `useMemo` to recreate geometry when svgPaths or parameters change
- ✅ Added the starting point from M commands (was missing before!)
- ✅ Added extensive console logging to debug path rendering

### 3. GCODE Generation
- ✅ Added logging to verify button clicks are working
- ✅ Function should now execute properly

## How to Test

### 1. Open Browser Console
Press F12 in your browser to open DevTools, then go to the Console tab.

### 2. Load an SVG File
1. Click "Choose File" in the UI
2. Select one of the test files (try `public/test-pattern.svg` or `public/flower-pattern.svg`)
3. Watch the console - you should see:
   ```
   Parsed SVG paths: [...]
   Total paths found: X
   App: SVG loaded with X paths
   Creating path geometry for X paths
   Processing path 0: M ... L ...
   Path 0 generated Y 3D points
   SVG bounds: { minX: ..., maxX: ..., ... }
   Added line 0 to group
   Total lines in group: X
   ```

### 3. Check the 3D Preview
- You should see red lines wrapped around the white transparent cylinder
- The mug should be rotating slowly
- Use mouse to rotate/zoom the view

### 4. Generate GCODE
1. Click "Generate GCODE" button
2. Console should show: `generateGCode called, paths: X`
3. You should see the GCODE preview appear below the button
4. Try "Download GCODE" to save the file
5. Try "Send to Duet 2" (will likely fail with CORS unless your Duet is configured)

## If Nothing Shows Up

### Check Console for Errors
Look for red error messages in the browser console.

### Common Issues

**No paths found:**
- Make sure the SVG file has valid path, line, circle, or polyline elements
- Try the provided test files first

**No 3D visualization:**
- Check console for WebGL errors
- Make sure hardware acceleration is enabled in browser settings
- Try a different browser (Chrome/Edge recommended)

**Buttons don't work:**
- Check console when clicking - should see log messages
- Make sure you've loaded an SVG file first
- Check for JavaScript errors in console

## Console Logging

All major functions now log to console:
- File upload: "Parsed SVG paths", "Total paths found"
- App state: "App: SVG loaded with X paths"
- 3D rendering: "Creating path geometry", "Processing path", "Added line to group"
- GCODE: "generateGCode called"

If you're not seeing these messages, something is wrong with the event handlers.

## Next Steps

Once you confirm it's working:
1. Try your own SVG files
2. Adjust parameters (X/Y range, extrusion rate)
3. Test GCODE generation and download
4. Configure your Duet 2 for network upload

## Need More Help?

Share the console output and I can help diagnose any issues!
