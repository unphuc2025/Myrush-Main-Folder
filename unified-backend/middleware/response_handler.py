import json
import time
from datetime import datetime
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import ContentStream, StreamingResponse

class ResponseHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to standardize all API responses.
    Adds 'code', 'status', and 'timestamp' to every JSON response.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Record start time if needed for performance tracking
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        # Only process JSON responses
        content_type = response.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            return response

        # Skip for certain paths if necessary (e.g., docs, redoc)
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return response

        # Read the original response body
        # For BaseHTTPMiddleware, we need to iterate over the response iterator
        response_body = [section async for section in response.body_iterator]
        response.body_iterator = iterate_in_threadpool(iter(response_body)) # Not needed if we return a new response
        
        try:
            full_body = b"".join(response_body).decode("utf-8")
            if not full_body:
                original_data = None
            else:
                original_data = json.loads(full_body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            # If we can't parse it as JSON, just return the original response
            # Reconstruct the body iterator for the original response
            headers = dict(response.headers)
            headers.pop("content-length", None)
            return Response(
                content=b"".join(response_body),
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type
            )

        # Determine status string
        status = "success" if 200 <= response.status_code < 300 else "error"
        
        # Create standardized structure
        standardized_content = {
            "code": response.status_code,
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        
        # Wrap the original data
        # If the original data is already a dict and has 'message' or 'error', 
        # we can decide whether to merge or put it in 'data'.
        # To be strictly standard, we'll put everything in 'data' unless it's an error message.
        if status == "error":
            if isinstance(original_data, dict):
                standardized_content.update(original_data)
            else:
                standardized_content["error_details"] = original_data
        else:
            standardized_content["data"] = original_data

        # Return the new standardized JSON response
        headers = dict(response.headers)
        # Remove content-length as the new body will have a different size
        headers.pop("content-length", None)
        # Remove content-type as JSONResponse will set it correctly
        headers.pop("content-type", None)
        
        return JSONResponse(
            status_code=response.status_code,
            content=standardized_content,
            headers=headers
        )

# Helper to reconstruct iterator if needed (though we're returning a new JSONResponse)
from starlette.concurrency import iterate_in_threadpool
