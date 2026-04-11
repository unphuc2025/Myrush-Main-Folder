"""
District Gateway HMAC Authentication Client

Generates the required HMAC-SHA256 signed headers for every request sent
to District's Gateway. The Gateway validates these headers before forwarding
the request to District's Rust middleware.

Required Headers:
    X-Client-Id    : Vendor ID (from Partner.unique_id in DB)
    X-Key-Version  : Secret key version (default "1")
    X-Timestamp    : Current Unix time in milliseconds (generated dynamically)
    X-Signature    : HMAC-SHA256 of METHOD:PATH:TIMESTAMP:BODY (generated dynamically)

Signature Formula:
    sign_string = "METHOD:PATH:TIMESTAMP:BODY"
    signature   = HMAC-SHA256(SECRET_KEY, sign_string)

Usage:
    from services.integrations.gateway_client import DistrictGatewayClient

    # client args MUST come from the Partner DB table:
    client = DistrictGatewayClient(vendor_id=partner.unique_id, vendor_secret=partner.api_key_hash)

    response = client.get("http://localhost:3000/api/api/checkAvailability/", params={...})
    response = client.post("http://localhost:3000/api/api/makeBatchBooking", json={...})
"""

import hmac
import hashlib
import time
import json
import os
import logging
from urllib.parse import urlparse
from typing import Optional, Dict, Any

import requests
# Not loading .env here as credentials should be passed explicitly.

logger = logging.getLogger("DistrictGatewayClient")


class DistrictGatewayClient:
    """
    Reusable HTTP client that automatically attaches HMAC-SHA256 authentication
    headers required by District's Gateway for vendor verification.

    The PATH for signature computation is auto-extracted from the request URL,
    ensuring correct handling of the /api/api/ prefix without manual mapping.
    """

    # Timestamp validity window (for logging/debug — actual enforcement is by Gateway)
    TIMESTAMP_WINDOW_MS = 5 * 60 * 1000  # 5 minutes

    def __init__(
        self,
        vendor_id: Optional[str] = None,
        vendor_secret: Optional[str] = None,
        key_version: Optional[str] = None,
        timeout: int = 30,
    ):
        """
        Initialize the Gateway client.

        Args:
            vendor_id: Partner.unique_id from DB
            vendor_secret: Partner.api_key_hash from DB
            key_version: Override (default "1")
            timeout: Request timeout in seconds
        """
        self.vendor_id = vendor_id
        self.vendor_secret = vendor_secret
        self.key_version = key_version or "1"
        self.timeout = timeout

        if not self.vendor_id:
            raise ValueError("vendor_id is required (from Partner.unique_id)")
        if not self.vendor_secret:
            raise ValueError("vendor_secret is required (from Partner.api_key_hash)")

        logger.info(f"Gateway client initialized for vendor: {self.vendor_id}")

    def _generate_timestamp(self) -> str:
        """Returns current Unix time in milliseconds as a string."""
        return str(int(time.time() * 1000))

    def _extract_path(self, url: str) -> str:
        """
        Extracts the path component from a full URL.
        e.g., "http://localhost:3000/api/api/checkAvailability/" -> "/api/api/checkAvailability/"
        """
        return urlparse(url).path

    def _compute_signature(self, method: str, path: str, timestamp: str, body: str) -> str:
        """
        Computes HMAC-SHA256 signature using the formula:
            sign_string = METHOD:PATH:TIMESTAMP:BODY
            signature   = HMAC-SHA256(VENDOR_SECRET, sign_string)

        Args:
            method: HTTP method (GET, POST, etc.)
            path: URL path (e.g., /api/api/checkAvailability/)
            timestamp: Unix timestamp in milliseconds
            body: JSON-serialized request body (empty string for GET)

        Returns:
            Hex-encoded HMAC-SHA256 signature string
        """
        sign_string = f"{method}:{path}:{timestamp}:{body}"

        signature = hmac.new(
            self.vendor_secret.encode("utf-8"),
            sign_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        logger.debug(f"Sign string: {sign_string}")
        logger.debug(f"Signature:   {signature}")

        return signature

    def _build_auth_headers(self, method: str, url: str, body: str = "") -> Dict[str, str]:
        """
        Builds the 4 required authentication headers.

        Args:
            method: HTTP method
            url: Full request URL
            body: JSON-serialized body (empty string for no body)

        Returns:
            Dict with X-Client-Id, X-Key-Version, X-Timestamp, X-Signature
        """
        path = self._extract_path(url)
        timestamp = self._generate_timestamp()
        signature = self._compute_signature(method, path, timestamp, body)

        return {
            "X-Client-Id": self.vendor_id,
            "X-Key-Version": self.key_version,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
        }

    def get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """
        Sends an authenticated GET request through District's Gateway.

        Args:
            url: Full Gateway URL (e.g., http://localhost:3000/api/api/checkAvailability/)
            params: Query parameters
            extra_headers: Additional headers to include

        Returns:
            requests.Response object
        """
        method = "GET"
        body = ""  # GET requests have no body

        headers = self._build_auth_headers(method, url, body)
        headers["Content-Type"] = "application/x-www-form-urlencoded"

        if extra_headers:
            headers.update(extra_headers)

        logger.info(f"[GATEWAY] {method} {url}")
        logger.info(f"[GATEWAY] X-Client-Id: {headers['X-Client-Id']}")
        logger.info(f"[GATEWAY] X-Timestamp: {headers['X-Timestamp']}")
        logger.info(f"[GATEWAY] X-Signature: {headers['X-Signature'][:16]}...")

        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=self.timeout,
        )
        return response

    def post(
        self,
        url: str,
        json_data: Optional[Dict[str, Any]] = None,
        form_data: Optional[Dict[str, Any]] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> requests.Response:
        """
        Sends an authenticated POST request through District's Gateway.

        Args:
            url: Full Gateway URL (e.g., http://localhost:3000/api/api/makeBatchBooking)
            json_data: JSON body payload (for makeBatchBooking)
            form_data: Form-encoded body (for cancelBooking)
            extra_headers: Additional headers to include

        Returns:
            requests.Response object
        """
        method = "POST"

        # Serialize body for signature computation
        if json_data is not None:
            body = json.dumps(json_data, separators=(",", ":"), sort_keys=False)
        elif form_data is not None:
            # For form data, use the URL-encoded representation
            body = "&".join(f"{k}={v}" for k, v in form_data.items())
        else:
            body = ""

        headers = self._build_auth_headers(method, url, body)

        if extra_headers:
            headers.update(extra_headers)

        logger.info(f"[GATEWAY] {method} {url}")
        logger.info(f"[GATEWAY] X-Client-Id: {headers['X-Client-Id']}")
        logger.info(f"[GATEWAY] X-Timestamp: {headers['X-Timestamp']}")
        logger.info(f"[GATEWAY] X-Signature: {headers['X-Signature'][:16]}...")

        if json_data is not None:
            headers["Content-Type"] = "application/json"
            response = requests.post(
                url,
                json=json_data,
                headers=headers,
                timeout=self.timeout,
            )
        elif form_data is not None:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
            response = requests.post(
                url,
                data=form_data,
                headers=headers,
                timeout=self.timeout,
            )
        else:
            response = requests.post(
                url,
                headers=headers,
                timeout=self.timeout,
            )

        return response
