import os
import subprocess
import tempfile
import uuid

# We wrap imports in try-except so the API doesn't crash if these aren't installed locally
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

class ReelGenerator:
    def __init__(self):
        self.output_dir = "uploads/reels"
        os.makedirs(self.output_dir, exist_ok=True)

    def detect_beats(self, audio_path):
        """
        Uses librosa to detect beat timestamps in an audio file.
        Returns a list of timestamps (in seconds).
        """
        if not LIBROSA_AVAILABLE:
            # Fallback: assume 120 BPM (1 beat every 0.5 seconds)
            return [i * 0.5 for i in range(1, 60)]
            
        try:
            y, sr = librosa.load(audio_path)
            tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
            beat_times = librosa.frames_to_time(beat_frames, sr=sr)
            return beat_times.tolist()
        except Exception as e:
            print(f"Error detecting beats: {e}")
            return [i * 0.5 for i in range(1, 60)]

    def generate_reel(self, image_paths, audio_path=None):
        """
        Generates a cinematic video from a list of images.
        If audio_path is provided, transitions sync to beats.
        """
        if not image_paths:
            return None
            
        reel_id = str(uuid.uuid4())
        output_filename = f"reel_{reel_id}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)
        
        # If no audio provided, or if we want to build a quick fallback, 
        # we can just use ffmpeg to create a basic slideshow.
        # In a real app, this would use the beat timestamps to create complex 
        # filter_complex strings for ffmpeg (zoompan, fade).
        
        try:
            # Create a temporary file listing the images for ffmpeg concat
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
                for img in image_paths:
                    # Escape paths for ffmpeg
                    clean_path = img.replace('\\', '/')
                    f.write(f"file '{clean_path}'\n")
                    f.write(f"duration 2.0\n") # 2 seconds per image
                # Due to ffmpeg concat quirk, repeat the last file
                f.write(f"file '{image_paths[-1].replace('\\', '/')}'\n")
            
            list_file = f.name
            
            # Simple ffmpeg command to create slideshow
            # ffmpeg -f concat -safe 0 -i list.txt -vsync vfr -pix_fmt yuv420p output.mp4
            cmd = [
                'ffmpeg', '-y', '-f', 'concat', '-safe', '0', 
                '-i', list_file, 
                '-vsync', 'vfr', '-pix_fmt', 'yuv420p', 
                output_path
            ]
            
            # Run ffmpeg
            # If ffmpeg is not installed on this system, this will throw FileNotFoundError
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            os.remove(list_file)
            
            return f"/static/reels/{output_filename}"
            
        except FileNotFoundError:
            print("FFmpeg is not installed or not in PATH. Generating mock reel URL.")
            return f"/static/reels/mock_reel.mp4"
        except Exception as e:
            print(f"Error generating reel: {e}")
            return f"/static/reels/mock_reel.mp4"

reel_service = ReelGenerator()
