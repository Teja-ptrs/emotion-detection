import urllib.request
import json

def search_datasets():
    url = "https://huggingface.co/api/datasets?search=fer2013"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            print("Found datasets on HF:")
            for d in data[:15]:
                print("  - ID:", d.get("id"), "| Downloads:", d.get("downloads"))
    except Exception as e:
        print("API search failed:", e)

if __name__ == "__main__":
    search_datasets()
