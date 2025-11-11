import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { RadioButton } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomPopUp from './../../../../components/ui/CustomPopUp';
import Colors from './../../../../constants/color';
import { userRegisterApi } from './../../../../lib/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ukMobileRegex = /^07\d{9}$/;

function validateForm(form, skipPolicy = false) {
	const errors = {};
	if (!form.firstName) errors.firstName = 'First name is required';
	if (!form.lastName) errors.lastName = 'Last name is required';
	if (!form.email) errors.email = 'Email is required';
	else if (!emailRegex.test(form.email)) errors.email = 'Invalid email format';
	if (!form.mobile) errors.mobile = 'Mobile number is required';
	else if (!ukMobileRegex.test(form.mobile))
		errors.mobile = 'Enter a valid UK mobile number (11 digits, starts with 07)';
	if (!form.password) errors.password = 'Password is required';
	if (!form.confirmPassword) errors.confirmPassword = 'Confirm password is required';
	else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
	if (!skipPolicy && !form.agreePolicy) errors.agreePolicy = 'You must agree to the terms and policies';
	return errors;
}

export default function RegisterScreen() {
	const router = useRouter();
	const [popupVisible, setPopupVisible] = useState(false);
	const [popupTitle, setPopupTitle] = useState('');
	const [popupMessage, setPopupMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		password: '',
		confirmPassword: '',
		agreePolicy: false,
		emailConsent: 1,
		smsConsent: 1,
	});

	const [fieldErrors, setFieldErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleChange = (key, value) => {
		setForm((prev) => ({...prev, [key]: value}));
		setFieldErrors((prev) => ({...prev, [key]: undefined}));
	};

	const isFormValid = useMemo(() => {
		return (
			form.firstName &&
			form.lastName &&
			form.email &&
			form.mobile &&
			form.password &&
			form.confirmPassword &&
			form.agreePolicy
		);
	}, [form]);

	const handleSubmit = async () => {
		const errors = validateForm(form, false);
		setFieldErrors(errors);

		if (Object.keys(errors).length > 0) {
			// Only set field errors, no popup
			return;
		}

		setLoading(true);

		const payload = {
			first_name: form.firstName,
			last_name: form.lastName,
			email: form.email,
			mobile_no: form.mobile,
			telephone_no: form.mobile,
			postcode: '',
			address1: '',
			address2: '',
			city: '',
			country: '',
			password: form.password,
			dob_date: '',
			doa: '',
			ip_address: '',
			platform: Platform.OS === 'ios' ? 1 : 2,
			want_newslatter: form.emailConsent,
			want_text_message: form.smsConsent,
		};

		console.log("payload........", payload)

		try {
			const response = await userRegisterApi(payload);

			console.log("resgister response", response)

			if (response.status === 'Success') {
				setPopupTitle('Success');
				setPopupMessage('Registered successfully!');
			} else {
				setPopupTitle('Registration Failed');
				setPopupMessage(response?.msg || 'Please try again.');
			}
		} catch (_error) {
			setPopupTitle('Error');
			setPopupMessage('Something went wrong during registration.');
		} finally {
			setPopupVisible(true);
			setLoading(false);
		}
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
			{/* First/Last Name */}
			<View style={styles.row}>
				<View style={{flex: 1, marginRight: 8}}>
					<Text style={styles.label}>
						First Name <Text style={styles.required}>*</Text>
					</Text>
					<TextInput
						style={[styles.input, fieldErrors.firstName && styles.inputError]}
						placeholder="First Name"
						placeholderTextColor={Colors.placeholder}
						value={form.firstName}
						onChangeText={(text) => handleChange('firstName', text)}
					/>
					{fieldErrors.firstName && <Text style={styles.errorText}>{fieldErrors.firstName}</Text>}
				</View>
				<View style={{flex: 1, marginLeft: 8}}>
					<Text style={styles.label}>
						Last Name <Text style={styles.required}>*</Text>
					</Text>
					<TextInput
						style={[styles.input, fieldErrors.lastName && styles.inputError]}
						placeholder="Last Name"
						placeholderTextColor={Colors.placeholder}
						value={form.lastName}
						onChangeText={(text) => handleChange('lastName', text)}
					/>
					{fieldErrors.lastName && <Text style={styles.errorText}>{fieldErrors.lastName}</Text>}
				</View>
			</View>

			{/* Email */}
			<Text style={styles.label}>
				Email <Text style={styles.required}>*</Text>
			</Text>
			<TextInput
				style={[styles.input, fieldErrors.email && styles.inputError]}
				placeholder="Email"
				placeholderTextColor={Colors.placeholder}
				keyboardType="email-address"
				autoCapitalize="none"
				value={form.email}
				onChangeText={(text) => handleChange('email', text)}
			/>
			{fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

			{/* Mobile */}
			<Text style={styles.label}>
				Mobile No <Text style={styles.required}>*</Text>
			</Text>
			<TextInput
				style={[styles.input, fieldErrors.mobile && styles.inputError]}
				placeholder="07xxxxxxxxx"
				placeholderTextColor={Colors.placeholder}
				keyboardType="phone-pad"
				value={form.mobile}
				onChangeText={(text) => handleChange('mobile', text)}
				maxLength={11}
			/>
			{fieldErrors.mobile && <Text style={styles.errorText}>{fieldErrors.mobile}</Text>}

			{/* Password + Confirm */}
			<View style={styles.row}>
				<View style={{flex: 1, marginRight: 8}}>
					<Text style={styles.label}>
						Password <Text style={styles.required}>*</Text>
					</Text>
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.passwordInput}
							placeholder="Password"
							placeholderTextColor={Colors.placeholder}
							secureTextEntry={!showPassword}
							value={form.password}
							onChangeText={(text) => handleChange('password', text)}
						/>
						<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
							<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
						</TouchableOpacity>
					</View>
					{fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
				</View>

				<View style={{flex: 1, marginLeft: 8}}>
					<Text style={styles.label}>
						Confirm Password <Text style={styles.required}>*</Text>
					</Text>
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.passwordInput}
							placeholder="Confirm Password"
							placeholderTextColor={Colors.placeholder}
							secureTextEntry={!showConfirmPassword}
							value={form.confirmPassword}
							onChangeText={(text) => handleChange('confirmPassword', text)}
						/>
						<TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
							<Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#888" />
						</TouchableOpacity>
					</View>
					{fieldErrors.confirmPassword && <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>}
				</View>
			</View>

			{/* Policy Checkbox */}
			<View style={styles.checkboxContainer}>
				<TouchableOpacity onPress={() => handleChange('agreePolicy', !form.agreePolicy)}>
					<View style={[styles.checkbox, form.agreePolicy && styles.checkboxChecked]} />
				</TouchableOpacity>
				<Text style={styles.policyText}>
					I Agree to the{' '}
					<Text
						style={styles.link}
						onPress={() =>
							router.push({
								pathname: '/profile/register/detail',
								params: {settingsId: 6, settingsName: 'Terms & Conditions', from: 'register'},
							})
						}
					>
						Terms & Conditions
					</Text>
					,{' '}
					<Text
						style={styles.link}
						onPress={() =>
							router.push({
								pathname: '/profile/register/detail',
								params: {settingsId: 7, settingsName: 'Privacy Policy', from: 'register'},
							})
						}
					>
						Privacy Policy
					</Text>{' '}
					&{' '}
					<Text
						style={styles.link}
						onPress={() =>
							router.push({
								pathname: '/profile/register/detail',
								params: {settingsId: 8, settingsName: 'Cookies Policy', from: 'register'},
							})
						}
					>
						Cookies Policy
					</Text>{' '}
				</Text>
			</View>
			{fieldErrors.agreePolicy && <Text style={styles.errorText}>{fieldErrors.agreePolicy}</Text>}

			{/* Email Consent */}
			<View style={styles.radioGroup}>
				<Text style={styles.radioLabel}>
					I wish to receive emails/newsletters on offers, discounts, promotions and prize draw.
				</Text>
				<View style={styles.radioRow}>
					<View style={styles.radioButtonWrapper}>
						<RadioButton
							value="1"
							status={form.emailConsent === 1 ? 'checked' : 'unchecked'}
							onPress={() => handleChange('emailConsent', 1)}
							color={Colors.primary}
							uncheckedColor="#888"
						/>
					</View>
					<Text style={styles.radioText}>Yes</Text>

					<View style={styles.radioButtonWrapper}>
						<RadioButton
							value="0"
							status={form.emailConsent === 0 ? 'checked' : 'unchecked'}
							onPress={() => handleChange('emailConsent', 0)}
							color={Colors.primary}
							uncheckedColor="#888"
						/>
					</View>
					<Text style={styles.radioText}>No</Text>
				</View>
			</View>

			{/* SMS Consent */}
			<View style={styles.radioGroup}>
				<Text style={styles.radioLabel}>
					I wish to receive text messages on offers, discounts, promotions and prize draw.
				</Text>
				<View style={styles.radioRow}>
					<View style={styles.radioButtonWrapper}>
						<RadioButton
							value="1"
							status={form.smsConsent === 1 ? 'checked' : 'unchecked'}
							onPress={() => handleChange('smsConsent', 1)}
							color={Colors.primary}
							uncheckedColor="#888"
						/>
					</View>
					<Text style={styles.radioText}>Yes</Text>

					<View style={styles.radioButtonWrapper}>
						<RadioButton
							value="0"
							status={form.smsConsent === 0 ? 'checked' : 'unchecked'}
							onPress={() => handleChange('smsConsent', 0)}
							color={Colors.primary}
							uncheckedColor="#888"
						/>
					</View>
					<Text style={styles.radioText}>No</Text>
				</View>
			</View>

			{/* Submit Button */}
			<TouchableOpacity
				style={[styles.submitBtn, {backgroundColor: isFormValid ? Colors.primary : '#ddd'}]}
				disabled={!isFormValid || loading}
				onPress={handleSubmit}
			>
				{loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>REGISTER</Text>}
			</TouchableOpacity>

			<CustomPopUp
				visible={popupVisible}
				title={popupTitle}
				message={popupMessage}
				onConfirm={() => {
					setPopupVisible(false);
					if (popupTitle === 'Success') {
						router.replace('/profile/login');
					}
				}}
				confirmText="OK"
				showCancel={false}
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
		padding: 10,
	},
	scrollContainer: {
		padding: 20,
		backgroundColor: '#fff',
		borderRadius: 8,
	},
	row: {
		flexDirection: 'row',
	},
	label: {
		color: '#22223B',
		fontWeight: '600',
		marginBottom: 2,
	},
	required: {
		color: 'red',
	},
	input: {
		backgroundColor: '#fff',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 12,
		marginBottom: 4,
		color: '#22223B',
	},
	inputError: {
		borderColor: 'red',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		marginBottom: 4,
	},
	passwordInput: {
		flex: 1,
		height: 48,
		color: '#22223B',
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginTop: 8,
		marginBottom: 8,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1,
		borderColor: '#ccc',
		marginTop: 3,
		marginRight: 8,
	},
	checkboxChecked: {
		backgroundColor: Colors.primary,
	},
	policyText: {
		flex: 1,
		color: '#22223B',
		fontSize: 14,
	},
	link: {
		color: 'red',
		fontWeight: 'bold',
	},
	radioGroup: {
		marginBottom: 12,
		borderRadius: 6,
		padding: 12,
		borderColor: '#ccc',
		borderWidth: 1,
	},
	radioRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	radioLabel: {
		color: '#22223B',
		fontSize: 14,
	},
	radioText: {
		color: '#22223B',
		marginRight: 16,
	},
	submitBtn: {
		paddingVertical: 14,
		borderRadius: 6,
		alignItems: 'center',
		marginTop: 10,
	},
	submitText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	errorText: {
		color: 'red',
		fontSize: 12,
		marginBottom: 4,
	},
	radioButtonWrapper: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 100,
		padding: 0,
		backgroundColor: '#fff',
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
