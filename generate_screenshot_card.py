"""
Screenshot Card Generator for Numia
Places screenshots on branded templates with rounded corners.

Template specs:
- Size: 1200x675px
- Screenshot position: X111, Y87
- Screenshot size: 978x543
- Border radius: 26px on bottom-left and bottom-right corners
"""

from PIL import Image, ImageDraw
import os
from datetime import datetime


def get_template():
    """Get the SS template"""
    return "templates/SS.png"


def create_rounded_rectangle_mask(size, radius, corners):
    """
    Create a mask with rounded corners.

    Args:
        size: (width, height) tuple
        radius: corner radius in pixels
        corners: tuple of booleans (top_left, top_right, bottom_left, bottom_right)
    """
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)

    width, height = size

    # Draw main rectangle
    draw.rectangle([0, 0, width, height], fill=255)

    # Apply rounded corners where specified
    top_left, top_right, bottom_left, bottom_right = corners

    if top_left:
        draw.rectangle([0, 0, radius, radius], fill=0)
        draw.pieslice([0, 0, radius * 2, radius * 2], 180, 270, fill=255)

    if top_right:
        draw.rectangle([width - radius, 0, width, radius], fill=0)
        draw.pieslice([width - radius * 2, 0, width, radius * 2], 270, 360, fill=255)

    if bottom_left:
        draw.rectangle([0, height - radius, radius, height], fill=0)
        draw.pieslice([0, height - radius * 2, radius * 2, height], 90, 180, fill=255)

    if bottom_right:
        draw.rectangle([width - radius, height - radius, width, height], fill=0)
        draw.pieslice([width - radius * 2, height - radius * 2, width, height], 0, 90, fill=255)

    return mask


def generate_screenshot_card(screenshot_path: str, output_path: str = None):
    """
    Generate a screenshot card with the screenshot on a branded template.

    Args:
        screenshot_path: Path to the screenshot image
        output_path: Optional custom output path. If None, saves to output/visuals/

    Returns:
        str: Path to the generated image
    """
    # Get template
    template_path = get_template()

    if not os.path.exists(template_path):
        raise FileNotFoundError(
            f"Template not found at {template_path}\n"
            "Make sure SS.png exists in templates/"
        )

    # Load template
    template = Image.open(template_path)
    print(f"Using template: {template_path}")

    # Load screenshot
    if not os.path.exists(screenshot_path):
        raise FileNotFoundError(f"Screenshot not found at {screenshot_path}")

    screenshot = Image.open(screenshot_path)

    # Crop to fill (maintains aspect ratio, crops excess)
    screenshot_size = (978, 543)
    target_ratio = screenshot_size[0] / screenshot_size[1]
    img_ratio = screenshot.width / screenshot.height

    if img_ratio > target_ratio:
        # Image is wider, crop width
        new_width = int(screenshot.height * target_ratio)
        left = (screenshot.width - new_width) // 2
        screenshot = screenshot.crop((left, 0, left + new_width, screenshot.height))
    else:
        # Image is taller, crop height
        new_height = int(screenshot.width / target_ratio)
        top = (screenshot.height - new_height) // 2
        screenshot = screenshot.crop((0, top, screenshot.width, top + new_height))

    # Now resize to exact dimensions
    screenshot = screenshot.resize(screenshot_size, Image.Resampling.LANCZOS)

    # Create mask with bottom corners rounded
    # (top_left, top_right, bottom_left, bottom_right)
    mask = create_rounded_rectangle_mask(screenshot_size, 26, (False, False, True, True))

    # Apply mask to screenshot
    screenshot.putalpha(mask)

    # Paste screenshot onto template at specified position
    position = (111, 87)
    template.paste(screenshot, position, screenshot)

    # Determine output path
    if output_path is None:
        os.makedirs("output/visuals", exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        output_path = f"output/visuals/{timestamp}_screenshot_card.png"

    # Save the image
    template.save(output_path)
    print(f"Screenshot card generated: {output_path}")

    return output_path


if __name__ == "__main__":
    # Example usage
    import sys

    if len(sys.argv) < 2:
        print("Usage: python generate_screenshot_card.py '<screenshot_path>' [output_path]")
        print("\nExample:")
        print("  python generate_screenshot_card.py '/path/to/screenshot.png'")
        sys.exit(1)

    screenshot_path = sys.argv[1]
    output = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        result = generate_screenshot_card(screenshot_path, output)
        print(f"Success! Generated: {result}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
