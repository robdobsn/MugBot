# Spaghetti Effect - Inkscape Extension

An Inkscape extension that generates a wiggly "spaghetti" line pattern that fills the page with varying density based on filled objects in the document. Areas with filled objects get denser coverage, creating a unique artistic effect where shapes become visible through line density.

## Effect Description

The extension creates a continuous wiggly line (like a strand of spaghetti) that wanders across the page. The line is:
- **Denser** (more crossings and coverage) where there are filled objects
- **Sparser** (less coverage) in empty areas

This creates a visual effect where filled shapes (like circles, rectangles, text, etc.) appear as darker regions due to more line coverage, while the background remains lighter.

## Installation

1. Copy both files to your Inkscape extensions directory:
   - **Windows**: `%APPDATA%\inkscape\extensions\`
   - **macOS**: `~/.config/inkscape/extensions/`
   - **Linux**: `~/.config/inkscape/extensions/`

2. Files to copy:
   - `spaghetti.py`
   - `spaghetti.inx`

3. Restart Inkscape

## Usage

### Basic Usage

1. **Create your design** with filled shapes:
   - Draw circles, rectangles, text, or any filled objects
   - These will become the "dense" areas in the spaghetti pattern

2. **Run the extension**:
   - Go to: `Extensions → Generate from Path → Spaghetti Effect`
   - The dialog will open with adjustable parameters

3. **Adjust parameters** (optional):
   - See parameter descriptions below

4. **Click Apply** to generate the spaghetti pattern

### Example Workflow

```
1. Create a filled circle in the center of the page
2. Extensions → Generate from Path → Spaghetti Effect
3. Set:
   - Line length: 5000
   - Wiggle amount: 30
   - Min density: 0.2
   - Max density: 1.0
4. Click Apply
5. Result: A wiggly line that's much denser over the circle
```

## Parameters

### Line Parameters

- **Total line length** (100-50000, default: 5000)
  - The total length of the spaghetti strand in document units
  - Longer = more coverage and detail
  - Shorter = faster generation, less coverage

- **Segment length** (1-100, default: 10)
  - Length of each individual line segment
  - Smaller = more detail, finer wiggles
  - Larger = faster, smoother curves

- **Wiggle amount** (0-180°, default: 30)
  - Maximum angle change per segment
  - Higher = more erratic, tightly curled lines
  - Lower = smoother, more flowing lines

### Density Parameters

- **Min density** (0-1, default: 0.3)
  - Density multiplier in empty areas
  - 0 = almost no wiggling in empty space
  - 1 = full wiggling everywhere

- **Max density** (0-1, default: 1.0)
  - Density multiplier in filled areas
  - Should usually be higher than min density
  - Controls how much more dense filled areas appear

- **Sample resolution** (5-50 pixels, default: 10)
  - Size of grid cells for density detection
  - Smaller = more accurate detection (slower)
  - Larger = faster but less accurate

### Boundary Options

- **Use page bounds** (checkbox, default: checked)
  - Checked: Spaghetti fills entire page
  - Unchecked: Spaghetti fills selected objects' bounding box
  - Note: Filled objects are detected across entire document regardless

- **Margin from edges** (0-100, default: 10)
  - Space to leave at boundary edges
  - Prevents spaghetti from going right to page edge

### Appearance

- **Stroke width** (0.1-10, default: 1.0)
  - Width of the spaghetti line
  - Thicker lines create bolder patterns

- **Stroke color** (color picker, default: black)
  - Color of the spaghetti line

## Tips and Tricks

### For Best Results

1. **High contrast**: Set min_density low (0.2-0.3) and max_density high (0.9-1.0)
2. **Fine detail**: Use smaller segment_length (5-10) and longer line_length (10000+)
3. **Artistic effect**: Try different wiggle amounts (10-60°)
4. **Performance**: Lower sample_resolution (15-20) for faster preview, then increase for final

### Creative Ideas

- **Text effects**: Type text, convert to path, fill, then apply spaghetti
- **Portraits**: Import bitmap, trace to filled paths, apply spaghetti
- **Multiple layers**: Run multiple times with different colors/densities
- **Combine effects**: Use with other Inkscape effects for unique results

### Troubleshooting

**Problem**: Extension doesn't appear in menu
- Solution: Make sure both .py and .inx files are in extensions folder
- Solution: Restart Inkscape completely

**Problem**: "No filled objects found" or uniform pattern
- Solution: Make sure shapes have fill (not just stroke)
- Solution: Check that fill is not "none" in object properties

**Problem**: Very slow generation
- Solution: Reduce line_length
- Solution: Increase sample_resolution (use larger grid)
- Solution: Use page bounds instead of complex selection

**Problem**: Pattern doesn't show filled objects clearly
- Solution: Increase contrast (lower min_density, raise max_density)
- Solution: Increase line_length for more coverage
- Solution: Decrease sample_resolution for better accuracy

## Technical Details

### How It Works

1. **Density Map Creation**: The extension scans the document and creates a grid-based density map where each cell is marked as "filled" or "empty" based on whether filled objects overlap that area.

2. **Path Generation**: A random-walk algorithm generates a continuous path that:
   - Starts at a random position
   - Moves forward in segments
   - Changes direction based on a "wiggle" factor
   - Wiggles more in areas marked as "filled" in the density map
   - Bounces off boundaries to stay within bounds

3. **Result**: The combination of random walking with density-based wiggling creates natural-looking coverage that's denser where objects exist.

### Algorithm

```
while total_length < target_length:
    density = get_density_at_current_position()
    wiggle_angle = random(-max_wiggle * density, +max_wiggle * density)
    current_angle += wiggle_angle
    move_forward(segment_length)
    if outside_bounds:
        bounce_off_boundary()
```

## License

MIT License - Feel free to modify and distribute

## Version

Version 1.0 - December 2025

## Requirements

- Inkscape 1.0 or later
- Python 3.6 or later (included with Inkscape)

## Future Enhancements

Possible improvements for future versions:
- More sophisticated density detection (actual path filling vs bounding boxes)
- Multiple strand generation
- Gradient density transitions
- Custom boundary shapes
- Performance optimizations for large documents
- Variable stroke width based on density
