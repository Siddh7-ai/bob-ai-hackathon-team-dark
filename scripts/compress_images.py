import os
from PIL import Image

public_dir = r"c:\Users\Raulji Siddharthsinh\OneDrive\Desktop\CHARUSAT\IBM\hums-predictive-maintenance\frontend\public"

def get_dir_size(path):
    total = 0
    for root, _, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            total += os.path.getsize(fp)
    return total

print("Original size:", get_dir_size(public_dir) / (1024 * 1024), "MB")

# 1. Favicon resize
fav_path = os.path.join(public_dir, "favicon.png")
if os.path.exists(fav_path):
    with Image.open(fav_path) as img:
        img = img.resize((128, 128), Image.Resampling.LANCZOS)
        img.save(fav_path, "PNG", optimize=True)

# 2. Main PNGs in public_dir
png_files = ["IAF_logo.png", "iaf_fighter_jet_clean.png", "iaf_jet_only.png", "iaf_jet_reference.png", "iaf_jet_smoke.png"]
for fname in png_files:
    fp = os.path.join(public_dir, fname)
    if os.path.exists(fp):
        with Image.open(fp) as img:
            # Maintain aspect ratio if huge
            if img.width > 1200:
                h = int(img.height * (1200 / img.width))
                img = img.resize((1200, h), Image.Resampling.LANCZOS)
            img.save(fp, "PNG", optimize=True)

# 3. Assets images in public_dir/images/assets
assets_dir = os.path.join(public_dir, "images", "assets")
if os.path.exists(assets_dir):
    for f in os.listdir(assets_dir):
        if f.lower().endswith((".jpg", ".jpeg", ".png")):
            fp = os.path.join(assets_dir, f)
            with Image.open(fp) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                if img.width > 800:
                    h = int(img.height * (800 / img.width))
                    img = img.resize((800, h), Image.Resampling.LANCZOS)
                img.save(fp, "JPEG", quality=75, optimize=True)

print("Optimized size:", get_dir_size(public_dir) / (1024 * 1024), "MB")
