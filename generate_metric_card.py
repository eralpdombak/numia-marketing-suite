"""
Metric Card Generator for Numia
Generates metric cards with text overlay on template background.

Template specs:
- Size: 1200x675px
- Number position: Y164, Centered, Poppins Bold, White
- Subheader position: Y365, Centered, Poppins Semibold, White
"""

from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime


def get_next_template():
    """Rotate through MC1-MC5 templates"""
    counter_file = "templates/.template_counter"

    # Read current counter
    if os.path.exists(counter_file):
        with open(counter_file, 'r') as f:
            current = int(f.read().strip())
    else:
        current = 0

    # Increment and wrap around (1-5)
    next_num = (current % 5) + 1

    # Save next counter
    with open(counter_file, 'w') as f:
        f.write(str(next_num))

    return f"templates/MC{next_num}.png"


def generate_metric_card(number: str, subheader: str, output_path: str = None):
    """
    Generate a metric card with the specified number and subheader.

    Args:
        number: The main metric number (e.g., "5B", "$2.4M", "99.9%")
        subheader: The descriptive text below the number
        output_path: Optional custom output path. If None, saves to output/visuals/

    Returns:
        str: Path to the generated image
    """
    # Get next template in rotation
    template_path = get_next_template()

    if not os.path.exists(template_path):
        raise FileNotFoundError(
            f"Template not found at {template_path}\n"
            "Make sure MC1.png through MC5.png exist in templates/"
        )

    # Load template
    img = Image.open(template_path)
    print(f"Using template: {template_path}")
    draw = ImageDraw.Draw(img)

    # Font paths - try common macOS font locations
    font_paths = [
        "/System/Library/Fonts/Supplemental/Poppins-Bold.ttf",
        "/Library/Fonts/Poppins-Bold.ttf",
        "~/Library/Fonts/Poppins-Bold.ttf",
    ]

    semibold_paths = [
        "/System/Library/Fonts/Supplemental/Poppins-SemiBold.ttf",
        "/Library/Fonts/Poppins-SemiBold.ttf",
        "~/Library/Fonts/Poppins-SemiBold.ttf",
    ]

    # Try to load fonts, fallback to default if not found
    try:
        # Number font - Poppins Bold, size 120
        number_font = None
        for path in font_paths:
            expanded_path = os.path.expanduser(path)
            if os.path.exists(expanded_path):
                number_font = ImageFont.truetype(expanded_path, 120)
                break

        if not number_font:
            print("Warning: Poppins Bold not found, using default font")
            number_font = ImageFont.load_default()

        # Subheader font - Poppins Semibold, size 32
        subheader_font = None
        for path in semibold_paths:
            expanded_path = os.path.expanduser(path)
            if os.path.exists(expanded_path):
                subheader_font = ImageFont.truetype(expanded_path, 32)
                break

        if not subheader_font:
            print("Warning: Poppins Semibold not found, using default font")
            subheader_font = ImageFont.load_default()

    except Exception as e:
        print(f"Font loading error: {e}")
        number_font = ImageFont.load_default()
        subheader_font = ImageFont.load_default()

    # Draw text centered (template is 1200px wide, so center = 600)
    # Number: Y164, centered
    draw.text((600, 164), number, font=number_font, fill="white", anchor="ma")

    # Subheader: Y365, centered
    draw.text((600, 365), subheader, font=subheader_font, fill="white", anchor="ma")

    # Determine output path
    if output_path is None:
        os.makedirs("output/visuals", exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        output_path = f"output/visuals/{timestamp}_metric_card.png"

    # Save the image
    img.save(output_path)
    print(f"Metric card generated: {output_path}")

    return output_path


if __name__ == "__main__":
    # Example usage
    import sys

    if len(sys.argv) < 3:
        print("Usage: python generate_metric_card.py '<number>' '<subheader>'")
        print("\nExample:")
        print("  python generate_metric_card.py '5B' 'Requests processed'")
        print("  python generate_metric_card.py '$2.4M' 'Saved in infrastructure costs'")
        sys.exit(1)

    number = sys.argv[1]
    subheader = sys.argv[2]
    output = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        result = generate_metric_card(number, subheader, output)
        print(f"Success! Generated: {result}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
