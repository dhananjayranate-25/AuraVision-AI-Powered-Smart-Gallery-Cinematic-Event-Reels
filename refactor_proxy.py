import os
import re

directory = 'frontend/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace `http://${window.location.hostname}:8000/something` with `/api/something`
            content = content.replace("`http://${window.location.hostname}:8000/", "`/api/")
            
            # Replace `http://${window.location.hostname}:8000${photo.s3_url}` with `${photo.s3_url}`
            content = content.replace("`http://${window.location.hostname}:8000${photo.s3_url}`", "photo.s3_url")
            content = content.replace("`http://${window.location.hostname}:8000${selectedPhoto.s3_url}`", "selectedPhoto.s3_url")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
print('Done refactoring API URLs for Vite proxy!')
