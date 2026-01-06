import { apiClient, API_BASE_URL } from './apiClient';

const DUMMY_OTP = '12345';

export const otpApi = {
	/**
	 * Request an OTP for a phone number
	 * @param phoneNumber Phone number with country code (e.g., +919876543210)
	 */
	sendOTP: async (phoneNumber: string) => {
		try {
			console.log('[OTP API] Sending OTP to', phoneNumber);
			console.log('[OTP API] Using API URL:', API_BASE_URL);

			// Call backend send-otp endpoint
			const data = await apiClient.post<{
				message: string;
				success: boolean;
				verification_id?: string;
				otp_code?: string;
			}>('/auth/send-otp', {
				phone_number: phoneNumber,
			});

			console.log('[OTP API] OTP sent successfully:', data);
			return {
				success: true,
				message: data.message || 'OTP sent successfully',
				otp: data.otp_code || DUMMY_OTP, // Backend returns OTP in dev mode
				verification_id: data.verification_id,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.message || 'Failed to send OTP',
			};
		}
	},

	/**
	 * Verify the OTP code
	 * @param phoneNumber Phone number
	 * @param otpCode OTP code entered by user
	 */
	verifyOTP: async (phoneNumber: string, otpCode: string) => {
		try {
			console.log('[OTP API] Verifying OTP for', phoneNumber);
			console.log('[OTP API] Using API URL:', API_BASE_URL);

			// Call backend verify-otp endpoint
			const data = await apiClient.post<{
				access_token?: string;
				token_type?: string;
				needs_profile?: boolean;
				phone_number?: string;
				message?: string;
			}>('/auth/verify-otp', {
				phone_number: phoneNumber,
				otp_code: otpCode,
			});

			console.log('[OTP API] Verification response:', data);

			// Check if user needs to complete profile (new user)
			if (data.needs_profile) {
				console.log('[OTP API] New user - needs profile completion');
				return {
					success: true,
					needs_profile: true,
					phone_number: data.phone_number || phoneNumber,
					message: data.message || 'Please complete your profile',
				};
			}

			// Existing user with access token
			console.log('[OTP API] Existing user - login successful');
			return {
				success: true,
				message: 'OTP verified successfully',
				access_token: data.access_token,
				token_type: data.token_type,
				needs_profile: false,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.message || 'An error occurred during verification',
			};
		}
	},

	/**
	 * Verify OTP with profile data for new user registration
	 * @param phoneNumber Phone number
	 * @param otpCode OTP code entered by user
	 * @param profileData Profile data for new user
	 */
	verifyOTPWithProfile: async (phoneNumber: string, otpCode: string, profileData: any) => {
		try {
			console.log('[OTP API] Verifying OTP with profile data for', phoneNumber);
			console.log('[OTP API] Profile data:', profileData);
			console.log('[OTP API] Using API URL:', API_BASE_URL);

			// Call backend verify-otp endpoint with profile data
			const data = await apiClient.post<{
				access_token: string;
				token_type: string;
				message?: string;
			}>('/auth/verify-otp', {
				phone_number: phoneNumber,
				otp_code: otpCode,
				...profileData, // Include all profile fields
			});

			console.log('[OTP API] Registration successful with profile');

			return {
				success: true,
				message: data.message || 'Account created successfully',
				access_token: data.access_token,
				token_type: data.token_type,
			};
		} catch (error: any) {
			console.error('[OTP API] Exception:', error);
			return {
				success: false,
				message: error.message || 'Failed to create account',
			};
		}
	},
};

export default otpApi;
