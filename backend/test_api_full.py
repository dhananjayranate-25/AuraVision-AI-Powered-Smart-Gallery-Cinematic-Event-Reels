import urllib.request
import json
import uuid
import sys
import mimetypes

def encode_multipart_formdata(fields, files):
    boundary = uuid.uuid4().hex
    lines = []
    for (key, value) in fields.items():
        lines.append(f'--{boundary}')
        lines.append(f'Content-Disposition: form-data; name="{key}"')
        lines.append('')
        lines.append(str(value))
    for (key, filename, file_content) in files:
        lines.append(f'--{boundary}')
        lines.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"')
        lines.append(f'Content-Type: {mimetypes.guess_type(filename)[0] or "application/octet-stream"}')
        lines.append('')
        lines.append(file_content.decode('latin1')) # hack for binary
    lines.append(f'--{boundary}--')
    lines.append('')
    body = '\r\n'.join(lines).encode('latin1')
    content_type = f'multipart/form-data; boundary={boundary}'
    return content_type, body

import os
with open("lena.jpg", "rb") as f:
    img_data = f.read()

print("1. Uploading...")
content_type, body = encode_multipart_formdata(
    {"folder_name": "General"}, 
    [("files", "lena.jpg", img_data)]
)
req = urllib.request.Request("http://localhost:8000/media/upload/6a14914082b1c2733b1116af", data=body, headers={"Content-Type": content_type})
try:
    resp = urllib.request.urlopen(req)
    print("Upload:", resp.read().decode())
except Exception as e:
    print("Upload Failed:", e.read().decode() if hasattr(e, 'read') else e)

import time
time.sleep(2)

print("2. Scanning...")
content_type, body = encode_multipart_formdata(
    {}, 
    [("selfie", "lena.jpg", img_data)]
)
req = urllib.request.Request("http://localhost:8000/guest/match-face/6a14914082b1c2733b1116af", data=body, headers={"Content-Type": content_type})
try:
    resp = urllib.request.urlopen(req)
    print("Scan:", resp.read().decode())
except Exception as e:
    print("Scan Failed:", e.read().decode() if hasattr(e, 'read') else e)
