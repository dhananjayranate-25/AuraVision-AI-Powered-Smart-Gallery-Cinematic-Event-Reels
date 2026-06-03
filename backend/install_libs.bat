@echo off
subst X: .
X:
cd \
venv\Scripts\pip install librosa moviepy soundfile imageio[ffmpeg]
C:
subst X: /D
