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
file_to_test = "uploads/1_20260526052732_lena.jpg"
if not os.path.exists(file_to_test):
    print("missing lena")
    sys.exit()
    
with open(file_to_test, "rb") as f:
    img_data = f.read()

content_type, body = encode_multipart_formdata(
    {}, 
    [("selfie", file_to_test, img_data)]
)

print("Scanning via localhost:8000...")
try:
    req = urllib.request.Request("http://localhost:8000/guest/match-face/1", data=body, headers={"Content-Type": content_type})
    resp = urllib.request.urlopen(req)
    print("Success:", resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}:", e.read().decode())
except Exception as e:
    print("Other Error:", str(e))
