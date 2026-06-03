import os
import re

directory = 'frontend/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # If the URL is in single or double quotes without existing interpolation
            content = re.sub(r'\'http://localhost:8000(.*?)\'', r'`http://${window.location.hostname}:8000\1`', content)
            content = re.sub(r'\"http://localhost:8000(.*?)\"', r'`http://${window.location.hostname}:8000\1`', content)
            
            # If it's already in a template literal (backticks)
            content = content.replace('http://localhost:8000', 'http://${window.location.hostname}:8000')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
print('Done!')
