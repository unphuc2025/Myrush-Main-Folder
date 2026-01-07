$KeyFile = "C:\Users\ajayp\Downloads\host\dev_ec2"
$Server = "ec2-user@65.0.195.149"
$FrontendDist = "C:\myrush-Main-folder\Admin_Myrush\myrush-admin-frontend\dist"
$RemotePath = "/home/ec2-user/myrush-frontend"

Write-Host "1. Cleaning up old frontend on server..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $Server "rm -rf $RemotePath"

Write-Host "2. Uploading new frontend build..."
# scp -r copies the directory itself, so we target the parent or rename
# We want contents of 'dist' to end up at 'myrush-frontend'
# So we copy 'dist' to local 'myrush-frontend' name first or just copy and rename?
# Simpler: SCP 'dist' to home, then rename it.
scp -i $KeyFile -o StrictHostKeyChecking=no -r $FrontendDist "${Server}:/home/ec2-user/"

Write-Host "3. Renaming uploaded folder..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $Server "mv /home/ec2-user/dist $RemotePath"

Write-Host "4. Ensuring Nginx permissions..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $Server "chmod -R 755 $RemotePath"

Write-Host "5. Checking Nginx Config (Displaying only)..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $Server "cat /etc/nginx/nginx.conf | grep 'root'"

Write-Host "6. Restarting Nginx..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $Server "sudo systemctl restart nginx"

Write-Host "Done! Frontend should be live at http://65.0.195.149/"
