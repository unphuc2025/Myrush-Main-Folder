#!/usr/bin/env node

/**
 * MyRush FCM Push Notification Test Script
 * Tests push notifications using the backend API
 */

const https = require('https');

// Backend API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://65.0.195.149:8000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your_jwt_token_here';

// Test FCM token (replace with actual token from your device)
const TEST_FCM_TOKEN = process.env.TEST_FCM_TOKEN || 'your_fcm_token_here';

function makeApiRequest(endpoint, method = 'GET', data = null, authToken = null) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const postData = data ? JSON.stringify(data) : null;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (authToken) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(url, options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        data: response
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testPushNotificationSystem() {
    console.log('🚀 Testing MyRush FCM Push Notification System');
    console.log('==============================================');

    try {
        // Step 1: Test backend connection
        console.log('\n📡 Step 1: Testing backend connection...');
        const healthCheck = await makeApiRequest('/');
        if (healthCheck.status === 200) {
            console.log('✅ Backend is reachable');
        } else {
            console.log('❌ Backend not reachable');
            return;
        }

        // Step 2: Register a test push token
        console.log('\n📝 Step 2: Registering test push token...');
        if (!TEST_USER_TOKEN || TEST_USER_TOKEN === 'your_jwt_token_here') {
            console.log('⚠️  No test user token provided. Skipping token registration.');
            console.log('   Set TEST_USER_TOKEN environment variable with a valid JWT token');
        } else {
            const tokenResponse = await makeApiRequest(
                '/notifications/tokens/',
                'POST',
                {
                    device_token: TEST_FCM_TOKEN,
                    device_type: 'android',
                    device_info: {
                        platform: 'android',
                        version: 'test',
                        model: 'Test Device'
                    }
                },
                TEST_USER_TOKEN
            );

            if (tokenResponse.status === 200) {
                console.log('✅ Push token registered successfully');
                console.log('📄 Token ID:', tokenResponse.data.id);
            } else {
                console.log('❌ Failed to register push token:', tokenResponse.data);
            }
        }

        // Step 3: Send test notification
        console.log('\n📤 Step 3: Sending test notification...');
        if (!TEST_USER_TOKEN || TEST_USER_TOKEN === 'your_jwt_token_here') {
            console.log('⚠️  No test user token provided. Skipping notification test.');
        } else {
            const notificationResponse = await makeApiRequest(
                '/notifications/test/',
                'POST',
                {},
                TEST_USER_TOKEN
            );

            console.log('📄 Notification response:', JSON.stringify(notificationResponse.data, null, 2));

            if (notificationResponse.status === 200 && notificationResponse.data.success) {
                console.log('✅ Test notification sent successfully!');
                console.log(`📊 Sent to ${notificationResponse.data.sent_count} device(s)`);
            } else {
                console.log('❌ Failed to send test notification');
                if (notificationResponse.data.errors) {
                    console.log('📋 Errors:', notificationResponse.data.errors);
                }
            }
        }

        // Step 4: Get notification statistics
        console.log('\n📊 Step 4: Getting notification statistics...');
        if (TEST_USER_TOKEN && TEST_USER_TOKEN !== 'your_jwt_token_here') {
            const statsResponse = await makeApiRequest(
                '/notifications/stats/',
                'GET',
                null,
                TEST_USER_TOKEN
            );

            if (statsResponse.status === 200) {
                console.log('✅ Notification statistics retrieved:');
                console.log('📄 Stats:', JSON.stringify(statsResponse.data, null, 2));
            } else {
                console.log('❌ Failed to get notification statistics');
            }
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n📋 SETUP INSTRUCTIONS:');
    console.log('======================');
    console.log('1. Set environment variables:');
    console.log('   export TEST_USER_TOKEN="your_jwt_token_here"');
    console.log('   export TEST_FCM_TOKEN="your_fcm_token_here"');
    console.log('   export API_BASE_URL="http://your-backend-url:5000"');
    console.log('');
    console.log('2. Get JWT token:');
    console.log('   - Login to your app');
    console.log('   - Check AsyncStorage or network logs for Bearer token');
    console.log('');
    console.log('3. Get FCM token:');
    console.log('   - Run app and check console logs');
    console.log('   - Look for: "✅ FCM token obtained: ..."');
    console.log('');
    console.log('4. Run test:');
    console.log('   node test_notifications.js');
    console.log('');
    console.log('5. Alternative: Use the NotificationTest component in the app');
    console.log('   - Add <NotificationTest /> to any screen');
    console.log('   - Test notifications directly from the app');

    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('===================');
    console.log('✅ Backend connection: HTTP 200');
    console.log('✅ Token registration: Success with token ID');
    console.log('✅ Test notification: Sent to 1+ devices');
    console.log('✅ Push notification arrives on device within 10 seconds');
}

if (require.main === module) {
    testPushNotificationSystem();
}

module.exports = { makeApiRequest };
