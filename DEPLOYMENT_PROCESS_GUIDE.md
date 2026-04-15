# MyRush Deployment Guide (EC2 Production)

This guide documents the process for redeploying the MyRush Backend and Admin Frontend to the live production server.

**Server Details:**
- **IP Address:** `65.0.195.149`
- **SSH User:** `ec2-user`
- **Identity File:** `C:\Users\ajayp\Downloads\host\dev_ec2\dev-main-server.pem`
- **Project Root on Server:** `~/Accelerator/Admin-Main/Myrush-Main-Folder/`

---

## 1. Prerequisites

Before deploying, ensure you have:
1.  Committed and pushed all local changes to the `main` branch.
2.  Verified that strictly local configs (like `localhost` URLs) are handled via environment variables (check `src/config.js` or `.env` files).

---

## 2. Connect to Server

Open a terminal and SSH into the server:

```powershell
ssh -o StrictHostKeyChecking=no -i "C:\Users\ajayp\Downloads\host\dev_ec2\dev-main-server.pem" ec2-user@65.0.195.149
```

---

## 3. Backend Deployment (FastAPI)

Updates to the Python backend (`unified-backend`).

### Step 3.1: Pull Latest Code
Navigate to the project folder and pull changes:

```bash
cd ~/Accelerator/Admin-Main/Myrush-Main-Folder/
git pull origin main
```
*Note: If you have local changes on the server preventing the pull, you may need to stash them: `git stash`.*

### Step 3.2: Update Dependencies
If `requirements.txt` was modified:

```bash
cd unified-backend/
pip install -r requirements.txt
```

### Step 3.3: Restart Application
Find the running process and restart it.

1.  **Find the Process ID (PID):**
    ```bash
    ps aux | grep uvicorn
    ```
    *Look for the process running `uvicorn main:app ...` and note its PID (e.g., `12345`).*

2.  **Kill the Old Process:**
    ```bash
    kill -9 <PID>
    ```

3.  **Start the New Process:**
    Run the server in the background using `nohup`:
    ```bash
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > uvicorn.log 2>&1 &
    ```

4.  **Verify:**
    Check that the new process is running:
    ```bash
    ps -eo pid,lstart,cmd | grep uvicorn
    ```
    *Ensure the "Start Time" matches the current time.*

---

## 4. Admin Frontend Deployment (React/Vite)

Updates to the Admin Panel (`Admin_Myrush`).

### Step 4.1: Pull Latest Code
(Skip if already done in Step 3.1)
```bash
cd ~/Accelerator/Admin-Main/Myrush-Main-Folder/
git pull origin main
```

### Step 4.2: Build the Application
Navigate to the frontend directory and build:

```bash
cd Admin_Myrush/myrush-admin-frontend/
npm install  # Only if package.json changed
npm run build
```

### Step 4.3: Deploy to Web Server (Nginx)
The Nginx server reads files from `/var/www/myrush_admin/`. You must copy the new build artifacts there.

```bash
sudo cp -r dist/* /var/www/myrush_admin/
```

### Step 4.4: Restart Nginx
Reload Nginx to serve the fresh files:

```bash
sudo systemctl restart nginx
```

---

## 5. Verification URLs

*   **Admin Frontend:** [http://65.0.195.149/](http://65.0.195.149/)
*   **Backend API Docs:** [http://65.0.195.149:8000/docs](http://65.0.195.149:8000/docs)
*   **Backend API Base:** `http://65.0.195.149:8000/`

---

## 6. Important Paths
*   **Backend Directory:** `~/Accelerator/Admin-Main/Myrush-Main-Folder/unified-backend/`
*   **Frontend Directory:** `~/Accelerator/Admin-Main/Myrush-Main-Folder/Admin_Myrush/myrush-admin-frontend/`
*   **Nginx Web Root:** `/var/www/myrush_admin/`
*   **Nginx Config:** `/etc/nginx/conf.d/myrush_admin.conf`
*   **Frontend .env on Server:** `~/Accelerator/Admin-Main/Myrush-Main-Folder/Admin_Myrush/myrush-admin-frontend/.env`
    *   *Should contain:* `VITE_API_URL=http://65.0.195.149:8000/api/admin`
