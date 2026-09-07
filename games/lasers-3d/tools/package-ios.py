"""Copy the exact browser build into the offline app. Run before xcodegen/build."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
dest = root / "ios/Lasers3D/Game"
dest.mkdir(parents=True, exist_ok=True)
for folder in ["src", "vendor"]:
    shutil.copytree(root / folder, dest / folder, dirs_exist_ok=True)
shutil.copy2(root / "index.html", dest / "index.html")
print(f"Packaged {sum(1 for p in dest.rglob('*') if p.is_file())} game files in {dest}")
