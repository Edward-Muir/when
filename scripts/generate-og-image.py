#!/usr/bin/env python3
"""Generate OG image for social sharing (1200x630px)."""

from PIL import Image

# Dimensions for OG image
WIDTH = 1200
HEIGHT = 630

# Paths
LOGO_PATH = "public/UpdatedWhenLogo.png"
OUTPUT_PATH = "public/og-image.png"

def main():
    # Load logo
    logo = Image.open(LOGO_PATH).convert("RGBA")

    # Sample background color from top-left corner of the logo
    background_color = logo.getpixel((0, 0))[:3]
    print(f"Sampled background color: RGB{background_color}")

    # Create background with sampled color
    og_image = Image.new("RGB", (WIDTH, HEIGHT), background_color)

    # Calculate position to center the logo
    logo_x = (WIDTH - logo.width) // 2
    logo_y = (HEIGHT - logo.height) // 2

    # Paste logo onto background (using alpha channel as mask)
    og_image.paste(logo, (logo_x, logo_y), logo)

    # Save
    og_image.save(OUTPUT_PATH, "PNG")
    print(f"Generated {OUTPUT_PATH} ({WIDTH}x{HEIGHT})")

if __name__ == "__main__":
    main()
