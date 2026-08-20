import urllib.request, json
data = json.dumps({
    'branch_name': 'jules-592551624308845935-532e9e48',
    'commit_message': 'Extract hardcoded timeout values into constants',
    'title': '🧹 [code health improvement] Extract hardcoded timeout values into constants',
    'description': '🎯 **What:** Extracted hardcoded timeout values (100, 450) into constants (`FOCUS_DELAY_MS`, `SHAKE_DURATION_MS`, `SUBMIT_DELAY_MS`) at the top of the file.\n💡 **Why:** Magic numbers make code harder to read and maintain. Extracting them to constants gives them meaningful names and makes them easier to update in the future.\n✅ **Verification:** Verified by running `pnpm lint` and `pnpm test`.\n✨ **Result:** Improved maintainability and readability by replacing magic numbers with named constants.'
}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/submit', data=data, headers={'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except Exception as e:
    print("Error calling HTTP endpoint:", e)
