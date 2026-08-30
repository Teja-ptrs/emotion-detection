import os
import urllib.request
import zipfile
import pandas as pd

def download_and_extract_fer2013():
    target_csv = "data/fer2013.csv"
    os.makedirs("data", exist_ok=True)

    url = "https://huggingface.co/datasets/chitradrishti/fer2013/resolve/main/fer2013.csv.zip"
    zip_path = "data/fer2013.csv.zip"

    print(f"[Download] Fetching FER-2013 zip archive from: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

    with urllib.request.urlopen(req, timeout=60) as response, open(zip_path, "wb") as out_file:
        total_size = int(response.headers.get("content-length", 0))
        print(f"  Total archive size: {total_size / (1024*1024):.2f} MB")
        downloaded = 0
        block_size = 1024 * 1024 # 1MB chunks
        while True:
            buf = response.read(block_size)
            if not buf:
                break
            downloaded += len(buf)
            out_file.write(buf)
            if total_size > 0:
                print(f"  Progress: {downloaded / (1024*1024):.1f}/{total_size / (1024*1024):.1f} MB ({(downloaded/total_size)*100:.1f}%)", end="\r")

    print(f"\n[Download] Complete! Size on disk: {os.path.getsize(zip_path) / (1024*1024):.2f} MB")
    print("[Extract] Unzipping archive into data/ ...")

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall("data")

    # Check extracted file
    if os.path.exists("data/fer2013.csv"):
        print(f"[SUCCESS] Extracted data/fer2013.csv ({os.path.getsize('data/fer2013.csv') / (1024*1024):.2f} MB)")
        try:
            os.remove(zip_path)
        except Exception:
            pass
        return True

    return False

if __name__ == "__main__":
    download_and_extract_fer2013()
