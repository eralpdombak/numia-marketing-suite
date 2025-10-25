"""
Download and install Poppins fonts for metric card generation.
"""

import os
import requests
import zipfile
from pathlib import Path


def download_poppins_fonts():
    """Download Poppins fonts from Google Fonts."""

    fonts_dir = Path.home() / "Library" / "Fonts"
    fonts_dir.mkdir(parents=True, exist_ok=True)

    print("Downloading Poppins fonts from Google Fonts...")

    # Google Fonts API endpoint for Poppins
    # We need Bold and SemiBold variants
    fonts_to_download = {
        "Poppins-Bold.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf",
        "Poppins-SemiBold.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf",
    }

    for font_name, url in fonts_to_download.items():
        font_path = fonts_dir / font_name

        if font_path.exists():
            print(f"  ✓ {font_name} already installed")
            continue

        try:
            print(f"  Downloading {font_name}...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            with open(font_path, "wb") as f:
                f.write(response.content)

            print(f"  ✓ {font_name} installed successfully")

        except Exception as e:
            print(f"  ✗ Failed to download {font_name}: {e}")

    print(f"\nFonts installed to: {fonts_dir}")
    print("You may need to restart your applications to use the new fonts.")


if __name__ == "__main__":
    try:
        download_poppins_fonts()
    except Exception as e:
        print(f"Error: {e}")
        print("\nAlternative: Download Poppins fonts manually from:")
        print("https://fonts.google.com/specimen/Poppins")
        print(f"And install them to: {Path.home() / 'Library' / 'Fonts'}")
