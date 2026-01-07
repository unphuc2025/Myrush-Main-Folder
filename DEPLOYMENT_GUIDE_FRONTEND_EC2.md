# MyRush Frontend Deployment Guide (EC2)

This guide walks you through deploying the `Admin_Myrush` frontend to the same EC2 instance hosting your backend.

**Target Server:** `65.0.195.149`
**User:** `ec2-user`
**Key File:** `C:\Users\ajayp\Downloads\host\dev_ec2`

---

## Automated Deployment (Recommended)

I have created a script that automates the cleanup (deleting old frontend), upload, and restart process.

1.  **Run the script in PowerShell**:
    ```powershell
    c:\myrush-Main-folder\deploy_frontend.ps1
    ```

    *This handles deleting the "previous frontend" and uploading the new one.*

2.  **Verify Nginx Configuration (If needed)**
    If the script runs but the site is still wrong, you might need to fix the Nginx config. I created a file `c:\myrush-Main-folder\nginx.conf` with the correct settings. You can copy it to the server:
    ```powershell
    scp -i "C:\Users\ajayp\Downloads\host\dev_ec2" "c:\myrush-Main-folder\nginx.conf" ec2-user@65.0.195.149:/home/ec2-user/nginx.conf
    ssh -i "C:\Users\ajayp\Downloads\host\dev_ec2" ec2-user@65.0.195.149 "sudo mv /home/ec2-user/nginx.conf /etc/nginx/nginx.conf && sudo systemctl restart nginx"
    ```

---

## Manual Steps (Phase 1: Build...)

1.  **Open a PowerShell window** and navigate to the frontend directory:

    ```powershell
    cd C:\myrush-Main-folder\Admin_Myrush\myrush-admin-frontend
    ```

2.  **Install dependencies** (if not done recently):

    ```powershell
    npm install
    ```

3.  **Build the project**:

    ```powershell
    npm run build
    ```

    This creates a `dist` folder containing your production-ready site.

---

## Phase 2: Upload to Server (Local Machine)

We will upload the `dist` folder to the server.

1.  **Run this SCP command** (from the same PowerShell window):

    ```powershell
    scp -i "C:\Users\ajayp\Downloads\host\dev_ec2" -r "C:\myrush-Main-folder\Admin_Myrush\myrush-admin-frontend\dist" ec2-user@65.0.195.149:/home/ec2-user/myrush-frontend
    ```

    *Note: This renames `dist` to `myrush-frontend` on the server.*

---

## Phase 3: Configure Nginx (Server Side)

1.  **SSH into the server**:

    ```powershell
    ssh -i "C:\Users\ajayp\Downloads\host\dev_ec2" ec2-user@65.0.195.149
    ```

2.  **Move the frontend to a standard location** (optional but recommended, or just keep in home):
    
    *We will keep it in `/home/ec2-user/myrush-frontend` for simplicity to match permissions, but ensure Nginx can read it.*

    Ensure permissions are correct:
    ```bash
    chmod 755 /home/ec2-user
    chmod -R 755 /home/ec2-user/myrush-frontend
    ```

3.  **Edit Nginx Config**:

    ```bash
    sudo nano /etc/nginx/nginx.conf
    ```

4.  **Replace the `server` block** with the following configuration. This separates the Frontend (root) from the Backend (/api).

    ```nginx
    server {
        listen       80;
        listen       [::]:80;
        server_name  _;

        # Frontend Config
        root /home/ec2-user/myrush-frontend;
        index index.html;

        # Handle React Routing (Single Page App)
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

    *Ensure you don't delete the wrapping `http { ... }` block if you are editing the full file, just replace the inner `server { ... }` block.*

5.  **Test and Restart Nginx**:

    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## ✅ Deployment Complete

You should now be able to access:
-   **Frontend:** `http://65.0.195.149/`
-   **Backend:** `http://65.0.195.149/api/...`
