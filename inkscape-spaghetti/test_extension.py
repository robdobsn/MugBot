#!/usr/bin/env python3
"""
Simple test script to check if the spaghetti extension can load and run
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    print("Testing spaghetti extension...")
    print("1. Importing inkex...")
    import inkex
    print("   ✓ inkex imported successfully")
    
    print("2. Importing spaghetti module...")
    import spaghetti
    print("   ✓ spaghetti module imported successfully")
    
    print("3. Creating SpaghettiEffect instance...")
    effect = spaghetti.SpaghettiEffect()
    print("   ✓ SpaghettiEffect created successfully")
    
    print("\nAll imports successful!")
    print("\nTo test with a real document:")
    print("1. Open Inkscape")
    print("2. Go to Extensions → Generate from Path → Spaghetti Effect")
    print("3. Check the error messages in the dialog or terminal")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nMake sure:")
    print("- Inkscape is installed")
    print("- You're using Inkscape's Python")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
