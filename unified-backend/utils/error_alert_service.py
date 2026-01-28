"""
Error Alert Service

This module handles sending email alerts for critical backend errors.
Uses the existing SMTP configuration from utils.email_sender.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
import traceback
import logging

from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Get logger
logger = logging.getLogger("myrush_backend")

def send_error_alert_email(
    error: Exception,
    request_context: Optional[Dict[str, Any]] = None,
    extra_context: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Send an email alert for a critical backend error.
    
    Args:
        error: The exception that occurred
        request_context: Information about the HTTP request (method, URL, etc.)
        extra_context: Additional context about the error
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    
    # Get SMTP configuration
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    # Get alert configuration
    alert_recipients = os.getenv("ERROR_ALERT_RECIPIENTS", "")
    alert_sender = os.getenv("ERROR_ALERT_SENDER", smtp_username)
    
    # Check if email alerts are configured
    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not found. Error alert email will NOT be sent.")
        return False
    
    if not alert_recipients:
        logger.warning("No error alert recipients configured. Error alert email will NOT be sent.")
        return False
    
    # Parse recipients (comma-separated)
    recipients = [email.strip() for email in alert_recipients.split(',') if email.strip()]
    
    # Prepare email content
    subject = f"🚨 MyRush Backend Error Alert - {error.__class__.__name__}"
    
    # Create detailed error report
    error_report = create_error_report(error, request_context, extra_context)
    
    # Create HTML email content
    html_content = create_html_email_content(error, error_report)
    
    # Create plain text version
    text_content = create_text_email_content(error, error_report)
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = alert_sender or smtp_username
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = subject
        
        # Add text and HTML parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Error alert email sent successfully to {', '.join(recipients)}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send error alert email: {str(e)}")
        return False

def create_error_report(
    error: Exception,
    request_context: Optional[Dict[str, Any]] = None,
    extra_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a detailed error report"""
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    error_report = {
        'timestamp': timestamp,
        'error_type': error.__class__.__name__,
        'error_module': error.__class__.__module__,
        'error_message': str(error),
        'traceback': traceback.format_exc(),
        'environment': os.getenv("ENVIRONMENT", "development"),
        'server_info': {
            'hostname': os.getenv("HOSTNAME", "unknown"),
            'python_version': os.getenv("PYTHON_VERSION", "unknown"),
        }
    }
    
    # Add request context if available
    if request_context:
        error_report['request'] = request_context
    
    # Add extra context if available
    if extra_context:
        error_report['context'] = extra_context
    
    return error_report

def create_html_email_content(error: Exception, error_report: Dict[str, Any]) -> str:
    """Create HTML email content for the error alert"""
    
    timestamp = error_report['timestamp']
    error_type = error_report['error_type']
    error_message = error_report['error_message']
    traceback_str = error_report['traceback']
    
    # Get request info
    request_info = error_report.get('request', {})
    method = request_info.get('method', 'N/A')
    url = request_info.get('url', 'N/A')
    client_ip = request_info.get('client_ip', 'N/A')
    
    # Get context info
    context_info = error_report.get('context', {})
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>MyRush Backend Error Alert</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 800px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #d32f2f; color: white; padding: 15px; border-radius: 5px; }}
            .content {{ background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }}
            .error-section {{ background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 15px 0; }}
            .info-section {{ background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }}
            .code-block {{ background-color: #f4f4f4; border: 1px solid #ddd; padding: 15px; border-radius: 5px; overflow-x: auto; }}
            .timestamp {{ color: #666; font-size: 0.9em; }}
            .highlight {{ background-color: #fff3cd; padding: 2px 4px; border-radius: 3px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🚨 MyRush Backend Error Alert</h2>
                <p class="timestamp">Generated: {timestamp}</p>
            </div>
            
            <div class="content">
                <h3>Error Summary</h3>
                <div class="error-section">
                    <strong>Error Type:</strong> <span class="highlight">{error_type}</span><br>
                    <strong>Error Message:</strong> {error_message}<br>
                    <strong>Environment:</strong> {error_report.get('environment', 'unknown')}
                </div>
                
                <h3>Request Information</h3>
                <div class="info-section">
                    <strong>Method:</strong> {method}<br>
                    <strong>URL:</strong> {url}<br>
                    <strong>Client IP:</strong> {client_ip}<br>
                    <strong>User Agent:</strong> {request_info.get('user_agent', 'N/A')}
                </div>
    """
    
    # Add context information if available
    if context_info:
        html += """
                <h3>Context Information</h3>
                <div class="info-section">
        """
        for key, value in context_info.items():
            html += f"<strong>{key}:</strong> {value}<br>"
        html += "</div>"
    
    # Add traceback
    html += f"""
                <h3>Stack Trace</h3>
                <div class="code-block">
                    <pre>{traceback_str}</pre>
                </div>
                
                <h3>Server Information</h3>
                <div class="info-section">
                    <strong>Hostname:</strong> {error_report.get('server_info', {}).get('hostname', 'unknown')}<br>
                    <strong>Python Version:</strong> {error_report.get('server_info', {}).get('python_version', 'unknown')}
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666;">
                    <p><strong>Note:</strong> This is an automated alert from the MyRush backend monitoring system.</p>
                    <p>Please investigate this error promptly to ensure system stability.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

def create_text_email_content(error: Exception, error_report: Dict[str, Any]) -> str:
    """Create plain text email content for the error alert"""
    
    timestamp = error_report['timestamp']
    error_type = error_report['error_type']
    error_message = error_report['error_message']
    traceback_str = error_report['traceback']
    
    # Get request info
    request_info = error_report.get('request', {})
    method = request_info.get('method', 'N/A')
    url = request_info.get('url', 'N/A')
    client_ip = request_info.get('client_ip', 'N/A')
    
    text = f"""
MyRush Backend Error Alert
==========================

Generated: {timestamp}

ERROR SUMMARY:
--------------
Error Type: {error_type}
Error Message: {error_message}
Environment: {error_report.get('environment', 'unknown')}

REQUEST INFORMATION:
-------------------
Method: {method}
URL: {url}
Client IP: {client_ip}
User Agent: {request_info.get('user_agent', 'N/A')}

"""
    
    # Add context information if available
    context_info = error_report.get('context', {})
    if context_info:
        text += "CONTEXT INFORMATION:\n"
        text += "-------------------\n"
        for key, value in context_info.items():
            text += f"{key}: {value}\n"
        text += "\n"
    
    # Add traceback
    text += f"""
STACK TRACE:
-----------
{traceback_str}

SERVER INFORMATION:
------------------
Hostname: {error_report.get('server_info', {}).get('hostname', 'unknown')}
Python Version: {error_report.get('server_info', {}).get('python_version', 'unknown')}

NOTE: This is an automated alert from the MyRush backend monitoring system.
Please investigate this error promptly to ensure system stability.
"""
    
    return text

# Configuration helper functions
def configure_error_alerts():
    """Configure error alert settings"""
    
    # Check if required environment variables are set
    required_vars = ['SMTP_USERNAME', 'SMTP_PASSWORD', 'ERROR_ALERT_RECIPIENTS']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.warning(f"Missing required environment variables for error alerts: {', '.join(missing_vars)}")
        logger.warning("Error alert emails will not be sent until these are configured.")
        return False
    
    logger.info("Error alert system configured successfully")
    return True

def test_error_alert():
    """Test the error alert system by sending a test email"""
    
    try:
        # Create a test error
        test_error = Exception("This is a test error for alert system verification")
        
        # Create test context
        test_context = {
            'request': {
                'method': 'GET',
                'url': 'http://localhost:8000/api/test',
                'client_ip': '127.0.0.1'
            },
            'context': {
                'test_mode': True,
                'component': 'error_alert_service'
            }
        }
        
        # Send test alert
        success = send_error_alert_email(test_error, test_context['request'], test_context['context'])
        
        if success:
            logger.info("Test error alert sent successfully")
        else:
            logger.error("Failed to send test error alert")
        
        return success
        
    except Exception as e:
        logger.error(f"Error testing alert system: {str(e)}")
        return False

if __name__ == "__main__":
    # Test the error alert system
    print("Testing error alert system...")
    success = test_error_alert()
    if success:
        print("✅ Test successful - check your email for the test alert")
    else:
        print("❌ Test failed - check the logs for details")