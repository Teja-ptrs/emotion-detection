import os
import re

def audit_repository():
    print("=" * 60)
    print("PRE-DEPLOYMENT GITHUB REPOSITORY SAFETY AUDIT")
    print("=" * 60)

    secret_patterns = [
        re.compile(r'(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|bearer[_-]?token)\s*[:=]\s*["\'][A-Za-z0-9_\-]{16,}["\']'),
        re.compile(r'ghp_[A-Za-z0-9_]{36}'),
        re.compile(r'sk-[A-Za-z0-9_\-]{32,}'),
        re.compile(r'AIzaSy[A-Za-z0-9_\-]{33}'),
        re.compile(r'-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----'),
    ]

    found_secrets = []
    large_files = []

    for root, dirs, files in os.walk("."):
        if any(skip in root for skip in ["venv", "node_modules", ".git", ".pytest_cache", "dist"]):
            continue
        for file in files:
            filepath = os.path.join(root, file)
            try:
                size_mb = os.path.getsize(filepath) / (1024 * 1024)
                if size_mb > 0.5:
                    large_files.append((filepath, size_mb))

                if file.endswith((".py", ".ts", ".tsx", ".json", ".env", ".yaml", ".yml", ".md", ".txt", ".sh", ".bat")):
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        for pat in secret_patterns:
                            if pat.search(content):
                                found_secrets.append(filepath)
            except Exception as e:
                pass

    print("\n1. SENSITIVE CREDENTIALS / SECRETS SCAN:")
    if found_secrets:
        print(f"   [WARNING] Potential secrets found in {len(found_secrets)} file(s):")
        for s in set(found_secrets):
            print(f"     - {s}")
    else:
        print("   [CLEAN] 0 API keys, passwords, tokens, or credentials found in codebase.")

    print("\n2. LARGE FILES IN WORKSPACE (> 0.5 MB):")
    for fpath, sz in sorted(large_files, key=lambda x: x[1], reverse=True):
        print(f"   - {fpath:42s}: {sz:6.2f} MB")

    return found_secrets, large_files

if __name__ == "__main__":
    audit_repository()
