import urllib.request
import urllib.parse
import json

base_url = "http://localhost:8000"

print("Uploading to /media/upload/1")
import requests
with open("lena.jpg", "rb") as f:
    files = {"files": ("lena.jpg", f, "image/jpeg")}
    data = {"folder_name": "General"}
    response = requests.post(f"{base_url}/media/upload/1", files=files, data=data)
    print("Upload Response:", response.status_code, response.text)

import time
time.sleep(3)

print("Scanning selfie at /guest/match-face/1")
with open("lena.jpg", "rb") as f:
    files = {"selfie": ("lena.jpg", f, "image/jpeg")}
    response = requests.post(f"{base_url}/guest/match-face/1", files=files)
    print("Scan Response:", response.status_code, response.text)
