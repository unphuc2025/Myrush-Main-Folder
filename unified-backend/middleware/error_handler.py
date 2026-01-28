"""
Global Error Handling Middleware

This middleware provides centralized error handling for the FastAPI application.
It captures all unhandled exceptions and logs them with full context, triggering
email alerts for critical errors in production.

Features:
- Captures all unhandled exceptions
- Logs errors with full request context
- Masks sensitive data
- Rate-limits email alerts
- Returns consistent error responses
- Only sends email alerts in production for 5xx errors
"""

import logging
import traceback
import json
from typing import Dict, Any, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR, HTTP_400_BAD_REQUEST
import os

from utils.logger import log_error, log_warning, log_info, mask_sensitive_data

logger = logging.getLogger("myrush_backend")

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware for FastAPI"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Handle requests and catch any unhandled exceptions.
        
        Args:
            request: The incoming HTTP request
            call_next: The next middleware or endpoint handler
            
        Returns:
            HTTP response
        """
        try:
            # Process the request
            response = await call_next(request)
            return response
            
        except RequestValidationError as e:
            # Handle validation errors
            error_details = {
                'type': 'validation_error',
                'message': 'Request validation failed',
                'errors': e.errors(),
                'body': await self._get_request_body(request)
            }
            
            log_warning(
                f"Validation error: {e}",
                context={
                    'request_method': request.method,
                    'request_url': str(request.url),
                    'validation_errors': e.errors()
                }
            )
            
            return JSONResponse(
                status_code=HTTP_400_BAD_REQUEST,
                content={
                    'error': 'validation_error',
                    'message': 'Request validation failed',
                    'details': e.errors(),
                    'request_id': getattr(request.state, 'request_id', None)
                }
            )
            
        except StarletteHTTPException as e:
            # Handle HTTP exceptions (404, 401, etc.)
            error_details = {
                'type': 'http_error',
                'status_code': e.status_code,
                'message': e.detail
            }
            
            # Log 5xx errors as errors, others as warnings
            if e.status_code >= 500:
                log_error(
                    e,
                    request=request,
                    context={
                        'status_code': e.status_code,
                        'error_type': 'http_error'
                    }
                )
            else:
                log_warning(
                    f"HTTP {e.status_code}: {e.detail}",
                    context={
                        'status_code': e.status_code,
                        'error_type': 'http_error'
                    }
                )
            
            return JSONResponse(
                status_code=e.status_code,
                content={
                    'error': 'http_error',
                    'status_code': e.status_code,
                    'message': e.detail,
                    'request_id': getattr(request.state, 'request_id', None)
                }
            )
            
        except Exception as e:
            # Handle all other unhandled exceptions
            error_details = {
                'type': 'internal_error',
                'error_class': e.__class__.__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
            
            # Log the error with full context
            log_error(
                e,
                request=request,
                context={
                    'error_type': 'internal_error',
                    'error_class': e.__class__.__name__,
                    'request_body': await self._get_request_body(request)
                }
            )
            
            # Return a generic 500 error response
            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    'error': 'internal_error',
                    'message': 'An internal server error occurred',
                    'request_id': getattr(request.state, 'request_id', None),
                    # In development, include more details
                    **({'details': str(e)} if os.getenv('ENVIRONMENT', 'development').lower() == 'development' else {})
                }
            )
    
    async def _get_request_body(self, request: Request) -> Any:
        """
        Safely extract request body for logging.
        
        Args:
            request: The HTTP request
            
        Returns:
            Request body data or None if extraction fails
        """
        try:
            # Only extract body for certain methods
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Note: This will consume the request body
                # In production, you might want to read it in a different middleware
                # and store it in request.state for reuse
                body = await request.json()
                return mask_sensitive_data(body)
        except Exception:
            # If we can't read the body, that's okay
            pass
        
        return None

def create_error_response(
    error: Exception,
    request: Request,
    status_code: int = HTTP_500_INTERNAL_SERVER_ERROR
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        error: The exception that occurred
        request: The HTTP request
        status_code: HTTP status code to return
        
    Returns:
        JSONResponse with error details
    """
    
    response_data = {
        'error': 'internal_error',
        'message': 'An internal server error occurred',
        'request_id': getattr(request.state, 'request_id', None),
        'timestamp': json.dumps(request.state.request_timestamp) if hasattr(request.state, 'request_timestamp') else None
    }
    
    # In development, include more error details
    if os.getenv('ENVIRONMENT', 'development').lower() == 'development':
        response_data.update({
            'error_type': error.__class__.__name__,
            'error_message': str(error),
            'traceback': traceback.format_exc().split('\n')
        })
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )

# Additional utility functions for error handling

def handle_database_error(error: Exception, request: Request) -> JSONResponse:
    """Handle database-related errors specifically"""
    
    log_error(
        error,
        request=request,
        context={
            'error_type': 'database_error',
            'component': 'database'
        }
    )
    
    return JSONResponse(
        status_code=503,  # Service Unavailable
        content={
            'error': 'database_error',
            'message': 'Database service is temporarily unavailable',
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

def handle_authentication_error(error: Exception, request: Request) -> JSONResponse:
    """Handle authentication-related errors"""
    
    log_warning(
        f"Authentication error: {error}",
        request=request,
        context={
            'error_type': 'authentication_error',
            'component': 'auth'
        }
    )
    
    return JSONResponse(
        status_code=401,
        content={
            'error': 'authentication_error',
            'message': 'Authentication failed',
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

def handle_authorization_error(error: Exception, request: Request) -> JSONResponse:
    """Handle authorization-related errors"""
    
    log_warning(
        f"Authorization error: {error}",
        request=request,
        context={
            'error_type': 'authorization_error',
            'component': 'auth'
        }
    )
    
    return JSONResponse(
        status_code=403,
        content={
            'error': 'authorization_error',
            'message': 'Access denied',
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

# Custom exception classes for better error handling

class BusinessLogicError(Exception):
    """Custom exception for business logic errors"""
    
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(Exception):
    """Custom exception for validation errors"""
    
    def __init__(self, message: str, field: str = None, value: Any = None):
        self.message = message
        self.field = field
        self.value = value
        super().__init__(self.message)

class ExternalServiceError(Exception):
    """Custom exception for external service failures"""
    
    def __init__(self, message: str, service_name: str = None, status_code: int = None):
        self.message = message
        self.service_name = service_name
        self.status_code = status_code
        super().__init__(self.message)

# Exception handlers for custom exceptions

async def handle_business_logic_error(request: Request, exc: BusinessLogicError) -> JSONResponse:
    """Handle business logic errors"""
    
    log_warning(
        f"Business logic error: {exc.message}",
        context={
            'error_type': 'business_logic_error',
            'error_code': exc.error_code,
            'details': exc.details
        }
    )
    
    return JSONResponse(
        status_code=422,  # Unprocessable Entity
        content={
            'error': 'business_logic_error',
            'message': exc.message,
            'error_code': exc.error_code,
            'details': exc.details,
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

async def handle_validation_error(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle validation errors"""
    
    log_warning(
        f"Validation error: {exc.message}",
        context={
            'error_type': 'validation_error',
            'field': exc.field,
            'value': exc.value
        }
    )
    
    return JSONResponse(
        status_code=422,
        content={
            'error': 'validation_error',
            'message': exc.message,
            'field': exc.field,
            'value': exc.value,
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

async def handle_external_service_error(request: Request, exc: ExternalServiceError) -> JSONResponse:
    """Handle external service errors"""
    
    log_error(
        f"External service error: {exc.message}",
        request=request,
        context={
            'error_type': 'external_service_error',
            'service_name': exc.service_name,
            'status_code': exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code or 503,
        content={
            'error': 'external_service_error',
            'message': exc.message,
            'service_name': exc.service_name,
            'request_id': getattr(request.state, 'request_id', None)
        }
    )

if __name__ == "__main__":
    # Test the middleware
    print("Error handling middleware loaded successfully")