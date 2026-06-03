import os
import shutil

print("Resetting database...")
for file in ['faiss_index.bin', 'metadata.pkl']:
    try:
        if os.path.exists(file):
            os.remove(file)
            print(f"Deleted {file}")
    except Exception as e:
        print(f"Could not delete {file}: {e}")

try:
    if os.path.exists('uploads'):
        shutil.rmtree('uploads')
        print("Cleared uploads folder")
except Exception as e:
    pass

print("Reset complete. You can now start your backend server again!")
