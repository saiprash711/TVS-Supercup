import os
import re

endpoints = []
for root, dirs, files in os.walk(r'c:\supercup_Watermelon\TVS-Supercup\src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js')):
            p = os.path.join(root, file)
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'tvscertified.in' in content or 'baseUrl' in content:
                    for match in re.finditer(r'fetch\s*\(([^)]+)\)', content):
                        call_text = match.group(0)
                        endpoints.append((file, call_text[:120]))

print(f"Total TVS calls found: {len(endpoints)}")
for f, e in endpoints:
    print(f"{f}: {e}")
