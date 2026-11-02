from pathlib import Path
import json, re, sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
ext = root / "extension" if (root / "extension").exists() else root

# 1. Manifest & Version Checks
m = json.loads((ext / "manifest.json").read_text())
assert m["manifest_version"] == 3, "Manifest version must be 3"
assert m["version"] == "0.10.0", f"Expected version 0.10.0, got {m['version']}"

# 2. Required Files Checks
required_files = [
    "service-worker.js", 
    "content.js", 
    "admin.html", 
    "portal-api.js", 
    "source-scoring.js", 
    "evidence-normalizer.js", 
    "claim-comparison.js"
]
for f in required_files:
    assert (ext / f).exists(), f"Missing required file: {f}"

# 3. HTML Security Checks (No inline scripts or onclick handlers)
for html in ext.glob("*.html"):
    s = html.read_text()
    # Check for inline onclick attributes
    assert not re.search(r'onclick\s*=', s, re.I), f"Inline onclick found in {html.name}"
    # Check for inline <script> tags (script tag without a src attribute)
    for match in re.finditer(r'<script\b(?![^>]*\bsrc=)[^>]*>', s, re.I):
        raise AssertionError(f"Inline <script> tag found in {html.name}: {match.group(0)}")

# 4. JavaScript Security Checks (No eval or new Function)
for js in ext.glob("*.js"):
    s = js.read_text()
    assert "eval(" not in s, f"eval() found in {js.name}"
    assert "new Function(" not in s, f"new Function() found in {js.name}"

print("PASS: static release checks")
