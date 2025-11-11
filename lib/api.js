import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Define the base URL for the API
const BASE_URL = 'http://smartrestaurantsolutions.com/mobileapi-v2/v2/';
// const BASE_URL = 'http://smartrestaurantsolutions.com/mobileapi-v2/v3/';
// const BASE_URL = 'http://chefonlinetest.co.uk/b2c_api/';

const axiosInstance = axios.create({
	baseURL: BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// App version from expo config
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Utility: safely encode query params
const encodeParams = (params) =>
	Object.entries(params)
		.map(([key, value]) => `${key}=${encodeURIComponent(value ?? '')}`)
		.join('&');

// Get Silder Image
export const getSliderImageApi = async () => {
	try {
		const endpoint = `Tigger.php?funId=122`;
		console.log('🚀 API Request URL for getSliderImageApi:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: getSliderImageApi', error);
		throw new Error('Failed to fetch slider image');
	}
};

// Search Restaurants
export const searchRestaurantsApi = async ({ searchText, orderType, cuisineType, pageNo }) => {
	try {
		const params = {
			funId: 6,
			searchText,
			orderType,
			cuisineType,
			pageNo,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for searchRestaurant:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: searchRestaurantsApi', error);
		throw new Error('Failed to fetch search results');
	}
};

// Cuisine List
export const cuisineListApi = async () => {
	try {
		const endpoint = `Tigger.php?funId=124`;
		console.log('🚀 API Request URL for cousine list:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: cuisineListApi', error);
		throw new Error('Failed to fetch cuisine list');
	}
};

// ------------------------------------------
// Individual Restaurant Details
export const individualRestaurantsApi = async (restId) => {
	try {
		const endpoint = `Tigger.php?funId=81&rest_id=${encodeURIComponent(restId)}`;
		console.log('🚀 API Request URL: individual Restaurant', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: individualRestaurantsApi', error);
		throw new Error('Failed to fetch restaurant details');
	}
};

export const getPaymentMethodOption = async (restId) => {
	try {
		const params = {
			funId: 78,
			rest_id: restId,
		};
		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL get payment method option:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: getPaymentMethodOption', error);
		throw new Error('Failed to fetch payment method option');
	}
};

// ------------------------------------------
// User Login
export const userLoginApi = async (email, password) => {
	try {
		const params = {
			funId: 3,
			username: email,
			password: password,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL user login:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: userLoginApi', error);
		throw new Error('Failed to log in');
	}
};

// ------------------------------------------
// User Registration
export const userRegisterApi = async (formData) => {
	try {
		const params = {
			funId: 8,
			fname: formData.first_name,
			lname: formData.last_name,
			email: formData.email,
			mobile_no: formData.mobile_no,
			telephone_no: formData.telephone_no,
			postcode: formData.postcode,
			address1: formData.address1,
			address2: formData.address2,
			city: formData.city,
			country: formData.country,
			password: formData.password,
			dob_date: formData.dob_date || '',
			doa: formData.doa || '',
			ip_address: formData.ip_address || '',
			platform: formData.platform || 'mobile',
			want_newslatter: formData.want_newslatter,
			want_text_message: formData.want_text_message,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL user register:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: userRegisterApi', error);
		throw new Error('Failed to register user');
	}
};

// User Edit Profile
export const userEditProfileApi = async (formData) => {
	try {
		const params = {
			funId: 15,
			userid: formData.userid,
			title: formData.title || '',
			fname: formData.first_name,
			lname: formData.last_name,
			email: formData.email,
			mobile_no: formData.mobile_no,
			telephone_no: formData.telephone_no,
			address1: formData.address1,
			address2: formData.address2,
			city: formData.city,
			country: formData.country,
			postcode: formData.postcode || '',
			dob_date: formData.dob_date || '',
			doa: formData.doa || '',
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL edit user profile:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: userEditProfileApi', error);
		throw new Error('Failed to update user profile');
	}
};

export const restaurantPostCode = async (restId) => {
	try {
		const params = {
			funId: 48,
			restaurant_id: restId,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for restaurant post code:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: userLoginApi', error);
		throw new Error('Failed to log in');
	}
};

export const postCodeCharge = async (restId, postCode) => {
	try {
		const params = {
			funId: 47,
			restaurant_id: restId,
			postcode: postCode,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request for postCodeCharge:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error: userLoginApi', error);
		throw new Error('Failed to log in');
	}
};

export const checkVoucher = async ({ restId, userId, voucherCode, grandTotal, email }) => {
	try {
		const params = {
			funId: 117,
			rest_id: restId,
			user_id: userId,
			voucherCode: voucherCode,
			grand_total: grandTotal,
			email: email,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API  Request for checkout voucher:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error validating voucher:', error);
		throw new Error('Failed to check voucher');
	}
};

export const carrierBag = async ({ restId }) => {
	try {
		const params = {
			funId: 130,
			rest_id: restId,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request carry bag:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error validating voucher:', error);
		throw new Error('Failed to check voucher');
	}
};

export const getReview = async ({ restId }) => {
	try {
		const params = {
			funId: 102,
			rest_id: restId,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request for review:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error validating voucher:', error);
		throw new Error('Failed to check voucher');
	}
};

export const getOrderList = async ({ userid }) => {
	try {
		const params = {
			funId: 13,
			userid: userid,
		};
		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for order list:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error validating voucher:', error);
		throw new Error('Failed to check voucher');
	}
};

export const getOrderDetail = async ({ orderid }) => {
	try {
		const params = {
			funId: 14,
			order_id: orderid,
		};
		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for get order detail:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		console.log('response getOrderDetail', response.data);
		return response.data;
	} catch (error) {
		console.error('Error validating voucher:', error);
		throw new Error('Failed to check voucher');
	}
};

export const makeReservation = async ({
	restId,
	title,
	firstName,
	lastName,
	email,
	mobileNo,
	telephone,
	reservationDate,
	reservationTime,
	guest,
	specialRequest,
	platform = Platform.OS === 'ios' ? 1 : 2,
	ipAddress = '0.0.0.0',
}) => {
	try {
		const params = {
			funId: 75,
			rest_id: restId,
			title,
			first_name: firstName,
			last_name: lastName,
			email,
			mobile_no: mobileNo,
			telephone,
			reservation_date: reservationDate,
			reservation_time: reservationTime,
			guest,
			special_request: specialRequest,
			platform,
			ip_address: ipAddress,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request for make reservation:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		console.log('Reservation Response:', response.data);

		return response.data;
	} catch (error) {
		console.error('Reservation Error:', error);
		throw new Error('Failed to make reservation');
	}
};

export const reviewSubmit = async ({ orderId, restId, qualityOfFood, qualityOfService, valueOfMoney, reviewComment }) => {
	try {
		const params = {
			funId: 105,
			order_id: orderId,
			restaurant_id: restId,
			quality_of_food: qualityOfFood,
			quality_of_service: qualityOfService,
			value_of_money: valueOfMoney,
			review_comment: reviewComment || '',
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for review submit:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('Error submitting review:', error);
		throw new Error('Failed to submit review');
	}
};

export const resetPassword = async ({ email, previousPassword, newPassword }) => {
	try {
		const params = {
			funId: 10,
			email,
			previouspassword: previousPassword,
			newpassword: newPassword,
		};
		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for reset password:', BASE_URL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		throw new Error('Failed to reset password');
	}
};

export const confirmOrder = async (orderData) => {
	try {
		// Prepare base parameters
		const baseParams = {
			funId: 98,
			user_id: orderData.user_id,
			order_policy_id: orderData.order_policy_id,
			OrderList: JSON.stringify(orderData.OrderList), // Must be stringified!
			post_code: orderData.post_code,
			address: orderData.address,
			city: orderData.city,
			payment_option: orderData.payment_option,
			total_amount: orderData.total_amount,
			grand_total: orderData.grand_total,
			discount_id: orderData.discount_id || '',
			voucher_id: orderData.voucher_id || '',
			offer_id: orderData.offer_id || '',
			carrierBag: orderData.carrierBag || '0',
			pre_order_delivery_time: orderData.pre_order_delivery_time || '',
			comments: orderData.comments || '',
			payment_status: 0,
			paypal_transection_id: 0,
			verification_code: orderData.verification_code || '',
			platform: orderData.platform || 'mobile',
			delivery_charge: orderData.delivery_charge || '0.00',
			donate_comments: 'null',
			donate_amount: orderData.donate_amount || '',
			ip_address: orderData.ip_address || '',
			inside_uk: orderData.inside_uk || '1',
			card_fee: 0,
			is_varification_required: false,
			is_special_message_required: false,
			user_address_ext_id: 0,
			updated_api: 1,
			rest_id: orderData.rest_id,
		};

		// Encode parameters as query string
		const encodeParams = (params) =>
			Object.entries(params)
				.map(([key, value]) => {
					if (key === 'OrderList') {
						return `${key}=${encodeURIComponent(value)}`; // Make sure OrderList is URL encoded
					}
					if (value === null || value === undefined || value === '') {
						return encodeURIComponent(key);
					}
					return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
				})
				.join('&');

		// Clean the parameters (remove null or undefined values)
		const cleanedParams = Object.fromEntries(
			Object.entries(baseParams).filter(([_, v]) => v !== undefined && v !== null)
		);

		// Prepare the final endpoint with parameters
		const endpoint = `Tigger.php?${encodeParams(cleanedParams)}`;

		console.log('🚀 API Request URL for confirm order:', BASE_URL + endpoint);

		// Perform the GET request
		const response = await axios.get(BASE_URL + endpoint, {
			headers: {
				'Content-Type': 'application/json',
			},
			params: {
				language_code: 'en', // Optional additional parameters
			},
		});

		console.log('first');

		console.log('Confirm Order Response:', response.data);
		return response.data;
	} catch (error) {
		console.error('❌ Error: confirmOrder API failed:', error);
		throw new Error('Failed to confirm order');
	}
};


export const verifyEmail = async ({ email }) => {
	try {
		const params = {
			funId: 126,
			email,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('📩 API Request URL for verify email:', BASE_URL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in forgetPasswordApi:', error);
		throw new Error('Failed to process forgot password request');
	}
};

export const sendOtpApi = async ({ email, user_id, mobile }) => {
	try {
		const params = {
			funId: 127,
			email,
			user_id,
			mobile,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('📨 API Request URL for sending OTP:', axiosInstance.defaults.baseURL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in sendOtpApi:', error);
		throw new Error('Failed to send OTP');
	}
};

export const verifyOtp = async ({ user_id, otp }) => {
	try {
		const params = {
			funId: 128,
			user_id,
			otp,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('📩 API Request URL for verify OTP:', axiosInstance.defaults.baseURL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in verifyOtp API:', error);
		throw new Error('Failed to verify OTP');
	}
};

export const updatePassword = async ({ user_id, email, password }) => {
	try {
		const params = {
			funId: 129,
			user_id,
			email,
			password,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🔐 API Request URL for update password:', axiosInstance.defaults.baseURL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in updatePassword API:', error);
		throw new Error('Failed to update password');
	}
};

export const getCarrierBagData = async ({ restId }) => {
	try {
		const params = {
			funId: 130,
			rest_id: restId,
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for carrier bag data:', axiosInstance.defaults.baseURL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in getCarrierBagData API:', error);
		throw new Error('Failed to get carrier bag data');
	}
};

export const checkForceUpdate = async () => {
	try {
		const params = {
			funId: 99,
			platform: 'ChefOnline',
			app_version: APP_VERSION,
			app_platform: Platform.OS == 'ios' ? 'iOS' : 'Android',
		};

		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for check force update:', axiosInstance.defaults.baseURL + endpoint);

		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in checkForceUpdate API:', error);
		throw new Error('Failed to check force update');
	}
};

export const deleteProfileRequest = async ({ user_id, ip_address }) => {
	try {
		const params = { funId: 146, user_id, ip_address };
		const endpoint = `Tigger.php?${encodeParams(params)}`;
		console.log('🚀 API Request URL for delete profile:', axiosInstance.defaults.baseURL + endpoint);
		const response = await axiosInstance.get(endpoint);
		return response.data;
	} catch (error) {
		console.error('❌ Error in deleteProfileRequest API:', error);
		throw new Error('Failed to delete profile');
	}
};


export default axiosInstance;
