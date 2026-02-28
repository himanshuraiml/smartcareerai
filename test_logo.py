from PIL import Image
import sys

img = Image.open('frontend/public/logo-new.png')
img = img.convert('RGBA')

# count pixels by color
from collections import defaultdict
color_counts = defaultdict(int)

for y in range(img.height):
    for x in range(img.width):
        r,g,b,a = img.getpixel((x,y))
        if a > 50:
            color_counts[(r,g,b)] += 1

# summarize colors by rough buckets
buckets = defaultdict(int)
for (r,g,b), count in color_counts.items():
    if r < 50 and g < 50 and b < 50:
        buckets['dark'] += count
    elif r > 200 and g > 200 and b > 200:
        buckets['light'] += count
    else:
        buckets['colored'] += count

total = sum(buckets.values())
if total == 0:
    print("Empty image")
else:
    for k, v in buckets.items():
        print(f"{k}: {v/total*100:.1f}%")
