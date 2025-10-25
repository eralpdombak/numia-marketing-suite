"""
Verify that the metric card generation system is ready to use.
"""

import os
from pathlib import Path


def check_setup():
    """Check if all components are ready."""

    checks = []
    all_ready = True

    # Check 1: Template exists
    template_path = Path("templates/metric-card-template.png")
    if template_path.exists():
        checks.append("✓ Template found at templates/metric-card-template.png")
    else:
        checks.append("✗ Template NOT found - save your template as templates/metric-card-template.png")
        all_ready = False

    # Check 2: Output directory exists
    output_dir = Path("output/visuals")
    if output_dir.exists():
        checks.append("✓ Output directory ready (output/visuals)")
    else:
        checks.append("✗ Output directory missing")
        all_ready = False

    # Check 3: Pillow installed
    try:
        import PIL
        checks.append(f"✓ Pillow installed (version {PIL.__version__})")
    except ImportError:
        checks.append("✗ Pillow not installed - run: pip3 install Pillow")
        all_ready = False

    # Check 4: Fonts installed
    font_dir = Path.home() / "Library" / "Fonts"
    bold_font = font_dir / "Poppins-Bold.ttf"
    semibold_font = font_dir / "Poppins-SemiBold.ttf"

    if bold_font.exists() and semibold_font.exists():
        checks.append("✓ Poppins fonts installed")
    else:
        checks.append("✗ Poppins fonts missing - run: python3 setup_fonts.py")
        all_ready = False

    # Print results
    print("=" * 60)
    print("METRIC CARD GENERATOR - SETUP CHECK")
    print("=" * 60)
    print()

    for check in checks:
        print(check)

    print()
    print("=" * 60)

    if all_ready:
        print("✓ ALL CHECKS PASSED - Ready to generate metric cards!")
        print()
        print("Test it:")
        print('  python3 generate_metric_card.py "5B" "Requests processed"')
    else:
        print("✗ SETUP INCOMPLETE - Follow instructions in templates/SETUP_INSTRUCTIONS.md")

    print("=" * 60)

    return all_ready


if __name__ == "__main__":
    check_setup()
