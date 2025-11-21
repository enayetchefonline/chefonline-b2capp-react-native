import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { resetPassword } from '../../../../lib/api';

export default function ResetPasswordScreen() {
	const router = useRouter();

	// form state
	const [currentPwd, setCurrentPwd] = useState('');
	const [newPwd, setNewPwd] = useState('');
	const [confirmPwd, setConfirmPwd] = useState('');

	// toggles & loading
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);

	// popup visibility
	const [popupVisible, setPopupVisible] = useState(false);

	const authUser = useSelector((state) => state.auth.user);

	const handleReset = async () => {
		// trim to avoid "   " as valid passwords
		const trimmedCurrent = currentPwd.trim();
		const trimmedNew = newPwd.trim();
		const trimmedConfirm = confirmPwd.trim();

		if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
			return alert('Please fill all required fields');
		}

		if (trimmedNew !== trimmedConfirm) {
			return alert('New password and confirm password must match');
		}

		if (trimmedCurrent === trimmedNew) {
			return alert('New password must be different from the current password');
		}

		setLoading(true);

		try {
			const response = await resetPassword({
				email: authUser?.email,
				previousPassword: trimmedCurrent,
				newPassword: trimmedNew,
			});

			if (response?.msg?.toLowerCase().includes('success')) {
				setPopupVisible(true);
			} else {
				alert(response?.msg || 'Failed to reset password');
			}
		} catch (error) {
			console.error(error);
			alert('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// reusable field renderer
	const renderPasswordField = (label, value, onChange, show, setShow) => (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.inputContainer}>
				<TextInput
					style={styles.input}
					placeholder="••••••••"
					secureTextEntry={!show}
					value={value}
					onChangeText={onChange}
					// lighter placeholder color
					placeholderTextColor="#D1D5DB"
				/>
				<TouchableOpacity onPress={() => setShow((prev) => !prev)}>
					<Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.text} />
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<>
			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.profileContainer}>
					{renderPasswordField('Current Password', currentPwd, setCurrentPwd, showCurrent, setShowCurrent)}
					{renderPasswordField('New Password', newPwd, setNewPwd, showNew, setShowNew)}
					{renderPasswordField('Confirm New Password', confirmPwd, setConfirmPwd, showConfirm, setShowConfirm)}

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
				title="Success!"
				message="Your password has been reset."
				confirmText="OK"
				showCancel={false}
				maskClosable={false}
				onConfirm={() => {
					setPopupVisible(false);
					router.back();
				}}
				onCancel={() => setPopupVisible(false)}
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
		// shadows
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	field: {
		marginBottom: 16,
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
	buttonContainer: {
		marginTop: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
