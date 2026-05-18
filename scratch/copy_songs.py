import os
import re
import shutil
import json

songs_src_dir = "/home/ravel/Documents/CODES/songo/songs"
songs_dest_dir = "/home/ravel/Documents/CODES/songo/android/app/src/main/res/raw"
json_dest_path = "/home/ravel/Documents/CODES/songo/src/assets/songsList.json"

# 1. Ensure source and destination directories exist
os.makedirs(songs_src_dir, exist_ok=True)
os.makedirs(songs_dest_dir, exist_ok=True)

# 2. Clear old files in raw destination directory to prevent build conflicts
if os.path.exists(songs_dest_dir):
    for filename in os.listdir(songs_dest_dir):
        file_path = os.path.join(songs_dest_dir, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")

# Supported audio formats
AUDIO_EXTENSIONS = ('.mp3', '.wav', '.ogg', '.m4a', '.aac')

# Helper to sanitize filename to meet Android resource naming conventions:
# [a-z0-9_]+ (only lowercase, digits, and underscores, must start with letter/underscore)
def sanitize_android_resource_name(filename):
    name, ext = os.path.splitext(filename)
    
    # Convert to lowercase
    sanitized = name.lower()
    
    # Replace spaces, hyphens, and non-alphanumeric chars with underscores
    sanitized = re.sub(r'[^a-z0-9_]', '_', sanitized)
    
    # Remove leading numbers or double underscores
    sanitized = re.sub(r'^[^a-z_]+', '', sanitized)
    sanitized = re.sub(r'_+', '_', sanitized)
    
    # Ensure it's not empty, fallback if it was entirely stripped
    if not sanitized:
        sanitized = "songo_music"
        
    return sanitized + ext.lower()

# 3. Process and copy files
songs_list = []
copied_count = 0

for filename in os.listdir(songs_src_dir):
    if filename.lower().endswith(AUDIO_EXTENSIONS):
        src_path = os.path.join(songs_src_dir, filename)
        sanitized_name = sanitize_android_resource_name(filename)
        dest_path = os.path.join(songs_dest_dir, sanitized_name)
        
        try:
            shutil.copy2(src_path, dest_path)
            # Add to the JSON list (without extension, which react-native-sound expects for Android resources)
            resource_name = os.path.splitext(sanitized_name)[0]
            songs_list.append(resource_name)
            copied_count += 1
            print(f"Successfully processed: '{filename}' -> '{sanitized_name}'")
        except Exception as e:
            print(f"Error copying {filename}: {e}")

# 4. Write the JSON list for React Native
# Create parent directory of JSON path if it doesn't exist
os.makedirs(os.path.dirname(json_dest_path), exist_ok=True)

with open(json_dest_path, 'w', encoding='utf-8') as f:
    json.dump(songs_list, f, indent=2, ensure_ascii=False)

print(f"\nSongs List compilation finished!")
print(f"Total songs copied: {copied_count}")
print(f"JSON compiled at: {json_dest_path}")
print(f"Songs in list: {songs_list}")
