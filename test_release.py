from pathlib import Path
import json, re, sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
ext = root / "extension" if (root / "extension").exists() else root

m = json.loads((ext / "manifest.json").read_text())
assert m["manifest_version"] == 3
assert m["version"] == "0.10.0"

required_files = ["service-worker.js", "content.js", "admin.html", "portal-api.js", "source-scoring.js", "evidence-normalizer.js", "claim-comparison.js"]
for f in required_files:
    assert (ext / f).exists(), f"Missing required file: {f}"

for html in ext.glob("*.html"):
    s = html.read_text()
    assert not re.search(r'onclick\s*=', s, re.I), f"Inline onclick found in {html.name}"
    for match in re.finditer(r'<script\b(?![^>]*\bsrc=)[^>]*>', s, re.I):
        raise AssertionError(f"Inline <script> tag found in {html.name}")

for js in ext.glob("*.js"):
    s = js.read_text()
    assert "eval(" not in s
    assert "new Function(" not in s

print("PASS: static release checks")