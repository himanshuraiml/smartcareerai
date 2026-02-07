from PIL import Image, ImageDraw, ImageFont

# Define image size
width, height = 1200, 630
background_color = (11, 15, 25) # Dark blue-black #0B0F19

# Create image
img = Image.new('RGB', (width, height), color=background_color)
draw = ImageDraw.Draw(img)

# Try to load fonts, fallback to default
try:
    # Attempt to load a nice font if available, or fetch one if not (not possible easily)
    # Using default font large size might be tricky without specific fonts
    # We will try 'arial.ttf' which is standard on Windows
    title_font = ImageFont.truetype("arial.ttf", 80)
    subtitle_font = ImageFont.truetype("arial.ttf", 40)
except IOError:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()

# Text content
title_text = "PlaceNxt"
subtitle_text = "Get Placed. Get Ahead."
description_text = "AI-Powered Resume Scoring | Mock Interviews | Skill Badges"

# Calculate text positions for centering
# Note: getsize is deprecated in newer Pillows, using getbbox
def get_text_size(text, font):
    bbox = font.getbbox(text)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

title_w, title_h = get_text_size(title_text, title_font)
subtitle_w, subtitle_h = get_text_size(subtitle_text, subtitle_font)

# Draw Title (Gradient effect simulated with color)
# Just use a nice purple color for now: #8B5CF6 (Violet-500) -> (139, 92, 246)
title_color = (139, 92, 246)
draw.text(((width - title_w) / 2, (height / 2) - 80), title_text, font=title_font, fill=title_color)

# Draw Subtitle (White)
draw.text(((width - subtitle_w) / 2, (height / 2) + 20), subtitle_text, font=subtitle_font, fill=(255, 255, 255))

# Add a simple gradient overlay or accent
# Draw a line below title
line_y = (height / 2) + 80
draw.line([(width/2 - 100, line_y), (width/2 + 100, line_y)], fill=(59, 130, 246), width=4) # Blue accent

# Save image
output_path = r"d:\Coding\SmartCareerAI\frontend\public\og-image.png"
img.save(output_path)
print(f"Image saved to {output_path}")
