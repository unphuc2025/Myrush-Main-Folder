"""
Production-safe date handling utilities for FastAPI endpoints.

This module provides robust date parsing and validation functions that:
- Sanitize input by removing whitespace and newlines
- Validate date formats properly
- Provide clear error messages
- Work consistently across Swagger, Postman, and frontend calls
- Prevent common parsing errors like "unconverted data remains"
"""

from datetime import datetime, date
from typing import Optional, Union
from fastapi import Query, HTTPException
from pydantic import condate

def sanitize_date_string(date_str: str) -> str:
    """
    Sanitize a date string by removing whitespace, newlines, and other extraneous characters.

    Args:
        date_str: The raw date string from query parameters

    Returns:
        Cleaned date string ready for parsing

    Examples:
        >>> sanitize_date_string("2026-01-30\n")
        "2026-01-30"
        >>> sanitize_date_string(" 2026-01-30 ")
        "2026-01-30"
        >>> sanitize_date_string("2026-01-30")
        "2026-01-30"
    """
    if not date_str:
        return date_str

    # Remove whitespace, newlines, tabs, etc.
    sanitized = date_str.strip()

    # Remove any remaining internal whitespace
    sanitized = ''.join(sanitized.split())

    return sanitized

def parse_date_safe(
    date_str: str,
    date_format: str = "%Y-%m-%d",
    param_name: str = "date"
) -> date:
    """
    Safely parse a date string with proper validation and error handling.

    Args:
        date_str: The date string to parse
        date_format: The expected date format (default: "%Y-%m-%d")
        param_name: The parameter name for error messages

    Returns:
        Parsed date object

    Raises:
        HTTPException: If the date string is invalid or doesn't match the format

    Examples:
        >>> parse_date_safe("2026-01-30")
        datetime.date(2026, 1, 30)
        >>> parse_date_safe("2026-01-30\n")
        datetime.date(2026, 1, 30)
        >>> parse_date_safe("invalid-date")
        HTTPException(status_code=400, detail="Invalid date format...")
    """
    # Sanitize the input first
    cleaned_date_str = sanitize_date_string(date_str)

    if not cleaned_date_str:
        raise HTTPException(
            status_code=400,
            detail=f"Missing or empty {param_name} parameter"
        )

    try:
        # Parse the date
        parsed_date = datetime.strptime(cleaned_date_str, date_format).date()
        return parsed_date
    except ValueError as e:
        # Provide a helpful error message
        error_msg = str(e)
        if "unconverted data remains" in error_msg:
            detail = f"Invalid {param_name} format. Expected {date_format} but got extra characters. Please provide date in YYYY-MM-DD format."
        else:
            detail = f"Invalid {param_name} format. Expected {date_format}. Please provide date in YYYY-MM-DD format."

        raise HTTPException(
            status_code=400,
            detail=detail
        )

def parse_date_query_param(
    date_str: str = Query(..., description="Date in YYYY-MM-DD format"),
    param_name: str = "date"
) -> date:
    """
    FastAPI Query parameter wrapper for safe date parsing.

    This is the recommended way to handle date query parameters in FastAPI endpoints.

    Args:
        date_str: The date string from query parameters
        param_name: The parameter name for error messages

    Returns:
        Parsed date object

    Raises:
        HTTPException: If the date string is invalid

    Example usage in FastAPI endpoint:
        @router.get("/availability")
        async def get_availability(
            date: date = Depends(lambda: parse_date_query_param(param_name="date")),
            # ... other parameters
        ):
            # Use date directly, it's already parsed and validated
    """
    return parse_date_safe(date_str, param_name=param_name)

def parse_datetime_safe(
    datetime_str: str,
    datetime_format: str = "%Y-%m-%d %H:%M:%S",
    param_name: str = "datetime"
) -> datetime:
    """
    Safely parse a datetime string with proper validation and error handling.

    Args:
        datetime_str: The datetime string to parse
        datetime_format: The expected datetime format
        param_name: The parameter name for error messages

    Returns:
        Parsed datetime object

    Raises:
        HTTPException: If the datetime string is invalid
    """
    # Sanitize the input first
    cleaned_datetime_str = sanitize_date_string(datetime_str)

    if not cleaned_datetime_str:
        raise HTTPException(
            status_code=400,
            detail=f"Missing or empty {param_name} parameter"
        )

    try:
        # Parse the datetime
        return datetime.strptime(cleaned_datetime_str, datetime_format)
    except ValueError as e:
        # Provide a helpful error message
        error_msg = str(e)
        if "unconverted data remains" in error_msg:
            detail = f"Invalid {param_name} format. Expected {datetime_format} but got extra characters."
        else:
            detail = f"Invalid {param_name} format. Expected {datetime_format}."

        raise HTTPException(
            status_code=400,
            detail=detail
        )

def parse_time_safe(
    time_str: str,
    time_format: str = "%H:%M:%S",
    param_name: str = "time"
) -> datetime.time:
    """
    Safely parse a time string with proper validation and error handling.

    Args:
        time_str: The time string to parse
        time_format: The expected time format
        param_name: The parameter name for error messages

    Returns:
        Parsed time object

    Raises:
        HTTPException: If the time string is invalid
    """
    # Sanitize the input first
    cleaned_time_str = sanitize_date_string(time_str)

    if not cleaned_time_str:
        raise HTTPException(
            status_code=400,
            detail=f"Missing or empty {param_name} parameter"
        )

    try:
        # Parse the time
        return datetime.strptime(cleaned_time_str, time_format).time()
    except ValueError as e:
        # Provide a helpful error message
        error_msg = str(e)
        if "unconverted data remains" in error_msg:
            detail = f"Invalid {param_name} format. Expected {time_format} but got extra characters."
        else:
            detail = f"Invalid {param_name} format. Expected {time_format}."

        raise HTTPException(
            status_code=400,
            detail=detail
        )

# FastAPI-compatible query parameter types for OpenAPI/Swagger documentation
DateQueryParam = Query(..., description="Date in YYYY-MM-DD format", example="2026-01-30")
DatetimeQueryParam = Query(..., description="Datetime in YYYY-MM-DD HH:MM:SS format", example="2026-01-30 14:30:00")
TimeQueryParam = Query(..., description="Time in HH:MM:SS format", example="14:30:00")

def create_date_query_param(
    description: str = "Date in YYYY-MM-DD format",
    example: str = "2026-01-30",
    alias: Optional[str] = None
):
    """
    Create a FastAPI Query parameter with proper date validation.

    Args:
        description: Description for OpenAPI docs
        example: Example value for OpenAPI docs
        alias: Optional parameter alias

    Returns:
        Query parameter that can be used in FastAPI endpoints

    Example:
        date_param = create_date_query_param(description="Booking date")
        @router.get("/bookings")
        def get_bookings(
            date: str = date_param
        ):
            booking_date = parse_date_safe(date)
    """
    return Query(..., description=description, example=example, alias=alias)