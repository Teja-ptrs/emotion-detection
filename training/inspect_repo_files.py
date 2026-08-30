import urllib.request
import json
import os

repos = [
    "Aaryan333/fer2013_train_publicTest_privateTest",
    "CaptainHaaz/FER2013",
    "chitradrishti/fer2013",
    "Jeneral/fer2013",
    "AutumnQiu/fer2013"
]

for repo in repos:
    url = f"https://huggingface.co/api/datasets/{repo}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            siblings = data.get("siblings", [])
            print(f"\nRepo: {repo}")
            for s in siblings:
                print("  File:", s.get("rfilename"))
    except Exception as e:
        print(f"Error checking {repo}: {e}")
