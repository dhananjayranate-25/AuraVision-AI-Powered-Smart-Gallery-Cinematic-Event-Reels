import os
import uuid
import shutil
from typing import List, Optional, Dict
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from bson import ObjectId

from database import get_database

router = APIRouter(prefix="/reels", tags=["reels"])

REELS_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "reels")
os.makedirs(REELS_DIR, exist_ok=True)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

# Global dictionary to store task progress
task_progress: Dict[str, Dict] = {}

import urllib.request
import ytmusicapi
import yt_dlp

ytmusic = ytmusicapi.YTMusic()

@router.get("/search_music")
async def search_music(q: str):
    try:
        results = ytmusic.search(q, filter="videos", limit=10)
        formatted = []
        for r in results:
            if r.get('videoId'):
                formatted.append({
                    "videoId": r['videoId'],
                    "title": r.get('title', 'Unknown Title'),
                    "artist": r['artists'][0]['name'] if r.get('artists') else 'Unknown Artist',
                    "thumbnail": r['thumbnails'][-1]['url'] if r.get('thumbnails') else None
                })
        return {"results": formatted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream_music/{video_id}")
async def stream_music(video_id: str):
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            return {"url": info['url'], "duration": info.get('duration', 0)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def start_reel_generation(
    background_tasks: BackgroundTasks,
    media_ids: str = Form(...),
    audio: UploadFile = File(None),
    audio_url: str = Form(None),
    youtube_id: Optional[str] = Form(None),
    quality: str = Form("720p"),
    style: str = Form("beat_sync"),
    audio_start_time: float = Form(0.0),
    reel_duration: float = Form(15.0)
):
    """
    Starts reel generation in the background and returns a task_id for polling.
    """
    task_id = str(uuid.uuid4())
    task_progress[task_id] = {"status": "processing", "progress": 0, "reel_url": None, "error": None}
    
    # Save audio to temp file if uploaded
    temp_audio_path = None
    if audio:
        temp_audio_path = os.path.join(REELS_DIR, f"temp_{task_id}.mp3")
        with open(temp_audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
            
    from database import get_database
    from bson import ObjectId
    
    db = get_database()
    ids_list = [mid.strip() for mid in media_ids.split(",") if mid.strip()]
    if not ids_list:
        raise HTTPException(status_code=400, detail="No media IDs provided.")

    cursor = db.media.find({"_id": {"$in": [ObjectId(mid) for mid in ids_list]}})
    media_docs = await cursor.to_list(length=100)
    media_docs.sort(key=lambda x: ids_list.index(str(x["_id"])))
    
    image_paths = []
    for doc in media_docs:
        file_path = os.path.join(UPLOAD_DIR, os.path.basename(doc["s3_url"]))
        if os.path.exists(file_path):
            image_paths.append(file_path)
            
    if not image_paths:
        raise HTTPException(status_code=400, detail="No valid images found on disk.")
        
    background_tasks.add_task(
        generate_reel_task, 
        task_id, 
        image_paths, 
        temp_audio_path, 
        audio_url, 
        youtube_id, 
        quality,
        style,
        audio_start_time, 
        reel_duration
    )
    
    return JSONResponse({"task_id": task_id, "message": "Generation started"})

@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    if task_id not in task_progress:
        raise HTTPException(status_code=404, detail="Task not found")
    return JSONResponse(task_progress[task_id])


def generate_reel_task(
    task_id: str,
    image_paths: list,
    temp_audio_path: Optional[str],
    audio_url: Optional[str],
    youtube_id: Optional[str],
    quality: str,
    style: str,
    audio_start_time: float,
    reel_duration: float
):
    """
    Actual background task for generating the reel.
    """
    try:
        from moviepy.editor import ImageClip, concatenate_videoclips, AudioFileClip, ColorClip, CompositeVideoClip
        import numpy as np
        from PIL import Image
        from proglog import ProgressBarLogger
        import random
        import math
    except ImportError as e:
        task_progress[task_id]["status"] = "error"
        task_progress[task_id]["error"] = f"Missing libraries: {e}"
        return

    # 1. Handle Audio
    if not temp_audio_path:
        temp_audio_path = os.path.join(REELS_DIR, f"temp_{uuid.uuid4()}.mp3")
        
        if youtube_id:
            try:
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': temp_audio_path,
                    'noplaylist': True,
                    'quiet': True,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([f"https://www.youtube.com/watch?v={youtube_id}"])
            except Exception as e:
                task_progress[task_id]["status"] = "error"
                task_progress[task_id]["error"] = f"Failed to download from YouTube: {str(e)}"
                return
        elif audio_url:
            try:
                # Add User-Agent because some APIs block default urllib user agents
                req = urllib.request.Request(audio_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response, open(temp_audio_path, 'wb') as out_file:
                    shutil.copyfileobj(response, out_file)
            except Exception as e:
                task_progress[task_id]["status"] = "error"
                task_progress[task_id]["error"] = f"Failed to download audio from URL: {str(e)}"
                return
        else:
            # Fallback to a default if provided
            task_progress[task_id]["status"] = "error"
            task_progress[task_id]["error"] = "Audio file, YouTube ID, or URL is required."
            return

    try:
        # 1. Analyze Audio Beats
        import wave
        import numpy as np
        
        # We need a .wav file for built-in python wave module.
        # Moviepy's AudioFileClip can convert mp3 to wav.
        from moviepy.editor import AudioFileClip
        audio_clip = AudioFileClip(temp_audio_path)
        
        # Trim audio based on user inputs
        # Cap duration to the remaining length of the audio file to avoid errors
        actual_duration = min(reel_duration, audio_clip.duration - audio_start_time)
        if actual_duration <= 0:
            actual_duration = min(15.0, audio_clip.duration)
            audio_start_time = 0.0
            
        audio_clip = audio_clip.subclip(audio_start_time, audio_start_time + actual_duration)
        
        temp_wav_path = os.path.join(REELS_DIR, f"temp_{uuid.uuid4()}.wav")
        audio_clip.write_audiofile(temp_wav_path, fps=22050, nbytes=2, buffersize=2000, logger=None)
        
        beat_times = []
        try:
            with wave.open(temp_wav_path, 'rb') as wf:
                framerate = wf.getframerate()
                nframes = wf.getnframes()
                audio_data = wf.readframes(nframes)
                
            # Convert binary data to numpy array
            signal = np.frombuffer(audio_data, dtype=np.int16)
            
            # If stereo, average to mono
            if wf.getnchannels() == 2:
                signal = signal.reshape(-1, 2).mean(axis=1)
                
            # Compute energy envelope
            window_size = int(framerate * 0.1)  # 100ms window
            # Use sum of absolute values for speed
            envelope = np.abs(signal)
            
            # Simple moving average for envelope
            weights = np.ones(window_size) / window_size
            envelope = np.convolve(envelope, weights, mode='valid')
            
            # Find peaks in envelope (beats)
            # Threshold: must be higher than mean + 1.5 * std
            mean_env = np.mean(envelope)
            std_env = np.std(envelope)
            threshold = mean_env + 1.5 * std_env
            
            # Find local maxima
            peaks = []
            min_dist = int(framerate * 0.3)  # Min 300ms between beats (max ~200 BPM)
            last_peak = -min_dist
            
            for i in range(1, len(envelope) - 1):
                if envelope[i] > threshold and envelope[i] > envelope[i-1] and envelope[i] > envelope[i+1]:
                    if i - last_peak > min_dist:
                        peaks.append(i)
                        last_peak = i
                        
            # Convert frame indices to seconds
            # Note: envelope is shorter by window_size - 1, so offset by window_size // 2
            offset = window_size // 2
            beat_times = [(p + offset) / framerate for p in peaks]
            
        finally:
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
                
        if len(beat_times) < 2:
            # Fallback to fake beats if detection fails
            video_dur = audio_clip.duration
            beat_times = list(np.arange(0, video_dur, 1.5))
            
        # 2. Dynamic Pacing and Transitions
        from moviepy.editor import vfx
        clips = []
        
        # Set target resolution based on quality option
        if quality == "1080p":
            TARGET_W, TARGET_H = 1080, 1920
        elif quality == "480p":
            TARGET_W, TARGET_H = 480, 854
        else:
            TARGET_W, TARGET_H = 720, 1280
        
        def resize_and_crop(img_path):
            """Resizes and center-crops an image to fill the 9:16 target resolution."""
            img = Image.open(img_path)
            img_w, img_h = img.size
            target_ratio = TARGET_W / TARGET_H
            img_ratio = img_w / img_h
            
            if img_ratio > target_ratio:
                # Image is wider than target, scale to match height, crop width
                new_h = TARGET_H
                new_w = int(TARGET_H * img_ratio)
            else:
                # Image is taller than target, scale to match width, crop height
                new_w = TARGET_W
                new_h = int(TARGET_W / img_ratio)
                
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Center crop
            left = (new_w - TARGET_W) / 2
            top = (new_h - TARGET_H) / 2
            right = (new_w + TARGET_W) / 2
            bottom = (new_h + TARGET_H) / 2
            
            img = img.crop((left, top, right, bottom))
            return np.array(img)

        # Plan clip durations based on beats
        max_reel_duration = min(audio_clip.duration, reel_duration)
        clip_plan = [] # list of (duration, is_fast)
        
        current_time = 0.0
        
        if style == "basic":
            # Fixed 1.5 second intervals (with 0.5s overlaps) completely ignoring beats
            while current_time < max_reel_duration - 0.1:
                clip_plan.append((1.5, False))
                current_time += 1.5 - 0.5 # subtract the overlap duration
        else:
            b_idx = 0
            while current_time < max_reel_duration and b_idx < len(beat_times) - 1:
                next_beat = beat_times[b_idx + 1]
                interval = next_beat - beat_times[b_idx]
                
                if interval > 1.2:
                    # Silent/Slow section detected -> Subdivide into 4 rapid micro-beats
                    micro_interval = interval / 4.0
                    for _ in range(4):
                        clip_plan.append((micro_interval, True))
                    current_time += interval
                    b_idx += 1
                elif interval < 0.6:
                    # Fast pacing -> Change photo exactly on EVERY beat!
                    clip_plan.append((interval, True))
                    current_time += interval
                    b_idx += 1
                else:
                    # Normal pacing -> Change photo on every beat but mark it as slow transition
                    clip_plan.append((interval, False))
                    current_time += interval
                    b_idx += 1

            # If we ran out of beats before reaching max_reel_duration, fill the rest with fake beats
            while current_time < max_reel_duration - 0.1:
                remaining = max_reel_duration - current_time
                duration = min(1.5, remaining)
                if duration < 0.1:
                    break
                clip_plan.append((duration, False))
                current_time += duration

        # Easing helpers for smooth, professional movement
        def ease_out_cubic(t):
            return 1 - pow(1 - t, 3)
            
        def ease_in_out_quad(t):
            return 2 * t * t if t < 0.5 else 1 - pow(-2 * t + 2, 2) / 2

        # Build moviepy clips looping through available media
        img_idx = 0
        for duration, is_fast in clip_plan:
            img_path = image_paths[img_idx % len(image_paths)]
            img_idx += 1
            
            img_array = resize_and_crop(img_path)
            clip = ImageClip(img_array).set_duration(duration)
            
            # Apply clean, high-quality cinematic transitions based on pacing
            safe_duration = max(duration, 0.001)
            
            if style == "basic":
                # Static image with a smooth crossfade transition (much faster processing)
                if len(clips) > 0:
                    clip = clip.crossfadein(0.5)
                clips.append(clip)
                continue

            effect = random.choice([
                "pan_left", 
                "pan_right", 
                "bounce_beat",
                "pulse"
            ])
            
            def apply_cinematic_effect(clp, effect_type):
                def filter_frame(get_frame, t):
                    frame = get_frame(t)
                    progress = t / safe_duration
                    
                    if effect_type == "pan_left":
                        scale = 1.15
                        shift_x = 1.0 - progress
                    elif effect_type == "pan_right":
                        scale = 1.15
                        shift_x = progress
                    elif effect_type == "bounce_beat":
                        scale = 1.0 + max(0, 0.08 * math.sin(t * 15))
                        shift_x = 0.5
                    elif effect_type == "pulse":
                        scale = 1.05 + 0.05 * math.exp(-t * 10)
                        shift_x = 0.5
                    else:
                        scale = 1.05
                        shift_x = 0.5

                    if scale == 1.0: return frame
                    
                    h, w = frame.shape[:2]
                    new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
                    
                    img = Image.fromarray(frame)
                    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
                    
                    max_shift_x = new_w - w
                    max_shift_y = new_h - h
                    
                    left = max(0, int(max_shift_x * shift_x))
                    top = max(0, int(max_shift_y * 0.5))
                    
                    img = img.crop((left, top, left + w, top + h))
                    return np.array(img)
                return clp.fl(filter_frame)

            c = apply_cinematic_effect(clip, effect)
                
            clip = c.set_duration(duration)

            # Kadak Beat Flash on Fast Transitions
            if is_fast and random.random() > 0.3:
                flash_type = random.choice(["light", "dark"])
                def add_flash(get_frame, t):
                    frame = get_frame(t)
                    if flash_type == "light":
                        # Flash starts bright and drops
                        factor = 1.0 + max(0, 1.5 - t * 15)
                    else:
                        # Dark flash: starts black and jumps to 1.0
                        factor = min(1.0, t * 15)
                        
                    if factor != 1.0:
                        # Safely multiply uint8 frame
                        return np.clip(frame.astype(np.float32) * factor, 0, 255).astype(np.uint8)
                    return frame
                clip = clip.fl(add_flash)
                
            clips.append(clip)

        # Concatenate with method="chain" to prevent black flashes during cuts
        if style == "basic":
            final_video = concatenate_videoclips(clips, method="compose", padding=-0.5)
        else:
            final_video = concatenate_videoclips(clips, method="chain")
        
        # 3. Add Audio
        audio_clip = AudioFileClip(temp_audio_path).subclip(audio_start_time, audio_start_time + actual_duration)
        
        # Trim audio to match video duration
        video_duration = final_video.duration
        if audio_clip.duration > video_duration:
            audio_clip = audio_clip.subclip(0, video_duration)
            # Fade out audio at the end
            audio_clip = audio_clip.audio_fadeout(1.0)
            
        final_video = final_video.set_audio(audio_clip)
        
        # 4. Render
        output_filename = f"reel_{uuid.uuid4().hex[:8]}.mp4"
        output_path = os.path.join(REELS_DIR, output_filename)
        
        
        class TaskLogger(ProgressBarLogger):
            def bars_callback(self, bar, attr, value, old_value=None):
                if bar == 't':
                    total = self.bars[bar]['total']
                    if total > 0:
                        pct = int((value / total) * 100)
                        task_progress[task_id]["progress"] = pct
        
        logger = TaskLogger()
        final_video.write_videofile(
            output_path,
            fps=24,
            codec="libx264",
            audio_codec="aac",
            preset="ultrafast",
            threads=8,
            logger=logger
        )
        
        # Cleanup clips from memory
        final_video.close()
        audio_clip.close()
        for c in clips:
            c.close()
            
        task_progress[task_id]["status"] = "completed"
        task_progress[task_id]["reel_url"] = f"/static/reels/{output_filename}"
            
    except Exception as e:
        task_progress[task_id]["status"] = "error"
        task_progress[task_id]["error"] = str(e)
    finally:
        try:
            if 'audio_clip' in locals() and hasattr(audio_clip, 'close'):
                audio_clip.close()
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
            # Remove youtube downloaded file if any
            if youtube_id and os.path.exists(f"{youtube_id}.mp3"):
                os.remove(f"{youtube_id}.mp3")
        except Exception:
            pass

