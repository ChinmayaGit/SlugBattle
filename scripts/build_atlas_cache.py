#!/usr/bin/env python3
"""
Parses all TexturePacker XML files in assets/spritesheets/ and generates
a single compact JSON file: assets/spritesheets/atlas_cache.json
This allows zero-latency instant loading in browser without fetching 30+ XML files.
"""

import os
import glob
import json
import xml.etree.ElementTree as ET

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
SPRITES_DIR = os.path.join(BASE_DIR, "assets", "spritesheets")
OUTPUT_JSON = os.path.join(SPRITES_DIR, "atlas_cache.json")

def parse_atlas_xml(xml_path):
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        if root.tag != "TextureAtlas":
            return None
        
        image_path = root.get("imagePath", "")
        width = int(root.get("width", 0))
        height = int(root.get("height", 0))
        
        sprites = {}
        for sprite_elem in root.findall("sprite"):
            name = sprite_elem.get("n")
            x = int(sprite_elem.get("x", 0))
            y = int(sprite_elem.get("y", 0))
            w = int(sprite_elem.get("w", 0))
            h = int(sprite_elem.get("h", 0))
            o_x = int(sprite_elem.get("oX", 0))
            o_y = int(sprite_elem.get("oY", 0))
            o_w = int(sprite_elem.get("oW", w))
            o_h = int(sprite_elem.get("oH", h))
            rotated = sprite_elem.get("r", "") == "y"
            
            sprites[name] = {
                "x": x, "y": y, "w": w, "h": h,
                "oX": o_x, "oY": o_y, "oW": o_w, "oH": o_h,
                "r": rotated
            }
            
        return {
            "imagePath": image_path,
            "width": width,
            "height": height,
            "sprites": sprites
        }
    except Exception as e:
        print(f"Error parsing {xml_path}: {e}")
        return None

def main():
    atlas_data = {}
    xml_files = sorted(glob.glob(os.path.join(SPRITES_DIR, "*.xml")))
    print(f"Found {len(xml_files)} XML files in {SPRITES_DIR}")
    
    total_sprites = 0
    for xml_path in xml_files:
        base_name = os.path.splitext(os.path.basename(xml_path))[0]
        parsed = parse_atlas_xml(xml_path)
        if parsed:
            atlas_data[base_name] = parsed
            count = len(parsed["sprites"])
            total_sprites += count
            # print(f"Parsed {base_name}: {count} sprites")
            
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(atlas_data, f, separators=(',', ':'))
        
    print(f"Successfully generated {OUTPUT_JSON}")
    print(f"Total atlases: {len(atlas_data)}, Total sprites: {total_sprites}")

if __name__ == "__main__":
    main()

