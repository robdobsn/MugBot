#!/usr/bin/env python3
"""
Spaghetti Effect - Inkscape Extension

This extension generates a wiggly line that fills the page/bounding box with
density based on the presence of filled objects. Areas with filled objects
get more "spaghetti strands" creating a visible pattern.

Copyright (c) 2025
License: MIT
"""

import inkex
from inkex import Path, PathElement, Rectangle
import random
import math
import sys
from typing import List, Tuple, Optional

class SpaghettiEffect(inkex.EffectExtension):
    """Generate spaghetti-like lines with density based on filled objects"""
    
    def add_arguments(self, pars):
        """Add command line arguments"""
        pars.add_argument("--tab", default="settings", help="The active tab")
        
        # Line parameters
        pars.add_argument("--line_length", type=float, default=5000.0,
                         help="Total length of the spaghetti line (in document units)")
        pars.add_argument("--segment_length", type=float, default=10.0,
                         help="Length of each line segment")
        pars.add_argument("--wiggle_amount", type=float, default=30.0,
                         help="Maximum angle change per segment (degrees)")
        
        # Density parameters
        pars.add_argument("--min_density", type=float, default=0.3,
                         help="Minimum density in empty areas (0-1)")
        pars.add_argument("--max_density", type=float, default=1.0,
                         help="Maximum density in filled areas (0-1)")
        pars.add_argument("--sample_resolution", type=int, default=10,
                         help="Resolution for density sampling (pixels)")
        
        # Boundary options
        pars.add_argument("--use_page", type=inkex.Boolean, default=True,
                         help="Use page bounds (otherwise use selection bounds)")
        pars.add_argument("--margin", type=float, default=10.0,
                         help="Margin from boundary edges")
        
        # Curvature control
        pars.add_argument("--max_curvature", type=float, default=0.3,
                         help="Maximum curvature (0=straight, 1=very curvy)")
        pars.add_argument("--smoothness", type=int, default=3,
                         help="Smoothness factor (higher=smoother curves)")
        pars.add_argument("--num_strands", type=int, default=8,
                         help="Number of spaghetti strands to generate")
        
        # Visual options
        pars.add_argument("--stroke_width", type=float, default=0.5,
                         help="Width of the spaghetti stroke")
        pars.add_argument("--stroke_color", type=str, default="#000000ff",
                         help="Color of the spaghetti stroke")
    
    def effect(self):
        """Main effect method"""
        try:
            # Get bounding box
            bbox = self.get_bounding_box()
            if bbox is None:
                inkex.errormsg("Could not determine bounding box. Please select objects or check page size.")
                return
            
            x_min, y_min, x_max, y_max = bbox
            inkex.errormsg(f"Debug: Bounding box = ({x_min:.1f}, {y_min:.1f}, {x_max:.1f}, {y_max:.1f})")
            
            # Apply margin
            margin = self.options.margin
            x_min += margin
            y_min += margin
            x_max -= margin
            y_max -= margin
            
            if x_max <= x_min or y_max <= y_min:
                inkex.errormsg("Bounding box too small after applying margins.")
                return
            
            inkex.errormsg(f"Debug: Creating density map...")
            # Create density map from filled objects
            density_map = self.create_density_map(bbox)
            
            # Generate multiple strands
            num_strands = self.options.num_strands
            inkex.errormsg(f"Debug: Generating {num_strands} spaghetti strands...")
            
            for i in range(num_strands):
                path_data = self.generate_single_strand(bbox, density_map)
                if path_data:
                    self.create_path_element(path_data)
            
            inkex.errormsg(f"Debug: Created {num_strands} strands successfully!")
        except Exception as e:
            inkex.errormsg(f"Error: {str(e)}")
            import traceback
            inkex.errormsg(traceback.format_exc())
    
    def get_bounding_box(self) -> Optional[Tuple[float, float, float, float]]:
        """Get the bounding box for the spaghetti effect"""
        if self.options.use_page:
            # Use page dimensions
            svg = self.document.getroot()
            # Get page dimensions, handle different Inkscape versions
            width = self.svg.viewport_width or self.svg.width or 210  # fallback to A4 width in mm
            height = self.svg.viewport_height or self.svg.height or 297  # fallback to A4 height in mm
            
            # Convert to user units if needed
            width = self.svg.unittouu(str(width))
            height = self.svg.unittouu(str(height))
            
            return (0, 0, width, height)
        else:
            # Use selection bounds
            if not self.svg.selection:
                inkex.errormsg("No objects selected. Please select objects or use page bounds.")
                return None
            
            bbox = self.svg.selection.bounding_box()
            if bbox:
                return (bbox.left, bbox.top, bbox.right, bbox.bottom)
            return None
    
    def create_density_map(self, bbox: Tuple[float, float, float, float]) -> List[List[float]]:
        """
        Create a 2D density map based on filled objects in the document.
        Returns a grid where each cell contains a density value (0-1).
        """
        x_min, y_min, x_max, y_max = bbox
        resolution = self.options.sample_resolution
        
        # Calculate grid dimensions
        width = x_max - x_min
        height = y_max - y_min
        cols = max(1, int(width / resolution))
        rows = max(1, int(height / resolution))
        
        # Initialize density map
        density_map = [[0.0 for _ in range(cols)] for _ in range(rows)]
        
        # Get all filled objects (paths, shapes, etc.)
        filled_objects = self.get_filled_objects()
        
        if not filled_objects:
            # No filled objects, return uniform low density
            min_density = self.options.min_density
            return [[min_density for _ in range(cols)] for _ in range(rows)]
        
        # Sample each grid cell
        for row in range(rows):
            for col in range(cols):
                # Calculate center of cell
                x = x_min + (col + 0.5) * resolution
                y = y_min + (row + 0.5) * resolution
                
                # Check if point is inside any filled object
                if self.point_in_filled_objects(x, y, filled_objects):
                    density_map[row][col] = self.options.max_density
                else:
                    density_map[row][col] = self.options.min_density
        
        return density_map
    
    def get_filled_objects(self) -> List:
        """Get all filled objects from the document"""
        filled_objects = []
        
        # Iterate through all elements in the document
        for element in self.document.getroot().iter():
            # Check if element has a fill and is visible
            if isinstance(element, (PathElement, Rectangle, inkex.Circle, 
                                   inkex.Ellipse, inkex.Polygon, inkex.Polyline)):
                style = element.style
                if style and style.get('fill') and style.get('fill') != 'none':
                    filled_objects.append(element)
        
        return filled_objects
    
    def point_in_filled_objects(self, x: float, y: float, filled_objects: List) -> bool:
        """Check if a point is inside any filled object"""
        point = inkex.Vector2d(x, y)
        
        for obj in filled_objects:
            try:
                # Get the bounding box first for quick rejection
                bbox = obj.bounding_box()
                if bbox and bbox.left <= x <= bbox.right and bbox.top <= y <= bbox.bottom:
                    # For more accurate detection, we'd need to check actual shape
                    # For now, we use bounding box as approximation
                    return True
            except:
                continue
        
        return False
    
    def get_density_at_point(self, x: float, y: float, bbox: Tuple[float, float, float, float], 
                            density_map: List[List[float]]) -> float:
        """Get density value at a specific point"""
        x_min, y_min, x_max, y_max = bbox
        resolution = self.options.sample_resolution
        
        # Calculate grid position
        col = int((x - x_min) / resolution)
        row = int((y - y_min) / resolution)
        
        # Clamp to valid range
        rows = len(density_map)
        cols = len(density_map[0]) if rows > 0 else 0
        row = max(0, min(rows - 1, row))
        col = max(0, min(cols - 1, col))
        
        return density_map[row][col]
    
    def generate_single_strand(self, bbox: Tuple[float, float, float, float], 
                              density_map: List[List[float]]) -> str:
        """Generate one naturally wiggly spaghetti strand with continuous smooth curves"""
        x_min, y_min, x_max, y_max = bbox
        
        # Start at random position
        x = random.uniform(x_min + 20, x_max - 20)
        y = random.uniform(y_min + 20, y_max - 20)
        angle = random.uniform(0, 2 * math.pi)
        
        control_points = [(x, y)]
        control_angles = [angle]
        
        max_length = self.options.line_length / self.options.num_strands
        segment_length = self.options.segment_length * 2  # Smaller for more wiggle
        max_wiggle = math.radians(self.options.wiggle_amount)  # Full wiggle amount
        max_curvature = self.options.max_curvature
        
        total_length = 0
        angular_velocity = 0.0
        wiggle_phase = random.uniform(0, 2 * math.pi)
        
        # Generate control points with continuous wiggling
        stuck_counter = 0
        max_stuck = 10
        
        while total_length < max_length and stuck_counter < max_stuck:
            density = self.get_density_at_point(x, y, bbox, density_map)
            
            # Continuous sine wave wiggle + random noise
            wiggle_phase += 0.15  # Higher frequency = more wiggly
            base_sine_wiggle = math.sin(wiggle_phase) * max_wiggle * max_curvature * 0.5
            random_wiggle = random.gauss(0, max_wiggle * max_curvature * density * 0.3)
            
            # Combine wiggles
            target_velocity = base_sine_wiggle + random_wiggle
            
            # Smooth transition (less momentum for more wiggle)
            angular_velocity = angular_velocity * 0.7 + target_velocity * 0.3
            
            # Gentle limit - allow more turning
            max_change = math.radians(8)  # Increased from 3
            angular_velocity = max(-max_change, min(max_change, angular_velocity))
            
            angle += angular_velocity
            
            # Move
            next_x = x + segment_length * math.cos(angle)
            next_y = y + segment_length * math.sin(angle)
            
            # Boundary check with gentle curve
            margin = 30
            if next_x < x_min + margin or next_x > x_max - margin or \
               next_y < y_min + margin or next_y > y_max - margin:
                # Turn toward center
                stuck_counter += 1
                center_x, center_y = (x_min + x_max) / 2, (y_min + y_max) / 2
                to_center = math.atan2(center_y - y, center_x - x)
                angle = to_center + random.gauss(0, 0.3)
                angular_velocity *= 0.3
            else:
                stuck_counter = 0  # Reset counter when we make progress
                x = next_x
                y = next_y
                control_points.append((x, y))
                control_angles.append(angle)
                total_length += segment_length
        
        # Build smooth Bezier path
        if len(control_points) < 2:
            return ""
        
        path_commands = [f"M {control_points[0][0]:.2f},{control_points[0][1]:.2f}"]
        
        # Create smooth cubic Bezier curves
        for i in range(len(control_points) - 1):
            p1 = control_points[i]
            p2 = control_points[i + 1]
            a1 = control_angles[i]
            a2 = control_angles[i + 1]
            
            # Longer control point distance for gentler curves
            cp_distance = segment_length * 0.6  # Increased from 0.4
            
            # First control point extends from p1
            cp1_x = p1[0] + cp_distance * math.cos(a1)
            cp1_y = p1[1] + cp_distance * math.sin(a1)
            
            # Second control point extends backward from p2  
            cp2_x = p2[0] - cp_distance * math.cos(a2)
            cp2_y = p2[1] - cp_distance * math.sin(a2)
            
            # Cubic Bezier curve
            path_commands.append(
                f"C {cp1_x:.2f},{cp1_y:.2f} {cp2_x:.2f},{cp2_y:.2f} {p2[0]:.2f},{p2[1]:.2f}"
            )
        
        return " ".join(path_commands)
    
    def points_to_smooth_path(self, points: List[Tuple[float, float]], 
                             angles: List[float] = None) -> str:
        """Convert points to smooth SVG path using cubic Bezier curves like real spaghetti"""
        if len(points) < 2:
            return ""
        
        if len(points) == 2:
            return f"M {points[0][0]:.2f},{points[0][1]:.2f} L {points[1][0]:.2f},{points[1][1]:.2f}"
        
        path_commands = [f"M {points[0][0]:.2f},{points[0][1]:.2f}"]
        
        # Use smoothness to control curve tension
        # Higher smoothness = gentler, more flowing curves
        smoothness_factor = self.options.smoothness
        control_distance = self.options.segment_length * (smoothness_factor / 3.0)
        
        # Build smooth path using cubic Bezier curves
        # Each curve segment uses tangent information for natural flow
        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i + 1]
            
            # Calculate tangent vectors for smooth curves
            if angles and i < len(angles) - 1:
                # Use actual angles if available (better!)
                angle1 = angles[i]
                angle2 = angles[i + 1]
            else:
                # Estimate from point positions
                if i > 0:
                    angle1 = math.atan2(p1[1] - points[i-1][1], p1[0] - points[i-1][0])
                else:
                    angle1 = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
                
                if i < len(points) - 2:
                    angle2 = math.atan2(points[i+2][1] - p2[1], points[i+2][0] - p2[0])
                else:
                    angle2 = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
            
            # Control points based on tangent directions
            # This creates smooth, natural curves like the traced spaghetti
            cp1_x = p1[0] + control_distance * math.cos(angle1)
            cp1_y = p1[1] + control_distance * math.sin(angle1)
            
            cp2_x = p2[0] - control_distance * math.cos(angle2)
            cp2_y = p2[1] - control_distance * math.sin(angle2)
            
            # Create smooth cubic Bezier curve
            path_commands.append(
                f"C {cp1_x:.2f},{cp1_y:.2f} {cp2_x:.2f},{cp2_y:.2f} {p2[0]:.2f},{p2[1]:.2f}"
            )
        
        return " ".join(path_commands)
    
    def create_path_element(self, path_data: str):
        """Create and add the path element to the document"""
        layer = self.svg.get_current_layer()
        
        # Get stroke parameters
        stroke_color = str(self.options.stroke_color) if self.options.stroke_color else '#000000'
        stroke_width = max(1.0, float(self.options.stroke_width))
        
        # Create the path element
        path_elem = PathElement()
        
        # Set the path data
        path_elem.set('d', path_data)
        
        # Set fill and stroke as direct attributes (most reliable)
        path_elem.set('fill', 'none')
        path_elem.set('stroke', stroke_color)
        path_elem.set('stroke-width', str(stroke_width))
        path_elem.set('stroke-linecap', 'round')
        path_elem.set('stroke-linejoin', 'round')
        
        # ALSO set via style for maximum compatibility
        style_dict = {
            'fill': 'none',
            'stroke': stroke_color,
            'stroke-width': str(stroke_width),
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
        }
        path_elem.style = style_dict
        
        # Add to document
        layer.append(path_elem)
        
        inkex.errormsg(f"Created path: stroke={stroke_color}, width={stroke_width}px")


if __name__ == '__main__':
    SpaghettiEffect().run()
