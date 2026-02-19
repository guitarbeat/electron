import requests
import sys

PROXY_URL = "https://jectngcrpikxwnjdwana.supabase.co/functions/v1/omdb-proxy"

def verify_proxy():
    print(f"Testing proxy at {PROXY_URL}...")
    try:
        # Test with a dummy query to see if it reaches the key check
        response = requests.get(f"{PROXY_URL}?t=Inception")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")

        try:
            data = response.json()
        except:
            print("Response is not JSON")
            return False

        # We expect 500 "OMDb API Key not configured" because we haven't set the secret.
        if response.status_code == 500 and data.get("error") == "OMDb API Key not configured":
             print("SUCCESS: Proxy is reachable and correctly reporting missing configuration.")
             return True
        # If the secret WAS set (unlikely), we might get 200
        elif response.status_code == 200:
             print("SUCCESS: Proxy is working fully.")
             return True
        else:
             print("FAILURE: Unexpected response.")
             return False

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if verify_proxy():
        sys.exit(0)
    else:
        sys.exit(1)
