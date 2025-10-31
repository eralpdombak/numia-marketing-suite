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


def get_template():
    """Get the MC template"""
    return "templates/MC.png"


def generate_metric_card(number: str, subheader: str, output_path: str = None):
    """
    Generate a metric card with the specified header and subheader.

    Args:
        number: The main header text (e.g., "Real-time", "5B", "$2.4M", "Zero trust")
        subheader: The descriptive text below the header
        output_path: Optional custom output path. If None, saves to output/visuals/

    Returns:
        str: Path to the generated image
    """
    # Get template
    template_path = get_template()

    if not os.path.exists(template_path):
        raise FileNotFoundError(
            f"Template not found at {template_path}\n"
            "Make sure MC.png exists in templates/"
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
        # Start with a size based on length as initial guess
        # Optimized for both text and numbers - professional sizing
        if len(number) > 30:
            main_font_size = 65
        elif len(number) > 25:
            main_font_size = 75
        elif len(number) > 20:
            main_font_size = 85
        elif len(number) > 16:
            main_font_size = 100
        elif len(number) > 12:
            main_font_size = 120
        elif len(number) > 10:
            main_font_size = 140
        elif len(number) > 8:
            main_font_size = 155
        elif len(number) > 6:
            main_font_size = 175
        elif len(number) > 4:
            main_font_size = 190
        else:
            main_font_size = 205

        # Load font with initial size
        number_font = None
        for path in font_paths:
            expanded_path = os.path.expanduser(path)
            if os.path.exists(expanded_path):
                number_font = ImageFont.truetype(expanded_path, main_font_size)
                break

        if not number_font:
            print("Warning: Poppins Bold not found, using default font")
            number_font = ImageFont.load_default()

        # Check actual width and shrink if needed (1200px canvas, leave 120px margin on each side for comfort)
        max_width = 960
        temp_y = 160  # Use same Y position as final placement
        bbox = draw.textbbox((600, temp_y), number, font=number_font, anchor="ma")
        text_width = bbox[2] - bbox[0]

        # If too wide, shrink font until it fits comfortably
        while text_width > max_width and main_font_size > 50:
            main_font_size -= 5
            for path in font_paths:
                expanded_path = os.path.expanduser(path)
                if os.path.exists(expanded_path):
                    number_font = ImageFont.truetype(expanded_path, main_font_size)
                    break
            bbox = draw.textbbox((600, temp_y), number, font=number_font, anchor="ma")
            text_width = bbox[2] - bbox[0]

        # Dynamic positioning for consistency
        # Start header at a fixed position (higher on canvas)
        main_y_pos = 165

        # Calculate actual height of header text
        header_bbox = draw.textbbox((600, main_y_pos), number, font=number_font, anchor="ma")
        header_bottom = header_bbox[3]  # Bottom edge of header text

        # Subheader font - dynamic sizing based on subheader length
        # Professional sizing for readability
        if len(subheader) > 35:
            subheader_size = 34
        elif len(subheader) > 28:
            subheader_size = 38
        elif len(subheader) > 22:
            subheader_size = 42
        elif len(subheader) > 18:
            subheader_size = 46
        elif len(subheader) > 12:
            subheader_size = 50
        else:
            subheader_size = 54

        subheader_font = None
        for path in semibold_paths:
            expanded_path = os.path.expanduser(path)
            if os.path.exists(expanded_path):
                subheader_font = ImageFont.truetype(expanded_path, subheader_size)
                break

        if not subheader_font:
            print("Warning: Poppins Semibold not found, using default font")
            subheader_font = ImageFont.load_default()

        # Calculate gap based on header size for visual consistency
        # Tighter spacing while ensuring no overlap through bbox calculations
        if main_font_size > 150:
            gap = 40
        elif main_font_size > 120:
            gap = 36
        elif main_font_size > 90:
            gap = 32
        else:
            gap = 30

        # Get subheader height to position it properly
        temp_sub_bbox = draw.textbbox((0, 0), subheader, font=subheader_font, anchor="ma")
        subheader_half_height = (temp_sub_bbox[3] - temp_sub_bbox[1]) / 2

        # Position subheader: header_bottom + gap + half of subheader height
        sub_y_pos = header_bottom + gap + subheader_half_height

    except Exception as e:
        print(f"Font loading error: {e}")
        number_font = ImageFont.load_default()
        subheader_font = ImageFont.load_default()
        main_y_pos = 164
        sub_y_pos = 365

    # Draw text centered (template is 1200px wide, so center = 600)
    draw.text((600, main_y_pos), number, font=number_font, fill="white", anchor="ma")
    draw.text((600, sub_y_pos), subheader, font=subheader_font, fill="white", anchor="ma")

    # Determine output path
    if output_path is None:
        os.makedirs("output/visuals", exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S%f")
        output_path = f"output/visuals/{timestamp}_metric_card.png"

    # Save the image
    img.save(output_path)
    print(f"Metric card generated: {output_path}")

    return output_path


if __name__ == "__main__":
    # Example usage
    import sys

    if len(sys.argv) < 3:
        print("Usage: python generate_metric_card.py '<header>' '<subheader>'")
        print("\nExamples:")
        print("  python generate_metric_card.py '5B' 'Requests processed'")
        print("  python generate_metric_card.py 'Real-time' 'Not eventually'")
        print("  python generate_metric_card.py 'Zero trust' 'For good reason'")
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
