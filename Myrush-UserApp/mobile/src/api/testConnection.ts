/**
 * API Connection Test Utility
 * Use this to debug network connection issues
 */

import { API_BASE_URL } from './apiClient';

export const testApiConnection = async () => {
    console.log('='.repeat(50));
    console.log('🧪 API Connection Test');
    console.log('='.repeat(50));
    console.log('📍 API Base URL:', API_BASE_URL);
    console.log('');

    // Test 1: Root endpoint
    try {
        console.log('Test 1: Root endpoint');
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        console.log('✅ Root: SUCCESS', data);
    } catch (error: any) {
        console.error('❌ Root: FAILED', error.message);
    }

    console.log('');

    // Test 2: Send OTP
    try {
        console.log('Test 2: Send OTP');
        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: '+1234567890' }),
        });
        const data = await response.json();
        console.log('✅ Send OTP: SUCCESS', data);
    } catch (error: any) {
        console.error('❌ Send OTP: FAILED', error.message);
    }

    console.log('');

    // Test 3: Verify OTP
    try {
        console.log('Test 3: Verify OTP');
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: '+1234567890',
                otp_code: '12345',
            }),
        });
        const data = await response.json();
        console.log('✅ Verify OTP: SUCCESS', data);
    } catch (error: any) {
        console.error('❌ Verify OTP: FAILED', error.message);
    }

    console.log('');
    console.log('='.repeat(50));
    console.log('Test complete!');
    console.log('='.repeat(50));
};

// Export for use in development
export default testApiConnection;
