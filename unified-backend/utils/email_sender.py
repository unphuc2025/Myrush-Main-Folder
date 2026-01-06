import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from dotenv import load_dotenv

load_dotenv(override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_admin_credentials_email(to_email, name, mobile, password):
    """
    Sends an email to the new admin with their credentials.
    """
    # Reload env vars to ensure we have the latest config (useful during dev)
    load_dotenv(override=True)

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not found in environment variables. Email will NOT be sent.")
        print("----------------------------------------------------------------")
        print(f"MOCK EMAIL TO: {to_email}")
        print(f"SUBJECT: Welcome to MyRush Admin Panel")
        print(f"BODY: Hello {name},\nYour admin account has been created.\nMobile/User ID: {mobile}\nPassword: {password}\n\nPlease change your password within 24 hours.")
        print("----------------------------------------------------------------")
        return False

    sender_email = smtp_username
    subject = "Welcome to MyRush Admin Panel - Action Required"

    html_content = f"""
    <html>
    <body>
        <h2>Welcome to MyRush Admin Panel</h2>
        <p>Hello {name},</p>
        <p>Your administrator account has been created successfully.</p>
        <p><strong>Login Details:</strong></p>
        <ul>
            <li><strong>User ID / Mobile:</strong> {mobile}</li>
            <li><strong>Password:</strong> {password}</li>
        </ul>
        <p style="color: red; font-weight: bold;">IMPORTANT: You must change your password within 24 hours of your first login.</p>
        <p>Please login at the admin dashboard.</p>
        <br>
        <p>Best Regards,<br>MyRush Team</p>
    </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False
