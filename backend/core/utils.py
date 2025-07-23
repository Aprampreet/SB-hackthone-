import os
import subprocess
import yt_dlp
from django.conf import settings
import cv2
import numpy as np
import whisper
import uuid

def _ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def find_best_start(filepath: str, fps: int = 30):
    model = whisper.load_model("base")
    result = model.transcribe(filepath, verbose=False)
    speech_times = [(int(seg['start']), int(seg['end'])) for seg in result['segments']]


    cap = cv2.VideoCapture(filepath)
    fps = cap.get(cv2.CAP_PROP_FPS) or fps
    frames_diff = []

    ret, prev = cap.read()
    if not ret:
        cap.release()
        return 0

    prev_gray = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        diff = cv2.absdiff(prev_gray, gray)
        frames_diff.append(np.sum(diff))
        prev_gray = gray

    cap.release()

    motion_per_second = []
    frames_per_second = int(fps)
    for i in range(0,len(frames_diff),frames_per_second):
        segment = frames_diff[i:i + frames_per_second]
        motion_per_second.append(np.mean(segment))
    best_score = -1
    best_time = 0

    for sec, motion in enumerate(motion_per_second):
        if any(start <= sec <= end for start, end in speech_times):
            score = motion
            if score > best_score:
                best_score = score
                best_time = sec
    return max(best_time-4,0)


def download_youtube_video(url: str, video_id: int):
    temp_dir = _ensure_dir(os.path.join(settings.MEDIA_ROOT, 'temp'))
    out_template = os.path.join(temp_dir, f"{video_id}_%(id)s.%(ext)s")

    ydl_opts = {
        'format': 'best[height<=480][ext=mp4]',
        'outtmpl': out_template,
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'continuedl': True,
        'retries': 3,
    }


    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(str(url), download=True)
        file_path = ydl.prepare_filename(info)
        return file_path, info.get("title", ""), info.get("id")

def trim_video(input_path: str, yt_id: str, db_id: int, duration: int = 30):
    output_dir = _ensure_dir(os.path.join(settings.MEDIA_ROOT, 'shorts'))
    output_name = f"short_{yt_id}_{db_id}.mp4"
    output_path = os.path.join(output_dir, output_name)

    best_start_time = find_best_start(input_path)

    cmd = [
        "ffmpeg",
        "-y",
        "-ss", str(best_start_time), 
        "-i", input_path,
        "-t", str(duration),
        "-vf", "scale=1280:-2",  
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        if os.path.exists(input_path):
            os.remove(input_path)
    except subprocess.CalledProcessError as e:
        print("FFmpeg trimming error:\n", e.stderr.decode())
        raise e

    return os.path.join("shorts", output_name)



def resizing_trimmed_video(input_path: str, yt_id: str, db_id: int):
    import uuid

    full_input_path = os.path.join(settings.MEDIA_ROOT, input_path)
    output_dir = _ensure_dir(os.path.join(settings.MEDIA_ROOT, 'shorts'))
    temp_output_name = f"resized_temp_{uuid.uuid4().hex[:8]}.mp4"
    temp_output_path = os.path.join(output_dir, temp_output_name)

    final_output_name = f"short_{yt_id}_{db_id}.mp4"
    final_output_path = os.path.join(output_dir, final_output_name)

    cap = cv2.VideoCapture(full_input_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    if width >= height:
        vf_filter = (
            "[0:v]split=2[main][bg];" 
            "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=50:5[bgb];" 
            "[main]scale=1080:1920:force_original_aspect_ratio=decrease[fg];" 

            "[bgb][fg]overlay=(W-w)/2:(H-h)/2," 
            "format=yuv420p" 
        )
    else:
        vf_filter = "scale=1080:1920,format=yuv420p"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", full_input_path,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "copy", 
        temp_output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)

        os.remove(full_input_path)
        os.rename(temp_output_path, final_output_path)

    except subprocess.CalledProcessError as e:
        print("FFmpeg resize error:\n", e.stderr.decode())
        raise e

    return os.path.join("shorts", final_output_name)


#for vertically stretched viedo 
"""def resizing_trimmed_video(input_path: str, yt_id: str, db_id: int) -> str:
    output_dir = _ensure_dir(os.path.join(settings.MEDIA_ROOT, "shorts"))
    output_filename = f"short_{yt_id}_{db_id}.mp4"
    final_output_path = os.path.join(output_dir, output_filename)

    temp_output_path = os.path.join(output_dir, f"resized_temp_{uuid.uuid4().hex[:8]}.mp4")

    crop_expr = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", os.path.join(settings.MEDIA_ROOT, input_path),
        "-vf", crop_expr,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        temp_output_path
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        os.replace(temp_output_path, final_output_path) 
    except subprocess.CalledProcessError as e:
        print("FFmpeg resize error:\n", e.stderr.decode())
        raise e

    return os.path.join("shorts", output_filename)"""


# In utls.py

def apply_filter_to_video(input_relative_path: str, filter_name: str) -> str:
    filter_map = {
    'grayscale': 'hue=s=0',
    'sepia': 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    'vignette': 'vignette=PI/4',
    'vintage': (
        "curves=r='0/0.2:0.5/0.6:1/0.9':"
        "g='0/0.1:0.5/0.5:1/0.8':"
        "b='0/0.3:0.5/0.4:1/0.7'"
    ),
    'sharpen': 'unsharp=7:7:2.0:7:7:0.0',
    'warm': 'eq=brightness=0.05:contrast=1.1:saturation=1.4',
    'grain': 'noise=alls=20:allf=t+u',
    'my filter':'eq=contrast=1.2:brightness=0.05, gblur=sigma=10, vignette=angle=PI/4',
    'rainbowglow': 'hue=s=2, curves=preset=strong_contrast, eq=saturation=2.0:brightness=0.05, colorchannelmixer=.9:0:0:0:0:.9:0:0:0:0:.9, gblur=sigma=2',
    'weddingfilm': (
        "eq=contrast=1.05:saturation=1.4:brightness=0.05:gamma=1.1,"
        "boxblur=2:1,"
        "colorbalance=rs=.3:gs=-.1:bs=-.2,"
        "fade=in:0:30,"
        "format=yuv420p"
    ),
    'lightning': (
        "split[base][flash];"
        "[flash]lutyuv=y=val*5,fade=in:0:5:alpha=1,fade=out:5:5:alpha=1[light];"
        "[base][light]overlay"
    ),
   'y2k_camcorder_look': (
    "curves=preset=cross_process,"
    "unsharp=5:5:1.0:5:5:0.0,"
    "drawtext="
    "text='JUL 23 2005':"
    "x=w-tw-20:y=h-th-20:"
    "fontcolor=white@0.8:"
    "fontsize=40:"
    "box=1:boxcolor=black@0.4"
),
'dreamy_bloom': (
    "eq=brightness=0.08:contrast=0.9,"
    "unsharp=7:7:-1.5:7:7:-1.5,"
    "vignette=angle=1.2"
)


}


    if filter_name not in filter_map:
        raise ValueError(f"Invalid filter: {filter_name}")

    full_input_path = os.path.join(settings.MEDIA_ROOT, input_relative_path)

    output_dir = os.path.dirname(full_input_path)

    original_filename, ext = os.path.splitext(os.path.basename(full_input_path))



    if "_filter_" in original_filename:
        original_filename = original_filename.split("_filter_")[0]
        original_file_path = os.path.join(output_dir, f"{original_filename}{ext}")
        full_input_path = original_file_path
    else:
        original_file_path = full_input_path


    for fname in os.listdir(output_dir):
        if fname.startswith(original_filename + "_filter_"):
            try:
                os.remove(os.path.join(output_dir, fname))
            except Exception as e:
                print("Failed to delete previous filtered file:", e)


    output_filename = f"{original_filename}_filter_{filter_name}{ext}"
    full_output_path = os.path.join(output_dir, output_filename)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", full_input_path,
        "-vf", filter_map[filter_name],
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "copy",
        full_output_path
    ]

    
    subprocess.run(cmd, check=True, capture_output=True)
    

    return os.path.join("shorts", output_filename)