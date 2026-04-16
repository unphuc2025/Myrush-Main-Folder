import paramiko
import os

key_path = r"C:\Users\ajayp\Downloads\host\dev_ec2\dev-main-server.pem"
host = "65.0.195.149"
user = "ec2-user"

local_file = r"c:\myrush-Main-folder\unified-backend\seed_district_partner.py"
remote_file = "/home/ec2-user/Accelerator/Admin-Main/Myrush-Main-Folder/unified-backend/seed_district_partner.py"

try:
    key = paramiko.RSAKey.from_private_key_file(key_path)
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, pkey=key)
    
    sftp = ssh.open_sftp()
    sftp.put(local_file, remote_file)
    sftp.close()
    
    print("Upload successful.")
    
    stdin, stdout, stderr = ssh.exec_command(f"cd /home/ec2-user/Accelerator/Admin-Main/Myrush-Main-Folder/unified-backend/ && source venv/bin/activate && python seed_district_partner.py")
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
