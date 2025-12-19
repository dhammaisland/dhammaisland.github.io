import json
import os

def sync_dhamma():
    daily_file = '/home/hongda/src/dhammaisland.github.io/daily_dhamma.json'
    json_file = '/home/hongda/src/dhammaisland.github.io/dhamma.json'
    js_file = '/home/hongda/src/dhammaisland.github.io/dhamma.js'

    # Check if files exist
    if not os.path.exists(daily_file):
        print(f"Error: {daily_file} not found.")
        return

    # 1. Read daily_dhamma.json
    try:
        with open(daily_file, 'r', encoding='utf-8') as f:
            daily_data = json.load(f)
    except Exception as e:
        print(f"Error reading {daily_file}: {e}")
        return

    if not isinstance(daily_data, list) or len(daily_data) == 0:
        print("No new data to add.")
        return

    # 2. Update dhamma.json
    try:
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                dhamma_data = json.load(f)
        else:
            dhamma_data = []
        
        dhamma_data.extend(daily_data)
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(dhamma_data, f, ensure_ascii=False, indent=4)
        print(f"Successfully updated {json_file}")
    except Exception as e:
        print(f"Error updating {json_file}: {e}")
        return

    # 3. Update dhamma.js
    try:
        # We can just use the json data we already have
        js_content = f"const DHAMMA_DATA = {json.dumps(dhamma_data, ensure_ascii=False, indent=4)}"
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Successfully updated {js_file}")
    except Exception as e:
        print(f"Error updating {js_file}: {e}")
        return

    # Optional: Clear daily_dhamma.json?
    # with open(daily_file, 'w', encoding='utf-8') as f:
    #     json.dump([], f)

if __name__ == "__main__":
    sync_dhamma()

