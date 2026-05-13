import json
import os

content_path = r'c:\Users\anony\OneDrive\Desktop\ruhgen1 - Copy\backend\data\site-content.json'
homepage_dir = r'c:\Users\anony\OneDrive\Desktop\ruhgen1 - Copy\public\media\homepage'

with open(content_path, 'r') as f:
    data = json.load(f)

# Get existing media IDs to avoid duplicates
existing_ids = {m['id'] for m in data.get('heroBackground', {}).get('media', [])}

new_media = []
files = os.listdir(homepage_dir)

for filename in files:
    if filename.endswith(('.jpg', '.png', '.mp4', '.jpeg', '.webp')):
        media_id = f"hb-hp-{filename.split('.')[0]}"
        if media_id not in existing_ids:
            media_type = 'video' if filename.endswith('.mp4') else 'image'
            new_media.append({
                "id": media_id,
                "type": media_type,
                "src": f"/media/homepage/{filename}",
                "filename": filename
            })

if 'heroBackground' not in data:
    data['heroBackground'] = {"media": [], "overlayOpacity": 0.55, "crossfadeDuration": 6, "staggerDelay": 0.8, "enableParallax": True, "parallaxIntensity": 10}

data['heroBackground']['media'].extend(new_media)

with open(content_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Added {len(new_media)} items to heroBackground.media")
