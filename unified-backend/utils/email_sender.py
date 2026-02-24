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
        <p>Please login at: <a href="http://65.0.195.149/">http://65.0.195.149/</a></p>
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

def send_academy_application_email(data: dict):
    """
    Sends an email notification for a new Academy application.
    """
    load_dotenv(override=True)

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    # Destination: Send to admin (verified sender) or a specific academy admin email
    to_email = os.getenv("ACADEMY_ADMIN_EMAIL", smtp_username) 

    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not found. Academy submission logged only.")
        print("----------------------------------------------------------------")
        print(f"MOCK ACADEMY EMAIL TO: {to_email}")
        print(f"SUBJECT: New Academy Application: {data.get('athlete_name')}")
        print(f"DETAILS: {data}")
        print("----------------------------------------------------------------")
        return True # Return true mimicking success for mock

    sender_email = smtp_username
    subject = f"New Academy Application: {data.get('athlete_name')}"

    html_content = f"""
    <html>
    <body>
        <h2>New Academy Application Received</h2>
        <p>A new student has registered for Rush Academy.</p>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                <td><strong>Athlete Name</strong></td>
                <td>{data.get('athlete_name')}</td>
            </tr>
            <tr>
                <td><strong>Age Group</strong></td>
                <td>{data.get('age_group')}</td>
            </tr>
             <tr>
                <td><strong>Contact Email</strong></td>
                <td>{data.get('contact_email')}</td>
            </tr>
            <tr>
                <td><strong>Phone Number</strong></td>
                <td>{data.get('phone_number')}</td>
            </tr>
            <tr>
                <td><strong>Preferred Sport</strong></td>
                <td>{data.get('preferred_sport', 'N/A')}</td>
            </tr>
             <tr>
                <td><strong>Experience Level</strong></td>
                <td>{data.get('experience_level', 'N/A')}</td>
            </tr>
        </table>
        <br>
        <p>Please contact them shortly.</p>
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
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Academy application email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send academy email: {str(e)}")
        # Don't fail the request if email fails, just log it
        return False


def send_contact_email(data: dict):
    """
    Sends an email notification for various contact forms.
    """
    load_dotenv(override=True)

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    # Destination: Send to admin (verified sender) or a specific admin email
    to_email = os.getenv("ADMIN_EMAIL", smtp_username) 

    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not found. Contact submission logged only.")
        print("----------------------------------------------------------------")
        print(f"MOCK CONTACT EMAIL TO: {to_email}")
        print(f"SUBJECT: New Contact Inquiry: {data.get('form_type')} - {data.get('name')}")
        print(f"DETAILS: {data}")
        print("----------------------------------------------------------------")
        return True # Return true mimicking success for mock

    sender_email = smtp_username
    
    # Customize subject based on form type
    form_type_display = {
        'landing': 'General Inquiry (Landing Page)',
        'academy_trial': 'Academy Trial Registration',
        'arena': 'Arena Inquiry',
        'corporate': 'Corporate Solutions Inquiry',
        'pickleball': 'Pickleball Inquiry'
    }.get(data.get('form_type', 'unknown'), 'New Inquiry')
    
    subject = f"MyRush - {form_type_display}: {data.get('name')}"

    # Build dynamic HTML rows for data provided
    rows_html = ""
    fields_mapping = [
        ('Name', 'name'),
        ('Email', 'email'),
        ('Phone Number', 'phone'),
        ('Company Name', 'company_name'),
        ('Sport', 'sport'),
        ('Location', 'location'),
        ('Preferred Date', 'preferred_date'),
        ('Message', 'message'),
        ('Form Type', 'form_type')
    ]
    
    for label, key in fields_mapping:
        val = data.get(key)
        if val:
            # Handle multiline messages nicely
            if key == 'message':
                val = str(val).replace('\n', '<br>')
            rows_html += f"""
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>{label}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{val}</td>
            </tr>
            """

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-w: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #000; color: #00d26a; padding: 20px; text-align: center;">
                <h2 style="margin: 0; text-transform: uppercase;">New Contact Submission</h2>
            </div>
            <div style="padding: 20px;">
                <p>A new inquiry has been submitted via the <strong>{form_type_display}</strong> form.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    {rows_html}
                </table>
                <br>
                <p>Please contact them shortly.</p>
            </div>
            <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777;">
                This is an automated message from the MyRush web application.
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = f"MyRush Website <{sender_email}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        logger.info(f"Contact form email sent to {to_email} for type {data.get('form_type')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        # Don't fail the request if email fails, just log it
        return False
