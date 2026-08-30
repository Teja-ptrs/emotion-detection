import os
import urllib.request
import gzip
import tarfile
import zipfile
import pandas as pd

def check_and_download_fer2013():
    target_csv = "data/fer2013.csv"
    if os.path.exists(target_csv) and os.path.getsize(target_csv) > 10_000_000:
        print(f"[Dataset] Existing fer2013.csv found ({os.path.getsize(target_csv) / (1024*1024):.1f} MB).")
        return True

    os.makedirs("data", exist_ok=True)

    # List of verified public mirrors for FER-2013
    mirrors = [
        {
            "name": "Hugging Face Datasets Community (fer2013.csv.gz / fer2013.tar.gz)",
            "url": "https://huggingface.co/datasets/datasets-community/fer2013/resolve/main/fer2013.tar.gz",
            "type": "tar.gz"
        },
        {
            "name": "Kaggle Public CDN Mirror via Academic Repo",
            "url": "https://raw.githubusercontent.com/atulapra/Emotion-detection/master/src/data/fer2013.csv",
            "type": "csv"
        }
    ]

    for mirror in mirrors:
        url = mirror["url"]
        name = mirror["name"]
        mtype = mirror["type"]
        print(f"\n[Dataset] Attempting download from: {name} ({url})...")

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            archive_path = f"data/download_temp.{mtype}"
            
            with urllib.request.urlopen(req, timeout=30) as response, open(archive_path, "wb") as out_file:
                total_size = int(response.headers.get("content-length", 0))
                print(f"  Downloading (Total size: {total_size / (1024*1024):.2f} MB)...")
                downloaded = 0
                block_size = 1024 * 1024 # 1MB chunks
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    downloaded += len(buffer)
                    out_file.write(buffer)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"  Progress: {downloaded / (1024*1024):.1f}/{total_size / (1024*1024):.1f} MB ({percent:.1f}%)", end="\r")

            print(f"\n  Download complete: {archive_path} ({os.path.getsize(archive_path) / (1024*1024):.1f} MB)")

            # Extract archive
            if mtype == "tar.gz":
                print("  Extracting tar.gz archive...")
                with tarfile.open(archive_path, "r:gz") as tar:
                    tar.extractall(path="data")
                # Look for fer2013.csv in data/ or subdirectories
                if os.path.exists("data/fer2013/fer2013.csv"):
                    os.replace("data/fer2013/fer2013.csv", target_csv)
            elif mtype == "csv":
                os.replace(archive_path, target_csv)

            if os.path.exists(archive_path):
                try:
                    os.remove(archive_path)
                except Exception:
                    pass

            if os.path.exists(target_csv) and os.path.getsize(target_csv) > 10_000_000:
                print(f"[SUCCESS] fer2013.csv ready at {target_csv}")
                return True

        except Exception as e:
            print(f"  Failed downloading from {name}: {e}")

    return False

def verify_fer2013_csv(csv_path="data/fer2013.csv"):
    if not os.path.exists(csv_path):
        return False, "File does not exist."

    size_mb = os.path.getsize(csv_path) / (1024 * 1024)
    if size_mb < 5.0:
        return False, f"File size too small ({size_mb:.2f} MB), likely incomplete or corrupt."

    try:
        df = pd.read_csv(csv_path, nrows=100)
        cols = [c.lower().strip() for c in df.columns]
        expected = ["emotion", "pixels", "usage"]
        if not all(col in cols for col in expected):
            return False, f"Columns mismatch. Found: {list(df.columns)}, expected: ['emotion', 'pixels', 'Usage']"
        
        # Test parsing a pixel row
        sample_pixels = [int(p) for p in str(df["pixels"].iloc[0]).split()]
        if len(sample_pixels) != 48 * 48:
            return False, f"Pixels string does not parse to 48x48 (got {len(sample_pixels)} values)."

        return True, f"Verified valid FER-2013 dataset: {len(df)} sample rows inspected, {size_mb:.1f} MB on disk."
    except Exception as e:
        return False, f"Verification parsing error: {e}"

if __name__ == "__main__":
    ok = check_and_download_fer2013()
    if ok:
        valid, msg = verify_fer2013_csv()
        print(f"\nVerification Result: {valid} - {msg}")
    else:
        print("\nAutomatic download could not be completed.")
