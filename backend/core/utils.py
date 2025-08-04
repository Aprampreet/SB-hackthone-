import os
import subprocess
import yt_dlp
from django.conf import settings
import cv2
import numpy as np
import whisper
import uuid
import re


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
"""

def resizing_trimmed_video(input_path: str, yt_id: str, db_id: int) -> str:
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

    return os.path.join("shorts", output_filename)
"""
FILTERS = {
    'grayscale': 'hue=s=0',
    'sepia': 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    'vignette': 'vignette=PI/4',
    'vintage': "curves=r='0/0.2:0.5/0.6:1/0.9':g='0/0.1:0.5/0.5:1/0.8':b='0/0.3:0.5/0.4:1/0.7'",
    'sharpen': 'unsharp=7:7:2.0:7:7:0.0',
    'warm': 'eq=brightness=0.05:contrast=1.1:saturation=1.4',
    'grain': 'noise=alls=20:allf=t+u',
    'my filter': 'eq=contrast=1.2:brightness=0.05, gblur=sigma=10, vignette=angle=PI/4',
    'rainbowglow': 'hue=s=2, curves=preset=strong_contrast, eq=saturation=2.0:brightness=0.05, colorchannelmixer=.9:0:0:0:0:.9:0:0:0:0:.9, gblur=sigma=2',
    'weddingfilm': "eq=contrast=1.05:saturation=1.4:brightness=0.05:gamma=1.1,boxblur=2:1,colorbalance=rs=.3:gs=-.1:bs=-.2,fade=in:0:30,format=yuv420p",
    'lightning': "split[base][flash];[flash]lutyuv=y=val*5,fade=in:0:5:alpha=1,fade=out:5:5:alpha=1[light];[base][light]overlay",
    'y2k_camcorder_look': "curves=preset=cross_process,unsharp=5:5:1.0:5:5:0.0,drawtext=text='JUL 23 2005':x=w-tw-20:y=h-th-20:fontcolor=white@0.8:fontsize=40:box=1:boxcolor=black@0.4",
    'dreamy_bloom': "eq=brightness=0.08:contrast=0.9,unsharp=7:7:-1.5:7:7:-1.5,vignette=angle=1.2",
}

def apply_filter_to_video(input_relative_path: str, filter_name: str) -> str:
    if filter_name not in FILTERS:
        raise ValueError(f"Invalid filter: {filter_name}")

    root = settings.MEDIA_ROOT
    in_path = os.path.join(root, input_relative_path)
    if not os.path.exists(in_path):
        raise FileNotFoundError(f"Input file not found: {in_path}")

    d = os.path.dirname(in_path)
    stem, ext = os.path.splitext(os.path.basename(in_path))
    base_stem = re.sub(r'_filter_.*$', '', stem)

    candidates = [
        os.path.join(d, f"{base_stem}{ext}"),
        os.path.join(root, "temp", f"{base_stem}{ext}")
    ]
    base_path = next((p for p in candidates if os.path.exists(p)), in_path if stem == base_stem else None)
    if not base_path:
        raise FileNotFoundError(f"Could not find base video for '{in_path}'")

    out_dir = os.path.dirname(base_path)
    out_path = os.path.join(out_dir, f"{base_stem}_filter_{filter_name}{ext}")
    if os.path.exists(out_path):  
        return os.path.relpath(out_path, root).replace("\\", "/")
    try:
        for f in os.listdir(out_dir):
            if f.startswith(base_stem + "_filter_"):
                try: os.remove(os.path.join(out_dir, f))
                except: pass
    except FileNotFoundError:
        os.makedirs(out_dir, exist_ok=True)

    graph = FILTERS[filter_name]
    flt_flag = ["-filter_complex", graph] if (';' in graph or ('[' in graph and ']' in graph)) else ["-vf", graph]

    cmd = ["ffmpeg", "-y", "-i", base_path, *flt_flag, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "copy", out_path]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"FFmpeg failed for filter '{filter_name}': {e.stderr.decode(errors='ignore')}") from e

    return os.path.relpath(out_path, root).replace("\\", "/")



def generate_srt_subtitles(input_relative_path: str) -> str:
    root = settings.MEDIA_ROOT
    input_path = os.path.join(root, input_relative_path)
    
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Video not found: {input_path}")

    model = whisper.load_model("base")
    
    result = model.transcribe(input_path)
    
    

    base, ext = os.path.splitext(input_path)
    srt_path = base + ".srt"

    with open(srt_path, "w", encoding="utf-8") as f:
        for i, segment in enumerate(result["segments"]):
            start = segment["start"]
            end = segment["end"]
            text = segment["text"].strip()

            def format_time(t):
                hrs, rem = divmod(t, 3600)
                mins, secs = divmod(rem, 60)
                millis = int((secs - int(secs)) * 1000)
                return f"{int(hrs):02}:{int(mins):02}:{int(secs):02},{millis:03}"
            
            f.write(f"{i+1}\n")
            f.write(f"{format_time(start)} --> {format_time(end)}\n")
            f.write(f"{text}\n\n")

    if not os.path.exists(srt_path):
        raise RuntimeError("Failed to create subtitle file")

    return os.path.relpath(srt_path, root)


def style_subtitles_to_ass_file(subtitles, 
    output_path="subs.ass", 
    font="Impact", 
    fontsize=80, 
    bold=1, 
    color="&H00FF0000"):
   
    def seconds_to_ass_time(seconds):
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int((seconds - int(seconds)) * 100)
        return f"{h}:{m:02}:{s:02}.{cs:02}"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("[Script Info]\n")
        f.write("Title: Styled Subs\n")
        f.write("ScriptType: v4.00+\n")
        f.write("PlayResX: 1080\n")
        f.write("PlayResY: 1920\n\n")

        f.write("[V4+ Styles]\n")
        f.write("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
                "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
                "MarginR, MarginV, Encoding\n")
        f.write(f"Style: Default,{font},{fontsize},{color},&H000000FF,&H00000000,&H64000000,{bold},0,0,0,100,100,0,0,1,3,1,2,30,30,30,1\n\n")

        f.write("[Events]\n")
        f.write("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for sub in subtitles:
            start = seconds_to_ass_time(sub["start"])
            end = seconds_to_ass_time(sub["end"])
            text = sub["text"].replace(",", "\\,")
            f.write(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n")

    print("✅ Styled .ass subtitle file saved at:", output_path)





def burn_subtitles_to_video(input_relative_path:str,srt_relative_path:str,ass_file:str):
    root = settings.MEDIA_ROOT
    input_path = os.path.join(root,input_relative_path)
    srt_path = os.path.join(root, srt_relative_path)

    

    if not os.path.exists(srt_path):
        raise FileNotFoundError(f"SRT subtitle file not found: {srt_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")
    base_name, ext = os.path.splitext(os.path.basename(input_path))
    output_filename = f"{base_name}_subtitled{ext}"
    output_path = os.path.join(os.path.dirname(input_path), output_filename)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-vf", f"ass='{ass_file}'",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "copy",
        output_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    
    return os.path.relpath(output_path, root).replace("\\", "/")



def add_subtitles_to_video(input_relative_path: str ,font: str = "Impact",
    fontsize: int = 80,
    bold: int = 1,
    color: str = "&H00FF0000") -> str:
    root = settings.MEDIA_ROOT
    input_path = os.path.join(root, input_relative_path)

    model = whisper.load_model("base")
    result = model.transcribe(input_path)
    subtitles = result["segments"]

    ass_path = os.path.splitext(input_path)[0] + ".ass"
    style_subtitles_to_ass_file(subtitles=subtitles,
        output_path=ass_path,
        font=font,
        fontsize=fontsize,
        bold=bold,
        color=color)

    subtitled_video_path = burn_subtitles_to_video(input_relative_path, "", ass_file=ass_path)
    os.remove(ass_path)

    return subtitled_video_path
