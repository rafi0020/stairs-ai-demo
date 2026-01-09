"""
Stairs-AI Demo - Rail mask polygon operations
"""
import json
from typing import List, Tuple, Dict, Any, Optional
from pathlib import Path


class RailMaskManager:
    """Manages rail polygon masks and hit-testing"""
    
    def __init__(self, masks_path: Optional[str] = None):
        self.polygons: List[Dict[str, Any]] = []
        self.frame_width: int = 1280
        self.frame_height: int = 720
        
        if masks_path:
            self.load(masks_path)
    
    def load(self, path: str) -> None:
        """Load rail masks from JSON file"""
        with open(path, 'r') as f:
            data = json.load(f)
        
        self.polygons = data.get("polygons", [])
        self.frame_width = data.get("frame_width", 1280)
        self.frame_height = data.get("frame_height", 720)
    
    def point_in_polygon(self, x: int, y: int, polygon: List[List[int]]) -> bool:
        """
        Ray-casting algorithm to determine if point is inside polygon.
        
        Args:
            x, y: Point coordinates
            polygon: List of [x, y] vertices
            
        Returns:
            True if point is inside polygon
        """
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def point_in_any_polygon(self, x: int, y: int) -> Tuple[bool, List[str]]:
        """
        Check if point is in any rail polygon.
        
        Returns:
            Tuple of (is_in_any, list_of_polygon_ids)
        """
        hit_ids = []
        for poly_data in self.polygons:
            points = poly_data.get("points", [])
            poly_id = poly_data.get("id", "unknown")
            if self.point_in_polygon(x, y, points):
                hit_ids.append(poly_id)
        
        return (len(hit_ids) > 0, hit_ids)
    
    def get_polygon_points(self, polygon_id: str) -> Optional[List[List[int]]]:
        """Get points for a specific polygon"""
        for poly in self.polygons:
            if poly.get("id") == polygon_id:
                return poly.get("points", [])
        return None
    
    def get_polygon_color(self, polygon_id: str) -> Tuple[int, int, int]:
        """Get color for a specific polygon"""
        for poly in self.polygons:
            if poly.get("id") == polygon_id:
                color = poly.get("color", [0, 255, 0])
                return tuple(color)
        return (0, 255, 0)
    
    def get_all_polygons(self) -> List[Dict[str, Any]]:
        """Get all polygon data for visualization"""
        return self.polygons
    
    def to_dict(self) -> Dict[str, Any]:
        """Export mask data for JSON serialization"""
        return {
            "polygons": self.polygons,
            "frame_width": self.frame_width,
            "frame_height": self.frame_height
        }


def create_default_masks(output_path: str) -> None:
    """Create default rail mask configuration for the demo video"""
    default_masks = {
        "polygons": [
            {
                "id": "right_handrail",
                "label": "Right Handrail",
                "points": [
                    [1050, 180],
                    [1150, 180],
                    [1200, 350],
                    [1250, 550],
                    [1200, 720],
                    [1100, 720],
                    [1080, 550],
                    [1030, 350]
                ],
                "color": [0, 255, 0]
            }
        ],
        "frame_width": 1280,
        "frame_height": 720,
        "description": "Rail mask polygons for the demo staircase video"
    }
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(default_masks, f, indent=2)
