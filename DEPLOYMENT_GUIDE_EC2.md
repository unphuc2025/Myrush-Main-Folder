# MyRush Backend Deployment Guide (EC2)

**Target Server:** `65.0.195.149`  
**User:** `ec2-user`  
**Key File:** `C:\Users\Z BOOK\Downloads\host\dev_ec2`  

---

## Phase 1: Upload Code to Server (Run on Local Machine)

Since GitHub authentication is tricky on the server without setup, we will directly upload your code using `SCP` (Secure Copy).

**1. Open a NEW PowerShell window.**  
   Do not use the one running the server.

**2. Run this command:**  
   (This copies your `unified-backend` folder to the server's home directory)

```powershell
scp -i "C:\Users\Z BOOK\Downloads\host\dev_ec2" -r "C:\Users\Z BOOK\Desktop\myrush-Main-folder\unified-backend" ec2-user@65.0.195.149:/home/ec2-user/myrush-backend
```

*If it asks about fingerprint, type `yes`.*

---

## Phase 2: Server Setup (Run on Server)

**1. SSH into the server:**

```powershell
ssh -i "C:\Users\Z BOOK\Downloads\host\dev_ec2" ec2-user@65.0.195.149
```

**2. Update and Install Requirements:**

```bash
sudo yum update -y
sudo yum install python3 python3-pip git nginx -y
```

**3. Setup Python Environment:**

```bash
cd /home/ec2-user/myrush-backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvloop httptools
```

*Note: If `pip install -r requirements.txt` fails on some packages (like psycopg2), try:*
```bash
sudo yum install postgresql-devel python3-devel gcc -y
pip install psycopg2-binary
```

---

## Phase 3: Start the Backend

**1. Create a .env file (Important):**

```bash
nano .env
```
*Paste your `.env` content here (Database URL, Secret Key, etc).*  
*Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.*

**2. Run the Server (Test Mode):**

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*Wait a moment. If it starts successfully, press `Ctrl+C` to stop it.*

**3. Run in Background (Keep Alive):**

```bash
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > app.log 2>&1 &
```

---

## Phase 4: Configure Nginx (Reverse Proxy)

This allows you to access the API via port 80 (HTTP) instead of 8000.

**1. Edit Nginx Config:**
```bash
sudo nano /etc/nginx/nginx.conf
```

**2. Find the `server` block and update the `location /` part:**

```nginx
    server {
        listen       80;
        listen       [::]:80;
        server_name  _;

        location / {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
```
*Keep other settings as they are.*

**3. Start Nginx:**
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## ✅ Done!
Your API should now be accessible at:  
`http://65.0.195.149/api/user/health`
