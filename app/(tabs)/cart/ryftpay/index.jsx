import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Colors from '../../../../constants/color';
import { getRyftpayPublic, ryftpayPaymentSuccess } from '../../../../lib/utils/ryftpay-api'; // Adjust import path

export default function Ryftpay() {
	const {responseData, configData, transactionId} = useLocalSearchParams();

	const navigation = useNavigation();
	const router = useRouter();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: true,
			title: 'RyftPay',
			headerBackTitleVisible: false,
		});
	}, [navigation]);
	const originalResponseData = responseData ? JSON.parse(responseData) : {};
	const parsedData = JSON.parse(configData || '{}');
	const innerData = parsedData.data ? JSON.parse(parsedData.data) : {};
	const [name, setName] = useState('');
	const [cardNumber, setCardNumber] = useState('');
	const [expiryMonth, setExpiryMonth] = useState('');
	const [expiryYear, setExpiryYear] = useState('');
	const [csc, setCsc] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Validation helpers
	const getRawCardNumber = () => cardNumber.replace(/\s+/g, '');

	// Luhn Algorithm for card number validation
	const luhnCheck = (cardNumber) => {
		let sum = 0;
		let shouldDouble = false;
		for (let i = cardNumber.length - 1; i >= 0; i--) {
			let digit = parseInt(cardNumber[i], 10);
			if (shouldDouble) {
				digit *= 2;
				if (digit > 9) digit -= 9;
			}
			sum += digit;
			shouldDouble = !shouldDouble;
		}
		return sum % 10 === 0;
	};

	// Card validation function with detailed logs
	const validateCard = () => {
		const rawCardNumber = getRawCardNumber();
		if (!rawCardNumber || rawCardNumber.length < 13) {
			Alert.alert('Invalid card number', 'Please enter a valid card number.');
			return false;
		}
		if (!luhnCheck(rawCardNumber)) {
			Alert.alert('Invalid card number', 'The card number failed validation.');
			return false;
		}
		if (!expiryMonth || !expiryYear) {
			Alert.alert('Expiry date missing', 'Please enter expiry month and year.');
			return false;
		}
		const monthNum = Number(expiryMonth);
		const yearNum = Number(expiryYear);

		if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
			Alert.alert('Invalid expiry date', 'Please enter a valid expiry month (01-12) and year.');
			return false;
		}
		// Create expiry date as the last day of the expiry month
		const expiryDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
		const today = new Date();
		if (expiryDate < today) {
			Alert.alert('Card expired', 'The expiry date you entered is in the past.');
			return false;
		}
		if (!csc || !/^\d{3,4}$/.test(csc)) {
			Alert.alert('Invalid CSC', 'Please enter a valid 3 or 4 digit CSC.');
			return false;
		}
		return true;
	};
	// Handle form submission
	const handlePayment = async () => {
		if (!validateCard()) {
			return;
		}
		const rawCardNumber = getRawCardNumber();

		try {
			setIsLoading(true);

			const getCardScheme = (cardNumber) => {
				if (cardNumber.startsWith('4')) return 'Visa';
				if (cardNumber.startsWith('5')) return 'Mastercard';
				return null;
			};

			const cardScheme = getCardScheme(rawCardNumber);
			if (!cardScheme) {
				Alert.alert('Unsupported card scheme', 'Only Visa and Mastercard are supported.');
				setIsLoading(false);
				return;
			}

			const ryftpayMakePaymentBody = {
				clientSecret: originalResponseData.clientSecret,
				cardDetails: {
					number: rawCardNumber,
					expiryMonth,
					expiryYear,
					cvc: csc,
					name,
					cardScheme,
				},
				threeDsRequestDetails: {
					deviceChannel: 'Browser',
					browserDetails: {
						acceptHeader: 'application/json,text/plain,text/html,*/*',
						colorDepth: 24,
						javaEnabled: true,
						language: 'en-US',
						screenHeight: 900,
						screenWidth: 1440,
						timeZoneOffset: -120,
						userAgent:
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
					},
				},
			};
			const ryftpayResponse = await getRyftpayPublic(ryftpayMakePaymentBody);
			if (ryftpayResponse?.data?.status === 'Approved' || ryftpayResponse?.data?.status === 'Captured') {
				await ryftpayPaymentSuccess(
					transactionId, // Passing transaction ID from route
					configData // Ensure that responseData is correctly structured
				);
				router.push({
					pathname: '/card-order-success',
					params: {
						orderId: innerData.metadata?.orderId || 'N/A',
						status: 'success',
						message: 'Your order has been successfully placed.',
						transactionId: transactionId || 'N/A',
					},
				});
			} else if (ryftpayResponse?.data?.status === 'PendingAction') {
				router.push({
					pathname: '/cart/ryftpay-proccessing',
					params: {
						responseData: JSON.stringify(ryftpayResponse?.data),
						configData: configData,
						transactionId: transactionId,
						clientSecret: originalResponseData.clientSecret,
					},
				});
			} else {
				router.push({
					pathname: '/card-order-success',
					params: {
						orderId: innerData.metadata?.orderId || 'N/A',
						status: 0,
						message: 'Your order has been failed! try again.',
						transactionId: transactionId || 'N/A',
					},
				});
			}
		} catch (_error) {
			router.push({
				pathname: '/card-order-success',
				params: {
					orderId: innerData.metadata?.orderId || 'N/A',
					status: 0,
					message: 'Your order has been failed! try again.',
					transactionId: transactionId || 'N/A',
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	const gotoCheckout = () => {
		router.push({pathname: '/cart/checkout'});
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
		>
			<ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
				{isLoading && (
					<View style={styles.loaderOverlay}>
						<ActivityIndicator size="large" color="#2a74da" />
						<Text style={styles.loaderText}>Processing your payment, please wait...</Text>
					</View>
				)}
				<View style={styles.logoContainer}>
					<Image
						source={{
							uri:
								'https://images.squarespace-cdn.com/content/v1/61757b7e307770260181060f/62346172-284f-4c1f-ad4b-543b35606a6a/Group+352.png?format=1500w',
						}}
						style={styles.logo}
						resizeMode="contain"
					/>
				</View>

				<Text style={styles.heading}>Purchase Details</Text>
				<View style={styles.infoRow}>
					<Text style={styles.label}>Order ID:</Text>
					<Text style={styles.value}>{innerData.metadata?.orderId || 'N/A'}</Text>
				</View>
				<View style={styles.infoRow}>
					<Text style={styles.label}>Amount:</Text>
					<Text style={styles.value}>
						{innerData.amount ? `£${(originalResponseData.amount / 100).toFixed(2)}` : 'N/A'}
					</Text>
				</View>

				<Text style={[styles.heading, {marginTop: 30}]}>Enter Payment Details</Text>

				<TextInput
					style={styles.input}
					placeholder="Cardholder Name"
					value={name}
					onChangeText={setName}
					autoCapitalize="words"
					returnKeyType="next"
					textContentType="name"
					placeholderTextColor={Colors.placeholder}
				/>

				<TextInput
					style={styles.input}
					placeholder="Card Number"
					value={cardNumber}
					onChangeText={setCardNumber}
					keyboardType="numeric"
					maxLength={19}
					returnKeyType="next"
					textContentType="creditCardNumber"
					placeholderTextColor={Colors.placeholder}
				/>

				<View style={styles.row}>
					<TextInput
						style={[styles.input, styles.halfInput, {marginRight: 10}]}
						placeholder="Expiry Month"
						value={expiryMonth}
						onChangeText={setExpiryMonth}
						keyboardType="numeric"
						maxLength={2}
						returnKeyType="next"
						placeholderTextColor={Colors.placeholder}
					/>
					<TextInput
						style={[styles.input, styles.halfInput, {marginRight: 10}]}
						placeholder="Expiry Year"
						value={expiryYear}
						onChangeText={setExpiryYear}
						keyboardType="numeric"
						maxLength={4}
						returnKeyType="next"
						placeholderTextColor={Colors.placeholder}
					/>
					<TextInput
						style={[styles.input, styles.smallInput]}
						placeholder="CSC"
						value={csc}
						onChangeText={setCsc}
						keyboardType="numeric"
						maxLength={4}
						secureTextEntry={true}
						returnKeyType="done"
						placeholderTextColor={Colors.placeholder}
					/>
				</View>

				<View style={styles.buttonRow}>
					<TouchableOpacity style={[styles.button, styles.payButton]} onPress={handlePayment} disabled={isLoading}>
						<Text style={styles.buttonText}>Pay Now</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={gotoCheckout} disabled={isLoading}>
						<Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fafafa',
	},
	scrollContainer: {
		paddingHorizontal: 20,
		paddingVertical: 30,
	},
	loaderOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255,255,255,0.9)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	loaderText: {
		marginTop: 10,
		fontSize: 16,
		color: '#555',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 30,
	},
	logo: {
		width: 140,
		height: 140,
	},
	heading: {
		fontSize: 22,
		fontWeight: '700',
		color: '#222',
		marginBottom: 15,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	label: {
		fontSize: 16,
		color: '#555',
		fontWeight: '600',
	},
	value: {
		fontSize: 16,
		fontWeight: '700',
		color: '#000',
	},
	input: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 8,
		paddingVertical: 14,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#222',
		marginBottom: 15,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowOffset: {width: 0, height: 1},
		shadowRadius: 2,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 25,
	},
	halfInput: {
		flex: 1,
	},
	smallInput: {
		width: 80,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginHorizontal: 5,
		elevation: 1,
	},
	payButton: {
		backgroundColor: '#2a74da',
	},
	cancelButton: {
		backgroundColor: '#e0e0e0',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 16,
	},
	cancelButtonText: {
		color: '#333',
	},
});
