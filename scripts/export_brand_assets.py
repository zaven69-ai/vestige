"""Export native sizes from the original logo, without cropping or recoloring.
Optional build-time tool: Python 3 + Pillow. Generated assets are committed.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/brand/vestige-logo.png'
original_bytes = SOURCE.read_bytes()
source = Image.open(SOURCE).convert('RGB')
def export(name, canvas_size, max_image_size, transparent=False):
    image = source.copy()
    image.thumbnail((max_image_size,max_image_size), Image.Resampling.LANCZOS)
    mode = 'RGBA' if transparent else 'RGB'
    background = (255,255,255,0) if transparent else (255,255,255)
    canvas = Image.new(mode,(canvas_size,canvas_size),background)
    offset=((canvas_size-image.width)//2,(canvas_size-image.height)//2)
    canvas.paste(image,offset)
    target = ROOT / 'assets/brand' / name
    canvas.save(target,optimize=True)
    return {'path':str(target.relative_to(ROOT)),'canvas':[canvas_size,canvas_size],'content':[image.width,image.height],'offset':list(offset),'mode':mode,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
exports = [export('app-icon-1024.png',1024,1024),export('android-adaptive-foreground.png',1024,640,True),export('favicon-64.png',64,64)]
assert SOURCE.read_bytes()==original_bytes
manifest={'source':'assets/brand/vestige-logo.png','sourceSize':list(source.size),'sourceSha256':hashlib.sha256(original_bytes).hexdigest(),'operations':'Proportional downsampling and padding only. Original white background retained. No cropping, redraw, recoloring or background removal.','exports':exports,'splash':'Uses the original source directly with Expo resizeMode=contain.'}
(ROOT/'assets/brand/exports.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
