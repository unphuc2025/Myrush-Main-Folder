import subprocess
import base64
import sys

local_path = r"c:\myrush-Main-folder\unified-backend\seed_district_partner.py"
remote_path = "/home/ec2-user/Accelerator/Admin-Main/Myrush-Main-Folder/unified-backend/seed_district_partner.py"
ssh_key = r"C:\Users\ajayp\Downloads\host\dev_ec2\dev-main-server.pem"

# 1. Base64 encode the local file
with open(local_path, "rb") as f:
    b64_content = base64.b64encode(f.read()).decode()

# 2. Prepare the SSH command
python_cmd = f"import sys, base64; open('{remote_path}', 'wb').write(base64.b64decode(sys.stdin.read().strip()))"
ssh_cmd = [
    "ssh", "-i", ssh_key, 
    "ec2-user@65.0.195.149", 
    f"python3 -c \"{python_cmd}\""
]

# 3. Execute and pipe the content
process = subprocess.Popen(ssh_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
stdout, stderr = process.communicate(input=b64_content.encode())

if process.returncode == 0:
    print("UPLOAD SUCCESSFUL")
    
    # 4. Run the seed script
    run_cmd = [
        "ssh", "-i", ssh_key, 
        "ec2-user@65.0.195.149", 
        "cd /home/ec2-user/Accelerator/Admin-Main/Myrush-Main-Folder/unified-backend/ && source venv/bin/activate && python seed_district_partner.py"
    ]
    process_run = subprocess.Popen(run_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    stdout_run, stderr_run = process_run.communicate()
    print(stdout_run.decode())
    print(stderr_run.decode())
else:
    print(f"UPLOAD FAILED: {stderr.decode()}")
    sys.exit(1)
