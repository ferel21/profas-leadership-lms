import urllib.request
import urllib.parse
import json
import time
import subprocess
import sys

CLIENT_ID = "178c6fc778ccc68e1d6a"
DEVICE_CODE = "c97d0b712587d74f366f7cb72fdca62f0108807d"

print("Polling for token...")
while True:
    data = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "device_code": DEVICE_CODE,
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
    }).encode("utf-8")
    
    req = urllib.request.Request("https://github.com/login/oauth/access_token", data=data, headers={"Accept": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as res:
            res_body = json.loads(res.read().decode("utf-8"))
            
            if "error" in res_body:
                if res_body["error"] == "authorization_pending":
                    time.sleep(5)
                elif res_body["error"] == "slow_down":
                    time.sleep(10)
                else:
                    print("Error:", res_body["error"])
                    sys.exit(1)
            else:
                token = res_body["access_token"]
                print("Got token!")
                
                # Get username securely via JSON parser
                req_user = urllib.request.Request("https://api.github.com/user", headers={"Authorization": f"token {token}"})
                with urllib.request.urlopen(req_user) as user_res:
                    user_info = json.loads(user_res.read().decode("utf-8"))
                    username = user_info["login"]
                    print(f"User: {username}")
                    
                    remote_url = f"https://x-access-token:{token}@github.com/{username}/profas-leadership-lms.git"
                    subprocess.run(["git", "remote", "remove", "origin"], stderr=subprocess.DEVNULL)
                    subprocess.run(["git", "remote", "add", "origin", remote_url])
                    push_res = subprocess.run(["git", "push", "-u", "origin", "main"])
                    
                    if push_res.returncode == 0:
                        print("SUCCESS: Repo pushed!")
                    else:
                        print("Failed to push.")
                    sys.exit(push_res.returncode)
    except Exception as e:
        print("Exception:", e)
        time.sleep(5)
