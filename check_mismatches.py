import json
import glob
from collections import defaultdict

files = glob.glob("**/package.json", recursive=True)
files = [f for f in files if "node_modules" not in f]

deps = defaultdict(dict)

for f in files:
    try:
        with open(f, 'r') as file:
            data = json.load(file)
            for key in ["dependencies", "devDependencies", "peerDependencies"]:
                if key in data:
                    for pkg, ver in data[key].items():
                        deps[pkg][f] = ver
    except Exception as e:
        print(f"Error reading {f}: {e}")

mismatches = {pkg: versions for pkg, versions in deps.items() if len(set(versions.values())) > 1}

print("--- Mismatched Dependencies ---")
for pkg, versions in mismatches.items():
    print(f"\n{pkg}:")
    for f, ver in versions.items():
        print(f"  {f}: {ver}")

print("\n--- Heavy Dependencies Overview ---")
heavy_suspects = ['lodash', 'moment', 'framer-motion', 'd3', 'three', 'echarts', 'chart.js', '@mui/material', 'react-dom']
for pkg in heavy_suspects:
    if pkg in deps:
        print(f"{pkg} is installed in {list(deps[pkg].keys())}")
