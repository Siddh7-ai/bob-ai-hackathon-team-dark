import os
from PIL import Image

public_dir = r"c:\Users\Raulji Siddharthsinh\OneDrive\Desktop\CHARUSAT\IBM\hums-predictive-maintenance\frontend\public"

# IAF_logo.png - max width 400px
logo_path = os.path.join(public_dir, "IAF_logo.png")
if os.path.exists(logo_path):
    with Image.open(logo_path) as img:
        if img.width > 400:
            h = int(img.height * (400 / img.width))
            img = img.resize((400, h), Image.Resampling.LANCZOS)
        img.save(logo_path, "PNG", optimize=True)

# iaf_fighter_jet_clean.png - max width 800px
jet_clean = os.path.join(public_dir, "iaf_fighter_jet_clean.png")
if os.path.exists(jet_clean):
    with Image.open(jet_clean) as img:
        if img.width > 800:
            h = int(img.height * (800 / img.width))
            img = img.resize((800, h), Image.Resampling.LANCZOS)
        img.save(jet_clean, "PNG", optimize=True)

# iaf_jet_smoke.png & iaf_jet_reference.png - max width 600px
for fname in ["iaf_jet_smoke.png", "iaf_jet_reference.png", "iaf_jet_only.png"]:
    fp = os.path.join(public_dir, fname)
    if os.path.exists(fp):
        with Image.open(fp) as img:
            if img.width > 600:
                h = int(img.height * (600 / img.width))
                img = img.resize((600, h), Image.Resampling.LANCZOS)
            img.save(fp, "PNG", optimize=True)

def get_dir_size(path):
    total = 0
    for root, _, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            total += os.path.getsize(fp)
    return total

print("Final optimized public directory size:", round(get_dir_size(public_dir) / (1024 * 1024), 2), "MB")
