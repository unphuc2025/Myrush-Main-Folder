# Error Logging and Alerting System Guide

## Overview

This production-ready error logging and alerting system provides comprehensive monitoring for the MyRush backend application. It automatically captures, logs, and alerts on critical errors while maintaining security through sensitive data masking.

## Features

### 🔍 **Comprehensive Error Capture**
- Automatic logging of all unhandled exceptions
- Structured JSON logging with full request context
- Sensitive data masking in logs and email alerts
- Rate limiting to prevent alert spam

### 📧 **Smart Email Alerts**
- Automatic email notifications for 5xx errors in production
- Detailed error reports with stack traces
- HTML and plain text email formats
- Configurable alert recipients

### 🛡️ **Security & Privacy**
- Automatic masking of sensitive fields (passwords, tokens, API keys, etc.)
- Environment-based alert control (disabled in development)
- Rate limiting to prevent email flooding

### 📊 **Production Monitoring**
- Structured logs in multiple formats
- Separate error-only log file
- Request context preservation
- Performance impact minimized

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Request  │───▶│  Error Handler   │───▶│   Log System    │
└─────────────────┘    │   Middleware     │    └─────────────────┘
                       └──────────────────┘             │
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Rate Limiter    │───▶│  Email Service  │
                       └──────────────────┘    └─────────────────┘
```

## File Structure

```
unified-backend/
├── utils/
│   ├── logger.py                    # Centralized logging system
│   └── error_alert_service.py       # Email alert functionality
├── middleware/
│   └── error_handler.py             # Global error handling middleware
├── routers/
│   └── example_errors.py            # Example usage and testing
├── logs/                           # Log files directory
│   ├── application.log             # All application logs
│   └── errors.log                  # Error-only logs
└── test_error_system.py            # Test script
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# SMTP Configuration (existing)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Error Alert Configuration (new)
ERROR_ALERT_RECIPIENTS=admin@myrush.in,dev@myrush.in
ERROR_ALERT_SENDER=alerts@myrush.in
ENVIRONMENT=production  # Set to 'development' to disable email alerts
```

### Required SMTP Setup

For Gmail/Google Workspace:
1. Enable 2-Factor Authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the app password in `SMTP_PASSWORD`

For other providers, consult their SMTP documentation.

## Usage

### 1. Automatic Error Logging

Use the `@log_errors` decorator for automatic error logging:

```python
from utils.logger import log_errors

@log_errors
async def my_endpoint(request: Request):
    # Your endpoint logic
    # Any unhandled exception will be automatically logged
    pass
```

### 2. Manual Error Logging

For more control over error logging:

```python
from utils.logger import log_error, log_warning, log_info

try:
    # Some operation that might fail
    risky_operation()
except Exception as e:
    log_error(e, request=request, context={
        'operation': 'database_query',
        'table': 'users',
        'user_id': user_id
    })
    raise  # Re-raise the exception
```

### 3. Custom Error Types

Use custom exceptions for better error handling:

```python
from middleware.error_handler import BusinessLogicError, ValidationError

# Business logic error
raise BusinessLogicError(
    "User account is locked",
    error_code="ACCOUNT_LOCKED",
    details={"lock_reason": "too_many_attempts"}
)

# Validation error
raise ValidationError(
    "Invalid email format",
    field="email",
    value="invalid-email"
)
```

### 4. Context Manager

Use the context manager for scoped error logging:

```python
from utils.logger import ErrorContext

with ErrorContext({"operation": "file_upload", "file_size": file.size}):
    # File upload logic
    # Any error will be logged with the context
    upload_file(file)
```

### 5. Different Log Levels

```python
from utils.logger import log_info, log_warning, log_debug, log_error

log_info("User logged in", context={"user_id": user.id})
log_warning("Rate limit approaching", context={"requests": 95, "limit": 100})
log_debug("Processing request", context={"request_data": data})
log_error(exception, request=request, context={"component": "payment_service"})
```

## Log Format

### JSON Log Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "ERROR",
  "logger": "myrush_backend",
  "message": "Backend Error: ValueError: Invalid input",
  "module": "routers.user.bookings",
  "function": "create_booking",
  "line": 42,
  "exception": {
    "type": "ValueError",
    "message": "Invalid input provided",
    "traceback": ["...full traceback..."]
  },
  "request_context": {
    "method": "POST",
    "url": "https://api.myrush.in/api/user/bookings",
    "path": "/api/user/bookings",
    "query_params": {},
    "headers": {
      "user-agent": "Mozilla/5.0...",
      "authorization": "***MASKED***"
    },
    "client_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  },
  "additional_context": {
    "operation": "booking_creation",
    "user_id": 12345,
    "court_id": 67890
  }
}
```

### Email Alert Format

Email alerts include:
- Error summary with type and message
- Full stack trace
- Request information (method, URL, IP)
- Context information
- Server details
- Environment information

## Testing

### Run the Test Suite

```bash
# Start the FastAPI server
cd unified-backend
python main.py

# In another terminal, run the test script
python test_error_system.py
```

### Manual Testing

Test the example endpoints:

```bash
# Test automatic error logging
curl http://localhost:8000/api/example/test-logging

# Test custom errors
curl -X POST http://localhost:8000/api/example/test-custom-errors \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "age": 16}'

# Test internal errors
curl "http://localhost:8000/api/example/test-internal-error?user_id=100"

# Test sensitive data handling
curl http://localhost:8000/api/example/test-sensitive-data

# Test rate limiting
curl "http://localhost:8000/api/example/test-rate-limiting?count=5"
```

### Check Logs

```bash
# View all logs
tail -f logs/application.log

# View error logs only
tail -f logs/errors.log

# Search for specific errors
grep "ERROR" logs/application.log | tail -10
```

## Production Deployment

### 1. Environment Configuration

Set production environment variables:

```bash
# Production environment
ENVIRONMENT=production

# SMTP configuration for production
SMTP_SERVER=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USERNAME=alerts@yourdomain.com
SMTP_PASSWORD=your-app-password

# Alert recipients
ERROR_ALERT_RECIPIENTS=admin@yourdomain.com,dev@yourdomain.com,oncall@yourdomain.com
```

### 2. Log Rotation

Set up log rotation to prevent disk space issues:

```bash
# Install logrotate (Ubuntu/Debian)
sudo apt-get install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/myrush-backend
```

Add this configuration:

```
/path/to/unified-backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        # Restart your application if needed
        # systemctl restart myrush-backend
    endscript
}
```

### 3. Monitoring Integration

The structured JSON logs can be integrated with monitoring systems:

- **ELK Stack (Elasticsearch, Logstash, Kibana)**
- **Grafana Loki**
- **Splunk**
- **Datadog**
- **New Relic**

### 4. Alert Escalation

For critical errors, consider setting up escalation:

```bash
# Critical error recipients (24/7)
CRITICAL_ALERT_RECIPIENTS=oncall@myrush.in,pagerduty@myrush.in

# Regular error recipients (business hours)
ERROR_ALERT_RECIPIENTS=admin@myrush.in,dev@myrush.in
```

## Troubleshooting

### Common Issues

1. **Email alerts not sending**
   - Check SMTP credentials
   - Verify `ERROR_ALERT_RECIPIENTS` is set
   - Ensure `ENVIRONMENT=production`

2. **Logs not appearing**
   - Check file permissions on `logs/` directory
   - Verify the application has write access
   - Check disk space

3. **Too many alerts**
   - Adjust rate limiting in `RateLimiter` class
   - Review error thresholds
   - Consider filtering specific error types

4. **Missing request context**
   - Ensure middleware is properly registered
   - Check request processing order

### Debug Mode

Enable debug logging:

```python
from utils.logger import logger
logger.setLevel(logging.DEBUG)
```

### Testing Email Configuration

Test SMTP configuration:

```python
from utils.error_alert_service import test_error_alert
success = test_error_alert()
print(f"Email test: {'✅ Success' if success else '❌ Failed'}")
```

## Security Considerations

### Sensitive Data Masking

The system automatically masks these fields:
- `password`, `token`, `secret`, `key`
- `auth`, `credential`, `api_key`
- `access_token`, `refresh_token`
- `session`, `cookie`, `authorization`
- `x-api-key`, `x-auth-token`

### Additional Security Measures

1. **Environment Variables**: Never commit credentials to version control
2. **Log Access**: Restrict access to log files
3. **Email Content**: Avoid logging sensitive data in error messages
4. **Rate Limiting**: Prevents alert flooding and potential DoS

## Performance Impact

The error logging system is designed for minimal performance impact:

- **Async Logging**: Non-blocking log writes
- **Rate Limiting**: Prevents excessive email sending
- **Conditional Processing**: Only processes errors in production
- **Efficient Formatting**: Optimized JSON serialization

## Integration Examples

### With Existing Controllers

```python
# Before: Basic error handling
@app.post("/api/bookings")
async def create_booking(booking_data: BookingCreate):
    try:
        return await create_booking_service(booking_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# After: Enhanced error logging
@app.post("/api/bookings")
@log_errors
async def create_booking(request: Request, booking_data: BookingCreate):
    with ErrorContext({
        "operation": "booking_creation",
        "user_id": booking_data.user_id,
        "court_id": booking_data.court_id
    }):
        return await create_booking_service(booking_data)
```

### Custom Error Responses

```python
@app.exception_handler(CustomBusinessError)
async def custom_business_error_handler(request: Request, exc: CustomBusinessError):
    log_warning(f"Business error: {exc.message}", context={
        "error_code": exc.error_code,
        "user_id": exc.user_id
    })
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "business_error",
            "message": exc.message,
            "error_code": exc.error_code,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )
```

## Maintenance

### Regular Tasks

1. **Monitor Log Disk Usage**: Ensure logs don't consume all disk space
2. **Review Alert Recipients**: Keep contact information up to date
3. **Test Email Configuration**: Monthly testing of alert system
4. **Update SMTP Credentials**: Rotate passwords periodically
5. **Review Error Patterns**: Identify and fix recurring issues

### Log Analysis

Use these commands for log analysis:

```bash
# Count errors by type
grep '"level":"ERROR"' logs/application.log | \
  grep -o '"error_type":"[^"]*"' | \
  sort | uniq -c | sort -nr

# Find errors by endpoint
grep '"path":"[^"]*"' logs/application.log | \
  grep '"level":"ERROR"' | \
  sort | uniq -c | sort -nr

# Check error frequency over time
grep '"level":"ERROR"' logs/application.log | \
  grep -o '"timestamp":"[^"]*"' | \
  cut -d'T' -f1 | sort | uniq -c
```

## Support

For issues with the error logging and alerting system:

1. Check the logs in `logs/application.log`
2. Verify environment configuration
3. Test email functionality with `test_error_system.py`
4. Review this documentation
5. Contact the development team with specific error details

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: MyRush Development Team