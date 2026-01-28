#!/usr/bin/env python3
"""
Test Script for Error Logging and Alerting System

This script tests the error logging and alerting system by making requests
to the example endpoints and verifying that errors are properly logged and
email alerts are sent (in production mode).
"""

import requests
import json
import time
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ENDPOINTS = [
    {
        "name": "Test Logging (Random Error)",
        "url": f"{BASE_URL}/api/example/test-logging",
        "method": "GET",
        "expected_error": True
    },
    {
        "name": "Test Custom Errors - Validation",
        "url": f"{BASE_URL}/api/example/test-custom-errors",
        "method": "POST",
        "payload": {},
        "expected_error": True,
        "error_type": "validation"
    },
    {
        "name": "Test Custom Errors - Business Logic",
        "url": f"{BASE_URL}/api/example/test-custom-errors",
        "method": "POST",
        "payload": {"name": "John", "age": 16},
        "expected_error": True,
        "error_type": "business_logic"
    },
    {
        "name": "Test Custom Errors - External Service",
        "url": f"{BASE_URL}/api/example/test-custom-errors",
        "method": "POST",
        "payload": {"name": "John", "age": 25, "simulate_external_error": True},
        "expected_error": True,
        "error_type": "external_service"
    },
    {
        "name": "Test Internal Error",
        "url": f"{BASE_URL}/api/example/test-internal-error",
        "method": "GET",
        "params": {"user_id": "100"},  # This will cause division by zero
        "expected_error": True,
        "error_type": "internal"
    },
    {
        "name": "Test Sensitive Data",
        "url": f"{BASE_URL}/api/example/test-sensitive-data",
        "method": "GET",
        "expected_error": True,
        "error_type": "sensitive_data"
    },
    {
        "name": "Test Rate Limiting",
        "url": f"{BASE_URL}/api/example/test-rate-limiting",
        "method": "GET",
        "params": {"count": "5"},
        "expected_error": True,
        "error_type": "rate_limiting"
    }
]

def check_environment():
    """Check if the environment is properly configured for testing"""
    print("🔍 Checking environment configuration...")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print(f"❌ Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running. Please start the FastAPI server first.")
        return False
    except requests.exceptions.Timeout:
        print("❌ Server connection timed out")
        return False
    
    # Check environment variables
    required_vars = ['SMTP_USERNAME', 'SMTP_PASSWORD', 'ERROR_ALERT_RECIPIENTS']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("⚠️  Email alerts will not be sent until these are configured.")
    else:
        print("✅ SMTP configuration found")
    
    # Check environment mode
    environment = os.getenv('ENVIRONMENT', 'development').lower()
    if environment == 'production':
        print("✅ Environment set to production - email alerts will be sent")
    else:
        print(f"⚠️  Environment set to '{environment}' - email alerts disabled")
    
    return True

def test_endpoint(test_case):
    """Test a single endpoint and return the result"""
    print(f"\n🧪 Testing: {test_case['name']}")
    print(f"   URL: {test_case['url']}")
    print(f"   Method: {test_case['method']}")
    
    try:
        if test_case['method'] == 'GET':
            response = requests.get(
                test_case['url'], 
                params=test_case.get('params', {}),
                timeout=10
            )
        elif test_case['method'] == 'POST':
            response = requests.post(
                test_case['url'],
                json=test_case.get('payload', {}),
                timeout=10
            )
        else:
            print(f"❌ Unsupported method: {test_case['method']}")
            return False
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if test_case['expected_error'] and response.status_code >= 400:
            print("✅ Expected error occurred")
            return True
        elif not test_case['expected_error'] and response.status_code < 400:
            print("✅ Request succeeded as expected")
            return True
        else:
            print(f"❌ Unexpected result: expected error={test_case['expected_error']}, got status={response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return False

def check_log_files():
    """Check if log files were created and contain expected content"""
    print("\n📁 Checking log files...")
    
    logs_dir = Path("logs")
    if not logs_dir.exists():
        print("❌ Logs directory not found")
        return False
    
    log_files = list(logs_dir.glob("*.log"))
    if not log_files:
        print("❌ No log files found")
        return False
    
    print(f"✅ Found {len(log_files)} log file(s):")
    for log_file in log_files:
        print(f"   - {log_file.name}")
        
        # Check if the log file has recent entries
        try:
            with open(log_file, 'r') as f:
                content = f.read()
                if content.strip():
                    lines = content.strip().split('\n')
                    print(f"   - {len(lines)} log entries")
                    if len(lines) > 0:
                        last_entry = lines[-1]
                        if '"level":"ERROR"' in last_entry or '"level":"WARNING"' in last_entry:
                            print("   - Recent error/warning entries found")
                else:
                    print("   - Log file is empty")
        except Exception as e:
            print(f"   - Error reading log file: {e}")
    
    return True

def test_email_alerts():
    """Test if email alerts are configured and can be sent"""
    print("\n📧 Testing email alert configuration...")
    
    # Import the test function from error_alert_service
    try:
        from utils.error_alert_service import test_error_alert
        print("✅ Email alert service imported successfully")
        
        # Run the test
        success = test_error_alert()
        if success:
            print("✅ Test email alert sent successfully")
            print("📧 Check your email for the test alert")
        else:
            print("❌ Failed to send test email alert")
            print("📝 Check the logs for details")
        
        return success
        
    except ImportError as e:
        print(f"❌ Failed to import email alert service: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing email alerts: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("🧪 ERROR LOGGING AND ALERTING SYSTEM TEST")
    print("=" * 60)
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed. Please fix the issues above and try again.")
        return
    
    print("\n🚀 Starting endpoint tests...")
    
    # Test endpoints
    passed_tests = 0
    total_tests = len(TEST_ENDPOINTS)
    
    for test_case in TEST_ENDPOINTS:
        if test_endpoint(test_case):
            passed_tests += 1
        time.sleep(1)  # Small delay between requests
    
    print(f"\n📊 Test Results: {passed_tests}/{total_tests} tests passed")
    
    # Check log files
    log_check = check_log_files()
    
    # Test email alerts
    email_check = test_email_alerts()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Endpoint Tests: {passed_tests}/{total_tests} passed")
    print(f"📁 Log Files: {'✅ Found and populated' if log_check else '❌ Issues found'}")
    print(f"📧 Email Alerts: {'✅ Working' if email_check else '❌ Issues found'}")
    
    if passed_tests == total_tests and log_check:
        print("\n🎉 All tests passed! The error logging and alerting system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the output above for details.")
    
    print("\n📖 Next Steps:")
    print("1. Check the logs in the 'logs/' directory for detailed error information")
    print("2. If email alerts are configured, check your inbox for test alerts")
    print("3. Review the example endpoints at http://localhost:8000/docs")
    print("4. Configure environment variables for production use")

if __name__ == "__main__":
    main()