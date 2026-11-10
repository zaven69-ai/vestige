"""Encode CPU-rendered GLB frames into small local review videos and a contact sheet."""
from pathlib import Path
import subprocess,argparse,tempfile
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[4]
parser=argparse.ArgumentParser();parser.add_argument('--frames',default=str(Path(tempfile.gettempdir())/'vestige-catia-revision2-frames'));parser.add_argument('--output',default=str(ROOT/'docs/avatars/catia/revision-2'));args=parser.parse_args()
FRAMES=Path(args.frames);OUT=Path(args.output);OUT.mkdir(parents=True,exist_ok=True)
log=Path(tempfile.gettempdir())/'vestige-catia-review-encoding.log'
with log.open('w') as stream:
 for name,count in [('idle',90),('walk',36),('run',24)]:
  target=OUT/(name+'-review.mp4')
  if target.exists():raise RuntimeError('Review video exists; preserve it before regenerating')
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-stream_loop','2','-framerate','30','-i',str(FRAMES/name/'%03d.png'),'-frames:v',str(count*3),'-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],stdout=stream,stderr=stream,check=True)
  print(name,target.stat().st_size,'bytes')
canvas=Image.new('RGB',(6*180,3*266),'#0B1B3D');draw=ImageDraw.Draw(canvas)
for row,(name,count) in enumerate([('idle',90),('walk',36),('run',24)]):
 for column in range(6):
  index=round(column*count/6)%count;image=Image.open(FRAMES/name/f'{index:03d}.png').convert('RGB');image.thumbnail((180,240));canvas.paste(image,(column*180,row*266+26));draw.text((column*180+8,row*266+7),f'{name} {round(column*100/6)}%',fill='white')
canvas.save(OUT/'review-strip.jpg',quality=90)
