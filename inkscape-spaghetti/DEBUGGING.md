# Debugging Guide for Spaghetti Extension

## Quick Debugging Steps

### 1. Check if Extension is Installed
- Open Inkscape
- Go to `Extensions` menu
- Look for `Generate from Path → Spaghetti Effect`
- If not there, extension files aren't in the right location

### 2. Check Extension Files Location
Should be in: `C:\Users\rob\AppData\Roaming\inkscape\extensions\`

Verify both files exist:
- `spaghetti.py`
- `spaghetti.inx`

### 3. Run with Debug Messages
The updated script now shows debug messages. To see them:

**In Inkscape:**
1. Create a new document
2. Extensions → Generate from Path → Spaghetti Effect
3. Click "Apply"
4. Look for error messages in the dialog box that appears

**From Command Line:**
```powershell
cd "C:\Users\rob\AppData\Roaming\inkscape\extensions"
python test_extension.py
```

### 4. Check Inkscape Errors Log
Inkscape may log errors to a file:
- Location: `%APPDATA%\inkscape\extension-errors.log`
- Or run Inkscape from command line to see errors:

```powershell
& "C:\Program Files\Inkscape\bin\inkscape.exe"
```

### 5. Common Issues

**Issue: Nothing appears**
- Check debug messages show up
- Verify bounding box values are reasonable
- Try with a smaller page size or smaller line_length

**Issue: "Could not determine bounding box"**
- Page size might not be detected
- Try unchecking "Use page bounds" and select an object first

**Issue: Extension doesn't appear in menu**
- Files not in correct location
- Inkscape not restarted after copying files
- Python syntax error in .py file

**Issue: "No module named inkex"**
- Using wrong Python interpreter
- Extension must run through Inkscape's Python

### 6. Manual Test
Create a minimal test SVG and run extension on it:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg width="200mm" height="200mm" viewBox="0 0 200 200" 
     xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="40" fill="black"/>
</svg>
```

Save this as `test.svg`, open in Inkscape, run the extension.

### 7. Check Debug Output
With the updated script, you should see messages like:
```
Debug: Bounding box = (0.0, 0.0, 793.7, 1122.5)
Debug: Creating density map...
Debug: Generating spaghetti path...
Debug: Path data length = 45623 chars
Debug: Path element created successfully!
```

If you see these but still no visible path, the issue might be:
- Path color same as background
- Path outside visible area
- Stroke width too small

### 8. Verify Path Creation
After running extension:
- Check if a new path object appears in layers panel
- Try selecting all (Ctrl+A) to see if path exists
- Change stroke color manually to verify path is there

## What the Debug Version Does

The updated `spaghetti.py` now:
1. Shows bounding box coordinates
2. Reports each major step
3. Shows path data length
4. Catches and displays all errors with full stack traces

Run the extension and report back what debug messages you see!
