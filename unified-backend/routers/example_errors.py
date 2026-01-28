"""
Example Error Controller

This module demonstrates how to use the error logging and alerting system
in your controllers. It includes examples of different types of errors
and how they are handled by the system.

This file is for demonstration purposes only and can be removed in production.
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import random

from utils.logger import log_error, log_warning, log_info, log_debug, log_errors, ErrorContext
from middleware.error_handler import (
    BusinessLogicError, ValidationError, ExternalServiceError,
    handle_business_logic_error, handle_validation_error, handle_external_service_error
)

router = APIRouter(
    prefix="/api/example",
    tags=["Example Errors"],
    responses={404: {"description": "Not found"}}
)

# Example endpoints demonstrating different error scenarios

@router.get("/test-logging")
@log_errors
async def test_logging_example(request: Request):
    """
    Example endpoint demonstrating automatic error logging with the @log_errors decorator
    """
    log_info("Testing info logging", context={"endpoint": "/test-logging", "method": "GET"})
    
    # Simulate some business logic
    if random.random() > 0.5:
        log_warning("Random warning occurred", context={"random_value": random.random()})
    
    # This will be automatically logged if an exception occurs
    result = 10 / random.randint(0, 2)  # May cause division by zero
    
    return {"message": "Success", "result": result}

@router.post("/test-custom-errors")
async def test_custom_errors_example(request: Request, payload: Dict[str, Any]):
    """
    Example endpoint demonstrating custom error types and manual error logging
    """
    
    # Example 1: Validation Error
    if not payload.get("name"):
        error = ValidationError("Name is required", field="name", value=None)
        log_warning(f"Validation error: {error.message}", context={
            "field": error.field,
            "value": error.value,
            "endpoint": "/test-custom-errors"
        })
        return await handle_validation_error(request, error)
    
    # Example 2: Business Logic Error
    if payload.get("age", 0) < 18:
        error = BusinessLogicError(
            "User must be at least 18 years old",
            error_code="AGE_TOO_YOUNG",
            details={"provided_age": payload.get("age")}
        )
        log_warning(f"Business logic error: {error.message}", context={
            "error_code": error.error_code,
            "details": error.details
        })
        return await handle_business_logic_error(request, error)
    
    # Example 3: External Service Error
    if payload.get("simulate_external_error", False):
        error = ExternalServiceError(
            "Payment service is temporarily unavailable",
            service_name="payment_service",
            status_code=503
        )
        log_error(f"External service error: {error.message}", context={
            "service_name": error.service_name,
            "status_code": error.status_code
        })
        return await handle_external_service_error(request, error)
    
    # Example 4: Context Manager for Error Logging
    with ErrorContext({"operation": "user_creation", "user_name": payload.get("name")}):
        # Simulate database operation
        if random.random() > 0.8:
            raise Exception("Database connection timeout")
    
    return {
        "message": "Success",
        "user": payload.get("name"),
        "age": payload.get("age")
    }

@router.get("/test-internal-error")
async def test_internal_error_example(request: Request):
    """
    Example endpoint that will trigger an internal server error
    This demonstrates how unhandled exceptions are caught by the middleware
    """
    
    # This will cause an unhandled exception that gets caught by the middleware
    user_id = request.query_params.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id parameter is required")
    
    # Simulate processing that might fail
    user_id_int = int(user_id)  # Will fail if user_id is not a valid integer
    
    if user_id_int < 0:
        raise ValueError("User ID cannot be negative")
    
    # This will cause a 500 error that gets logged and triggers email alert in production
    result = 1 / (user_id_int - 100)  # Will cause division by zero when user_id is 100
    
    return {"message": "Success", "user_id": user_id_int, "result": result}

@router.get("/test-sensitive-data")
async def test_sensitive_data_example(request: Request):
    """
    Example endpoint demonstrating sensitive data masking in logs
    """
    
    # This data will be automatically masked in logs
    sensitive_data = {
        "username": "john_doe",
        "password": "secret123",
        "api_key": "sk-1234567890abcdef",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "credit_card": "1234-5678-9012-3456",
        "ssn": "123-45-6789"
    }
    
    log_info("Processing sensitive data", context={
        "user_id": "12345",
        "data": sensitive_data,
        "operation": "user_registration"
    })
    
    # Simulate an error with sensitive data
    try:
        # This will fail and the sensitive data will be masked in the error log
        raise ValueError("Failed to process user registration")
    except Exception as e:
        log_error(e, request=request, context={
            "user_data": sensitive_data,
            "operation": "user_registration"
        })
        raise HTTPException(status_code=500, detail="Registration failed")

@router.get("/test-rate-limiting")
async def test_rate_limiting_example(request: Request):
    """
    Example endpoint demonstrating rate limiting for error alerts
    """
    
    # This will trigger multiple errors of the same type
    # The rate limiter should prevent spam emails
    error_count = int(request.query_params.get("count", "1"))
    
    for i in range(error_count):
        try:
            # Simulate the same error multiple times
            raise ValueError(f"Simulated error {i+1}")
        except Exception as e:
            log_error(e, request=request, context={
                "error_number": i+1,
                "total_errors": error_count,
                "endpoint": "/test-rate-limiting"
            })
    
    return {"message": f"Triggered {error_count} errors", "note": "Rate limiting should prevent spam emails"}

# Register custom exception handlers
def register_error_handlers(app):
    """Register custom exception handlers with the FastAPI app"""
    
    @app.exception_handler(BusinessLogicError)
    async def business_logic_error_handler(request: Request, exc: BusinessLogicError):
        return await handle_business_logic_error(request, exc)
    
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return await handle_validation_error(request, exc)
    
    @app.exception_handler(ExternalServiceError)
    async def external_service_error_handler(request: Request, exc: ExternalServiceError):
        return await handle_external_service_error(request, exc)

# Example usage documentation
EXAMPLE_USAGE = """
# Error Logging and Alerting System Usage Examples

## 1. Automatic Error Logging with Decorator

```python
from utils.logger import log_errors

@log_errors
async def my_endpoint(request: Request):
    # Your endpoint logic here
    # Any unhandled exception will be automatically logged
    pass
```

## 2. Manual Error Logging

```python
from utils.logger import log_error, log_warning, log_info

try:
    # Some operation
    pass
except Exception as e:
    log_error(e, request=request, context={
        'operation': 'database_query',
        'table': 'users'
    })
    raise
```

## 3. Custom Error Types

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

## 4. Context Manager for Error Logging

```python
from utils.logger import ErrorContext

with ErrorContext({"operation": "file_upload", "file_size": file.size}):
    # File upload logic
    # Any error will be logged with the context
    pass
```

## 5. Environment Variables for Configuration

Add these to your .env file:

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

## 6. Production Monitoring

The system provides:
- Structured JSON logs in logs/application.log
- Error-specific logs in logs/errors.log
- Email alerts for 5xx errors in production
- Rate limiting to prevent alert spam
- Sensitive data masking in all logs and emails
"""

if __name__ == "__main__":
    print("Example error controller loaded")
    print(EXAMPLE_USAGE)