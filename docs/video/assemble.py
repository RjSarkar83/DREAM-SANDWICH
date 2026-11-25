import json, os, subprocess, time, sys
import imageio_ffmpeg
import cinematic as C

FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 15
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'Dream-Sandwich-Cinematic.mp4')
durs = {int(k): v for k, v in json.load(open('durations.json')).items()}
lens = [max(durs[i] + 1.3, 9.8) for i in range(1, 11)]
total = sum(lens)
print('scene lens', [round(x, 1) for x in lens], 'total %.1fs' % total)

# narration
sil = 'audio/_sil.mp3'
if not os.path.exists(sil):
    subprocess.run([FF, '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '1.4',
                    '-c:a', 'libmp3lame', '-q:a', '9', sil], check=True, capture_output=True)
lst = 'audio/list2.txt'
with open(lst, 'w') as f:
    for i in range(1, 11):
        f.write("file '%s/audio/ch%02d.mp3'\nduration %.3f\n" % (os.getcwd(), i, durs[i]))
        f.write("file '%s/audio/_sil.mp3'\nduration 1.400\n" % os.getcwd())
narr = 'audio/_narr2.m4a'
subprocess.run([FF, '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c:a', 'aac', '-b:a', '176k',
                '-ar', '44100', '-ac', '2', narr], check=True, capture_output=True)
print('narration ok')

cmd = [FF, '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1920x1080', '-r', str(FPS), '-i', '-',
       '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
       '-movflags', '+faststart', '_video2.mp4']
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
t0 = time.time(); n = 0
for si in range(10):
    k = int(round(lens[si] * FPS))
    for j in range(k):
        img = C.frame(si, j / max(1, k - 1))
        proc.stdin.write(img.tobytes()); n += 1
    print('  scene %d done (%.0fs)' % (si + 1, time.time() - t0), flush=True)
proc.stdin.close(); proc.wait()

subprocess.run([FF, '-y', '-i', '_video2.mp4', '-i', narr,
                '-af', 'apad=whole_dur=%.2f' % (total + 0.5),
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '176k',
                '-shortest', '-movflags', '+faststart', OUT], check=True, capture_output=True)
print('✅ %s  %.1f MB  %.1fs' % (OUT, os.path.getsize(OUT) / 1e6, total))
