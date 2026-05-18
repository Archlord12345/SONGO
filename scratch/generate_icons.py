import os
from PIL import Image, ImageDraw

# Calculate dynamic paths relative to the project root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Use the developer high-res local logo if present, fallback to the checked-in logo on CI builds
local_highres_path = "/home/ravel/.gemini/antigravity/brain/fdfbafd8-f896-45ad-8c91-718e605d9955/songo_logo_1779105972480.png"
if os.path.exists(local_highres_path):
    logo_path = local_highres_path
else:
    logo_path = os.path.join(project_root, "src", "assets", "logo.png")

assets_dir = os.path.join(project_root, "src", "assets")
res_dir = os.path.join(project_root, "android", "app", "src", "main", "res")

# Ensure assets dir exists
os.makedirs(assets_dir, exist_ok=True)

# 1. Save original logo to assets for the loading screen
img = Image.open(logo_path).convert("RGBA")
img.save(os.path.join(assets_dir, "logo.png"))
print("Saved logo.png to assets")

# 2. Extract perfect circular coin from the 1024x1024 image
# We will create a circular mask centered at (512, 512)
width, height = img.size # 1024x1024
center_x, center_y = width // 2, height // 2

# We set the radius of the Songo board to crop out all black background
# 445 is about 87% of 512, which matches the circular wood board golden frame perfectly
radius = 445 

# Create mask
mask = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((center_x - radius, center_y - radius, center_x + radius, center_y + radius), fill=255)

# Paste the logo onto a transparent canvas using the circular mask
clean_circle = Image.new("RGBA", (width, height), (0, 0, 0, 0))
clean_circle.paste(img, (0, 0), mask=mask)

# Crop to the bounding box of the circle (a 890x890 image)
crop_box = (center_x - radius, center_y - radius, center_x + radius, center_y + radius)
cropped_circle = clean_circle.crop(crop_box)

# 3. Create the final transparent icon
# To prevent Android launcher from clipping the golden edges, we add a tiny transparent padding (e.g. 8%)
def make_launcher_icon(size, dest_path):
    # Create a blank transparent canvas of the requested size
    icon_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Calculate the size of the circular coin inside the canvas (e.g. 92% of the canvas size)
    coin_size = int(size * 0.92)
    
    # Resize the clean circular board to coin_size
    resized_coin = cropped_circle.resize((coin_size, coin_size), Image.Resampling.LANCZOS)
    
    # Center the resized coin onto the icon canvas
    offset = (size - coin_size) // 2
    icon_canvas.paste(resized_coin, (offset, offset), mask=resized_coin.split()[3])
    
    # Save as PNG
    icon_canvas.save(dest_path, "PNG")
    print(f"Saved transparent launcher icon of size {size} to {dest_path}")

# Android launcher sizes
sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

for folder, size in sizes.items():
    folder_path = os.path.join(res_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # For both ic_launcher.png and ic_launcher_round.png, we now use the transparent circular coin!
    # This prevents Android from showing any square corners or white background boxes.
    make_launcher_icon(size, os.path.join(folder_path, "ic_launcher.png"))
    make_launcher_icon(size, os.path.join(folder_path, "ic_launcher_round.png"))

print("All transparent icons successfully generated!")
