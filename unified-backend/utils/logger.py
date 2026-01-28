"""
Production-Ready Error Logging and Alerting System

This module provides centralized logging with automatic email alerts for critical errors.
Follows DoD standards and production best practices for error monitoring.

Features:
- Structured logging with full context
- Automatic email alerts for 5xx errors in production
- Sensitive data masking
- Rate limiting to prevent email spam
- Integration with existing SMTP setup
"""

import logging
import json
import traceback
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pathlib import Path
import os
from functools import wraps

from utils.error_alert_service import send_error_alert_email
from fastapi import Request

# Configure structured logging
class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        return json.dumps(log_entry, ensure_ascii=False, indent=2)

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Configure the main logger
logger = logging.getLogger("myrush_backend")
logger.setLevel(logging.DEBUG)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(StructuredFormatter())

# Create file handler for all logs
file_handler = logging.FileHandler(LOGS_DIR / "application.log")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(StructuredFormatter())

# Create error file handler for errors only
error_handler = logging.FileHandler(LOGS_DIR / "errors.log")
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(StructuredFormatter())

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)
logger.addHandler(error_handler)

# Rate limiting for email alerts
class RateLimiter:
    """Simple rate limiter to prevent email spam"""
    
    def __init__(self, window_minutes: int = 5, max_alerts: int = 3):
        self.window_minutes = window_minutes
        self.max_alerts = max_alerts
        self.alert_counts: Dict[str, List[datetime]] = {}
    
    def should_send_alert(self, error_type: str) -> bool:
        """Check if an alert should be sent for this error type"""
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=self.window_minutes)
        
        # Clean old entries
        if error_type in self.alert_counts:
            self.alert_counts[error_type] = [
                timestamp for timestamp in self.alert_counts[error_type] 
                if timestamp > cutoff
            ]
        else:
            self.alert_counts[error_type] = []
        
        # Check if we can send more alerts
        if len(self.alert_counts[error_type]) < self.max_alerts:
            self.alert_counts[error_type].append(now)
            return True
        
        return False

# Global rate limiter instance
rate_limiter = RateLimiter()

def mask_sensitive_data(data: Any) -> Any:
    """Mask sensitive data in request/response data"""
    SENSITIVE_FIELDS = {
        'password', 'token', 'secret', 'key', 'auth', 'credential',
        'api_key', 'access_token', 'refresh_token', 'session',
        'cookie', 'authorization', 'x-api-key', 'x-auth-token'
    }
    
    if isinstance(data, dict):
        masked = {}
        for key, value in data.items():
            if key.lower() in SENSITIVE_FIELDS:
                masked[key] = "***MASKED***"
            elif isinstance(value, (dict, list)):
                masked[key] = mask_sensitive_data(value)
            else:
                masked[key] = value
        return masked
    elif isinstance(data, list):
        return [mask_sensitive_data(item) for item in data]
    else:
        return data

def get_error_type(error: Exception) -> str:
    """Generate a unique error type identifier for rate limiting"""
    error_type = f"{error.__class__.__module__}.{error.__class__.__name__}"
    
    # For similar errors, use a hash of the error message to group them
    if hasattr(error, 'args') and error.args:
        message_hash = hashlib.md5(str(error.args[0]).encode()).hexdigest()[:8]
        error_type += f"_{message_hash}"
    
    return error_type

def log_error(
    error: Exception, 
    request: Optional[Request] = None,
    context: Optional[Dict[str, Any]] = None,
    level: str = "ERROR"
) -> None:
    """Log an error with full context and trigger email alert if needed"""
    
    # Prepare request context
    request_context = {}
    if request:
        try:
            request_context = {
                'method': request.method,
                'url': str(request.url),
                'path': request.url.path,
                'query_params': dict(request.query_params),
                'headers': mask_sensitive_data(dict(request.headers)),
                'client_ip': request.client.host if request.client else None,
                'user_agent': request.headers.get('user-agent', 'Unknown'),
            }
            
            # Try to get request body (only for certain methods)
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Note: Reading request body here might consume it
                # In production, you might want to read it in middleware and store in state
                pass
                
        except Exception as e:
            request_context['error_reading_request'] = str(e)
    
    # Prepare additional context
    extra_context = context or {}
    
    # Create log entry
    log_data = {
        'error_type': error.__class__.__name__,
        'error_message': str(error),
        'request_context': mask_sensitive_data(request_context),
        'additional_context': mask_sensitive_data(extra_context),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
    }
    
    # Log the error
    log_method = getattr(logger, level.lower(), logger.error)
    log_method(
        f"Backend Error: {error.__class__.__name__}: {str(error)}",
        extra={'extra_fields': log_data}
    )
    
    # Check if we should send an email alert
    should_alert = (
        level == "ERROR" and 
        os.getenv("ENVIRONMENT", "development").lower() == "production" and
        rate_limiter.should_send_alert(get_error_type(error))
    )
    
    if should_alert:
        try:
            send_error_alert_email(error, request_context, extra_context)
        except Exception as alert_error:
            # Log alert failure but don't raise - we don't want to break the main error handling
            logger.error(f"Failed to send error alert email: {alert_error}")

def log_info(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """Log an info message with context"""
    logger.info(message, extra={'extra_fields': context or {}})

def log_warning(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """Log a warning message with context"""
    logger.warning(message, extra={'extra_fields': context or {}})

def log_debug(message: str, context: Optional[Dict[str, Any]] = None) -> None:
    """Log a debug message with context"""
    logger.debug(message, extra={'extra_fields': context or {}})

# Decorator for automatic error logging
def log_errors(func):
    """Decorator to automatically log errors from functions"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            # Try to extract request from args if it's a FastAPI endpoint
            request = None
            for arg in args:
                if hasattr(arg, 'method') and hasattr(arg, 'url'):
                    request = arg
                    break
            
            log_error(e, request=request)
            raise
    return wrapper

# Context manager for error logging
class ErrorContext:
    """Context manager for logging errors in a specific context"""
    
    def __init__(self, context: Dict[str, Any]):
        self.context = context
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            log_error(exc_val, context=self.context)
        return False  # Don't suppress the exception

# Example usage functions
def example_usage():
    """Example of how to use the logging system"""
    
    # Basic error logging
    try:
        # Some operation that might fail
        1 / 0
    except Exception as e:
        log_error(e, context={'operation': 'division', 'user_id': '123'})
    
    # Using the decorator
    @log_errors
    async def my_endpoint(request):
        # Endpoint logic here
        pass
    
    # Using context manager
    with ErrorContext({'operation': 'database_query', 'table': 'users'}):
        # Database operation here
        pass

if __name__ == "__main__":
    # Test the logging system
    example_usage()