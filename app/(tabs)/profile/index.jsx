import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';

import CustomButton from '../../../components/ui/CustomButton';
import Colors from '../../../constants/color';
import { useIpAddress } from '../../../hooks/useIpAddress';
import { deleteProfileRequest, verifyDeleteProfileOtp } from '../../../lib/api'; // 👈 NEW IMPORT
import { setUser } from '../../../store/slices/authSlice';

export default function ProfileScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const user = useSelector((state) => state.auth.user);

	const [loading, setLoading] = useState(true);

	// Delete-confirm modal (type DELETE)
	const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState('');
	const [deleteLoading, setDeleteLoading] = useState(false);

	// OTP modal
	const [showOtpModal, setShowOtpModal] = useState(false);
	const [otpCode, setOtpCode] = useState('');
	const [otpLoading, setOtpLoading] = useState(false);
	const [otpSecondsLeft, setOtpSecondsLeft] = useState(180); // 3 min

	// Dialog for final API responses
	const [dialog, setDialog] = useState({ visible: false, message: '', isError: false });

	// IP address via reusable hook
	const { ipAddress } = useIpAddress();

	useEffect(() => {
		const loadUserData = async () => {
			const storedUser = await AsyncStorage.getItem('userData');
			const storedToken = await AsyncStorage.getItem('accessToken');
			if (!storedUser || !storedToken) {
				router.replace('/profile/login');
				return;
			}
			const parsedUser = JSON.parse(storedUser);
			dispatch(setUser({ user: parsedUser, token: storedToken }));
			setLoading(false);
		};
		loadUserData();
	}, [dispatch, router]);

	// OTP countdown timer
	useEffect(() => {
		if (!showOtpModal) return;

		const interval = setInterval(() => {
			setOtpSecondsLeft((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [showOtpModal]);

	const formatTime = (secs) => {
		const m = Math.floor(secs / 60)
			.toString()
			.padStart(2, '0');
		const s = (secs % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	};

	const handleSignOut = async () => {
		await AsyncStorage.removeItem('accessToken');
		await AsyncStorage.removeItem('userData');
		dispatch(setUser({ user: null, token: null }));
		router.replace('/profile/login');
	};

	const handleDelete = () => {
		setDeleteConfirmText('');
		setShowDeleteConfirmModal(true);
	};

	// STEP 1: Send OTP when user types DELETE
	const handleConfirmDelete = async () => {
		if (deleteConfirmText.trim() !== 'DELETE') return;

		setDeleteLoading(true);
		try {
			const response = await deleteProfileRequest({
				user_id: user.userid,
				ip_address: ipAddress ?? '',
			});

			console.log('delete profile res .....', response);

			if (response?.status === 'success') {
				// ✅ OTP sent successfully – open OTP popup like the screenshot
				setShowDeleteConfirmModal(false);
				setOtpCode('');
				setOtpSecondsLeft(180); // reset timer
				setShowOtpModal(true);
				// no dialog here
			} else {
				setShowDeleteConfirmModal(false);
				setDialog({
					visible: true,
					message: response?.msg || 'Failed to send OTP for profile deletion',
					isError: true,
				});
			}
		} catch (error) {
			setShowDeleteConfirmModal(false);
			setDialog({
				visible: true,
				message: error?.message || 'Failed to send OTP for profile deletion',
				isError: true,
			});
		} finally {
			setDeleteLoading(false);
		}
	};

	// STEP 2: Verify OTP and actually delete profile
	const handleVerifyOtp = async () => {
		if (!otpCode.trim()) return;
		if (otpSecondsLeft === 0) {
			setShowOtpModal(false);
			setDialog({
				visible: true,
				message: 'OTP has expired. Please try again.',
				isError: true,
			});
			return;
		}

		setOtpLoading(true);
		try {
			const response = await verifyDeleteProfileOtp({
				user_id: user.userid,
				ip_address: ipAddress ?? '',
				otp: otpCode.trim(),
			});

			console.log('verify otp res .....', response);

			setShowOtpModal(false);

			if (response?.status === 'success') {
				setDialog({
					visible: true,
					message: response.msg || 'Your account will be deleted soon.',
					isError: false,
				});
			} else {
				setDialog({
					visible: true,
					message: response?.msg || 'Invalid OTP. Please try again.',
					isError: true,
				});
			}
		} catch (error) {
			setShowOtpModal(false);
			setDialog({
				visible: true,
				message: error?.message || 'Failed to verify OTP',
				isError: true,
			});
		} finally {
			setOtpLoading(false);
		}
	};

	const handleDialogOk = async () => {
		setDialog((prev) => ({ ...prev, visible: false }));
		// On successful delete → logout & go to login
		if (!dialog.isError) {
			await AsyncStorage.removeItem('accessToken');
			await AsyncStorage.removeItem('userData');
			dispatch(setUser({ user: null, token: null }));
			router.replace('/profile/login');
		}
	};

	if (loading || !user) {
		return (
			<View style={styles.container}>
				<Text style={styles.infoText}>Loading user...</Text>
			</View>
		);
	}

	const canDelete = deleteConfirmText.trim() === 'DELETE';
	const canVerifyOtp = otpCode.trim().length > 0 && otpSecondsLeft > 0 && !otpLoading;

	return (
		<View style={styles.container}>
			<View style={styles.profileContainer}>
				<View style={styles.profileMain}>
					<Ionicons name="person-circle-outline" size={100} color={Colors.primary} style={styles.profileIcon} />
					<Text style={styles.nameText}>
						{user.first_name || ''} {user.last_name || ''}
					</Text>
					<Text style={styles.infoText}>{user.email}</Text>
					<Text style={styles.infoText}>{user.mobile_no}</Text>
					<Text style={styles.infoText}>{user.postcode ?? 'Postcode not available'}</Text>
				</View>

				<View style={styles.buttonGrid}>
					<CustomButton title="EDIT PROFILE" iconName="create-outline" onPress={() => router.push('/profile/edit-profile')} />
					<CustomButton title="RESET PASSWORD" iconName="key-outline" onPress={() => router.push('/profile/reset-password')} />
					<CustomButton title="ORDER HISTORY" iconName="list-outline" onPress={() => router.push('/profile/order-history')} />
					<CustomButton title="SIGN OUT" iconName="exit-outline" onPress={handleSignOut} />
					<CustomButton title="DELETE PROFILE" type="delete" iconName="trash-outline" onPress={handleDelete} />
				</View>
			</View>

			{/* Delete Confirmation Modal (type DELETE) */}
			<Modal
				visible={showDeleteConfirmModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDeleteConfirmModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContentPolished}>
						<Ionicons name="warning-outline" size={48} color={Colors.danger} style={styles.modalIcon} />
						<Text style={[styles.modalTitlePolished, { color: Colors.text }]}>Delete My Account</Text>
						<Text style={styles.modalMessagePolished}>
							Enter <Text style={{ fontWeight: '700' }}>DELETE</Text> to confirm the deletion of your account.
						</Text>

						<TextInput
							style={styles.deleteInput}
							placeholder="DELETE"
							placeholderTextColor="#9AA0A6"
							autoCapitalize="characters"
							value={deleteConfirmText}
							onChangeText={(t) => setDeleteConfirmText(t.toUpperCase())}
							autoCorrect={false}
						/>

						<View style={styles.modalBtnRowPolished}>
							<TouchableOpacity
								style={[styles.modalBtn, styles.cancelBtn]}
								onPress={() => setShowDeleteConfirmModal(false)}
								disabled={deleteLoading}
								activeOpacity={0.8}
							>
								<Text style={styles.cancelBtnText}>CANCEL</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.modalBtn, styles.deleteBtn, (!canDelete || deleteLoading) && { opacity: 0.6 }]}
								onPress={handleConfirmDelete}
								disabled={!canDelete || deleteLoading}
								activeOpacity={0.8}
							>
								<Text style={styles.deleteBtnText}>{deleteLoading ? 'SENDING OTP...' : 'DELETE'}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* OTP Popup – like your screenshot */}
			<Modal
				visible={showOtpModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowOtpModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContentPolished}>
						<Text style={[styles.modalTitlePolished, { color: Colors.text, marginBottom: 4 }]}>
							Enter the 4-digit OTP sent to your email
						</Text>
						<Text style={{ color: Colors.danger, marginBottom: 12, fontWeight: '600' }}>
							Resend available in {formatTime(otpSecondsLeft)}
						</Text>

						<TextInput
							style={styles.deleteInput}
							placeholder="4-digit OTP"
							placeholderTextColor="#9AA0A6"
							keyboardType="number-pad"
							maxLength={6}
							value={otpCode}
							onChangeText={setOtpCode}
							autoCorrect={false}
						/>

						<View style={styles.modalBtnRowPolished}>
							<TouchableOpacity
								style={[styles.modalBtn, styles.cancelBtn]}
								onPress={() => {
									setShowOtpModal(false);
									setOtpCode('');
								}}
								disabled={otpLoading}
								activeOpacity={0.8}
							>
								<Text style={styles.cancelBtnText}>CANCEL</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.modalBtn,
									styles.verifyBtn,
									(!canVerifyOtp || otpLoading) && { opacity: 0.6 },
								]}
								onPress={handleVerifyOtp}
								disabled={!canVerifyOtp}
								activeOpacity={0.8}
							>
								<Text style={styles.verifyBtnText}>
									{otpLoading ? 'VERIFYING...' : 'VERIFY OTP'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Final Result Dialog – only after verifying OTP */}
			<Modal visible={dialog.visible} transparent animationType="fade" onRequestClose={handleDialogOk}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContentPolished}>
						<Ionicons
							name={dialog.isError ? 'alert-circle-outline' : 'information-circle-outline'}
							size={48}
							color={dialog.isError ? Colors.danger : Colors.primary}
							style={styles.modalIcon}
						/>
						<Text style={styles.modalTitlePolished}>
							{dialog.isError ? 'Delete Failed' : 'Account Deletion Pending'}
						</Text>
						<Text style={styles.modalMessagePolished}>{dialog.message}</Text>
						<View style={styles.modalBtnRowPolished}>
							<TouchableOpacity style={[styles.modalBtn, styles.deleteBtn]} onPress={handleDialogOk}>
								<Text style={styles.deleteBtnText}>OK</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background, padding: 20, alignItems: 'center', justifyContent: 'center' },
	profileContainer: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#ccc',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	profileMain: { alignItems: 'center', marginVertical: 30 },
	profileIcon: { marginBottom: 20 },
	nameText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 6 },
	infoText: { fontSize: 14, color: Colors.text, marginBottom: 4 },
	buttonGrid: { width: '100%', flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },

	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
	modalContentPolished: {
		width: 320,
		backgroundColor: Colors.white,
		borderRadius: 18,
		paddingVertical: 28,
		paddingHorizontal: 24,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.18,
		shadowRadius: 16,
		elevation: 15,
	},
	modalIcon: { marginBottom: 12 },
	modalTitlePolished: { fontSize: 20, fontWeight: 'bold', color: Colors.danger, marginBottom: 8, textAlign: 'center' },
	modalMessagePolished: {
		fontSize: 15,
		color: Colors.text,
		textAlign: 'center',
		marginBottom: 16,
		marginHorizontal: 4,
		lineHeight: 22,
	},
	deleteInput: {
		width: '100%',
		height: 44,
		borderWidth: 1,
		borderColor: '#DADCE0',
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 20,
		color: Colors.text,
	},
	modalBtnRowPolished: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 14 },
	modalBtn: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
	cancelBtn: { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#D8D8D8' },
	cancelBtnText: { color: Colors.danger, fontWeight: 'bold', fontSize: 16, letterSpacing: 0.2 },
	deleteBtn: { backgroundColor: Colors.danger },
	deleteBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16, letterSpacing: 0.2 },

	// OTP verify button styling (red like screenshot)
	verifyBtn: { backgroundColor: Colors.primary },
	verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.2 },
});
