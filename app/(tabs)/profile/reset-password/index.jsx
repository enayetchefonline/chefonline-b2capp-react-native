import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { resetPassword } from '../../../../lib/api';

export default function ResetPasswordScreen() {
	const router = useRouter();
	const authUser = useSelector((state) => state.auth.user);

	// FORM VALUES
	const [currentPwd, setCurrentPwd] = useState('');
	const [newPwd, setNewPwd] = useState('');
	const [confirmPwd, setConfirmPwd] = useState('');

	// FIELD ERRORS
	const [currentPwdError, setCurrentPwdError] = useState('');
	const [newPwdError, setNewPwdError] = useState('');
	const [confirmPwdError, setConfirmPwdError] = useState('');

	// TOGGLES
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// LOADING + POPUP
	const [loading, setLoading] = useState(false);
	const [popupVisible, setPopupVisible] = useState(false);

	// ---------------------------
	// VALIDATION HELPERS
	// ---------------------------
	const validatePassword = (value) => {
		if (!value.trim()) return 'Password is required';
		if (/\s/.test(value)) return 'Spaces are not allowed';
		if (value.length < 6) return 'Password must be at least 6 characters';
		return '';
	};

	const validateConfirmPassword = (value, newPassword) => {
		if (!value.trim()) return 'Confirm password is required';
		if (/\s/.test(value)) return 'Spaces are not allowed';
		if (newPassword !== value) return 'Passwords do not match';
		return '';
	};

	// ---------------------------
	// REAL-TIME VALIDATION
	// ---------------------------
	const handleCurrentPwdChange = (text) => {
		setCurrentPwd(text);
		setCurrentPwdError(validatePassword(text));
	};

	const handleNewPwdChange = (text) => {
		setNewPwd(text);
		setNewPwdError(validatePassword(text));

		// re-check confirm field when new password changes
		setConfirmPwdError(validateConfirmPassword(confirmPwd, text));
	};

	const handleConfirmPwdChange = (text) => {
		setConfirmPwd(text);
		setConfirmPwdError(validateConfirmPassword(text, newPwd));
	};

	// ---------------------------
	// SUBMIT
	// ---------------------------
	const handleReset = async () => {
		const errCurrent = validatePassword(currentPwd);
		const errNew = validatePassword(newPwd);
		const errConfirm = validateConfirmPassword(confirmPwd, newPwd);

		setCurrentPwdError(errCurrent);
		setNewPwdError(errNew);
		setConfirmPwdError(errConfirm);

		if (errCurrent || errNew || errConfirm) return;

		setLoading(true);

		try {
			const response = await resetPassword({
				email: authUser?.email,
				previousPassword: currentPwd.trim(),
				newPassword: newPwd.trim(),
			});

			if (response?.msg?.toLowerCase().includes('success')) {
				setPopupVisible(true);
			} else {
				setPopupVisible(true);
			}
		} catch (error) {
			console.error(error);
			setPopupVisible(true);
		} finally {
			setLoading(false);
		}
	};

	// ---------------------------
	// PASSWORD INPUT FIELD UI
	// ---------------------------
	const renderPasswordField = (
		label,
		value,
		error,
		onChange,
		show,
		setShow
	) => (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>

			<View style={[styles.inputContainer, error && { borderColor: 'red' }]}>
				<TextInput
					style={styles.input}
					placeholder="••••••••"
					secureTextEntry={!show}
					value={value}
					onChangeText={onChange}
					placeholderTextColor="#D1D5DB"
				/>
				<TouchableOpacity onPress={() => setShow((prev) => !prev)}>
					<Ionicons
						name={show ? 'eye-off-outline' : 'eye-outline'}
						size={20}
						color={Colors.text}
					/>
				</TouchableOpacity>
			</View>

			{error ? <Text style={styles.errorText}>{error}</Text> : null}
		</View>
	);

	return (
		<>
			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.profileContainer}>
					{renderPasswordField(
						'Current Password',
						currentPwd,
						currentPwdError,
						handleCurrentPwdChange,
						showCurrent,
						setShowCurrent
					)}

					{renderPasswordField(
						'New Password',
						newPwd,
						newPwdError,
						handleNewPwdChange,
						showNew,
						setShowNew
					)}

					{renderPasswordField(
						'Confirm New Password',
						confirmPwd,
						confirmPwdError,
						handleConfirmPwdChange,
						showConfirm,
						setShowConfirm
					)}

					<View style={styles.buttonContainer}>
						<CustomButton
							title="RESET PASSWORD"
							iconName="key-outline"
							loading={loading}
							loadingText="Resetting…"
							onPress={handleReset}
						/>
					</View>
				</View>
			</ScrollView>

			<CustomPopUp
				visible={popupVisible}
				title="Notice"
				message="Password reset status has been updated."
				confirmText="OK"
				showCancel={false}
				onConfirm={() => {
					setPopupVisible(false);
					router.back();
				}}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	profileContainer: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	field: {
		marginBottom: 18,
	},
	label: {
		marginBottom: 6,
		fontWeight: '600',
		color: Colors.text,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 4,
		paddingHorizontal: 10,
	},
	input: {
		flex: 1,
		paddingVertical: 8,
		color: Colors.text,
	},
	errorText: {
		color: 'red',
		fontSize: 12,
		marginTop: 4,
	},
	buttonContainer: {
		// marginTop: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
