import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../../components/ui/CustomPopUp';
import Colors from '../../../../../constants/color';
import { makeReservation } from '../../../../../lib/api';
import { getReservationTimeSlots } from '../../../../../lib/utils/reservationSchedule';

export default function ReservationScreen() {
	const { restaurantId } = useLocalSearchParams();

	const restaurantDetails = useSelector((state) => state.restaurantDetail.data);
	const restaurantSchedule = restaurantDetails?.restuarent_schedule?.schedule || [];

	const [title, setTitle] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [telephone, setTelephone] = useState('');
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [guests, setGuests] = useState('');
	const [specialInstructions, setSpecialInstructions] = useState('');
	const [showErrors, setShowErrors] = useState(false);

	const [saving, setSaving] = useState(false);
	const [popupVisible, setPopupVisible] = useState(false);
	const [errorPopupVisible, setErrorPopupVisible] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
	const [timeSheetVisible, setTimeSheetVisible] = useState(false);
	const [titleSheetVisible, setTitleSheetVisible] = useState(false);

	const todayStart = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, []);

	const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
	const isValidUKMobile = (val) => /^07\d{9}$/.test(val.trim());

	const isValidTitle = (val) => {
		const s = val.trim();
		if (!s) return true;
		return /^[A-Za-z. ]{1,10}$/.test(s);
	};

	const isName = (val) => {
		const s = val.trim();
		if (!s) return false;
		if (/[@\d]/.test(s)) return false;
		return /^[A-Za-z' -]+$/.test(s);
	};

	const guestsNum = Number(guests);
	const isValidGuests = Number.isInteger(guestsNum) && guestsNum >= 1;

	const isFormValid = () =>
		isValidTitle(title) &&
		isName(firstName) &&
		isName(lastName) &&
		email.trim() &&
		isValidEmail(email) &&
		phone.trim() &&
		isValidUKMobile(phone) &&
		date.trim() &&
		time.trim() &&
		isValidGuests;

	// ========= Date Picker =========
	const showDatePicker = () => setDatePickerVisibility(true);
	const hideDatePicker = () => setDatePickerVisibility(false);

	const handleConfirmDate = (dateObj) => {
		if (dateObj < todayStart) {
			hideDatePicker();
			return;
		}
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');

		// ✅ DD-MM-YYYY format
		setDate(`${day}-${month}-${year}`);

		setTime('');
		hideDatePicker();
	};

	// ========= Time slots =========
	const availableTimeSlots = useMemo(
		() => getReservationTimeSlots(restaurantSchedule, date),
		[restaurantSchedule, date]
	);

	const openTimeSheet = () => {
		if (!date) {
			setShowErrors(true);
			return;
		}
		setTimeSheetVisible(true);
	};

	const getUserIp = async () => {
		try {
			const response = await fetch('https://api.ipify.org?format=json');
			const data = await response.json();
			return data.ip || '0.0.0.0';
		} catch {
			return '0.0.0.0';
		}
	};

	const handleBookTable = async () => {
		setShowErrors(true);
		if (!isFormValid()) return;

		setSaving(true);
		try {
			const ip = await getUserIp();
			const payload = {
				restId: restaurantId,
				title,
				firstName,
				lastName,
				email,
				mobileNo: phone,
				telephone,
				reservationDate: date,
				reservationTime: time,
				guest: guests,
				specialRequest: specialInstructions,
				ipAddress: ip,
			};

			console.log('reservation payload', payload);

			const response = await makeReservation(payload);

			if (response?.status === 'Success') {
				setSuccessMessage(response?.msg || 'Reservation confirmed.');
				setPopupVisible(true);
				setTitle('');
				setFirstName('');
				setLastName('');
				setEmail('');
				setPhone('');
				setTelephone('');
				setDate('');
				setTime('');
				setGuests('');
				setSpecialInstructions('');
				setShowErrors(false);
			} else {
				setErrorMessage(response?.msg || 'Reservation failed. Please try again.');
				setErrorPopupVisible(true);
			}
		} catch (_error) {
			setErrorMessage('Something went wrong. Please try again.');
			setErrorPopupVisible(true);
		} finally {
			setSaving(false);
		}
	};

	const TITLE_OPTIONS = ['Mr', 'Miss', 'Mrs', 'Ms', 'Dr'];

	return (
		<>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
						<View style={styles.formContainer}>
							{/* Title */}
							<View style={styles.field}>
								<Text style={styles.label}>Title</Text>
								<Pressable onPress={() => setTitleSheetVisible(true)}>
									<View pointerEvents="none">
										<TextInput
											style={styles.input}
											placeholder="Select title"
											value={title}
											editable={false}
											placeholderTextColor={Colors.placeholder}
										/>
									</View>
								</Pressable>
								{showErrors && !isValidTitle(title) && (
									<Text style={styles.errorText}>Title can contain only letters, spaces, and dots.</Text>
								)}
							</View>

							{/* First & Last Name */}
							<View style={styles.row}>
								<View style={[styles.field, styles.half]}>
									<Text style={styles.label}>
										First Name <Text style={styles.required}>*</Text>
									</Text>
									<TextInput
										style={styles.input}
										placeholder="First name"
										value={firstName}
										onChangeText={(t) => {
											const cleaned = t.replace(/[^A-Za-z' -]/g, '');
											setFirstName(cleaned);
										}}
										placeholderTextColor={Colors.placeholder}
									/>
									{showErrors && !isName(firstName) && (
										<Text style={styles.errorText}>First name required.</Text>
									)}
								</View>
								<View style={[styles.field, styles.half]}>
									<Text style={styles.label}>
										Last Name <Text style={styles.required}>*</Text>
									</Text>
									<TextInput
										style={styles.input}
										placeholder="Last name"
										value={lastName}
										onChangeText={(t) => {
											const cleaned = t.replace(/[^A-Za-z' -]/g, '');
											setLastName(cleaned);
										}}
										placeholderTextColor={Colors.placeholder}
									/>
									{showErrors && !isName(lastName) && (
										<Text style={styles.errorText}>Last name required.</Text>
									)}
								</View>
							</View>

							{/* Email */}
							<View style={styles.field}>
								<Text style={styles.label}>
									Email <Text style={styles.required}>*</Text>
								</Text>
								<TextInput
									style={styles.input}
									placeholder="you@example.com"
									keyboardType="email-address"
									autoCapitalize="none"
									value={email}
									onChangeText={setEmail}
									placeholderTextColor={Colors.placeholder}
								/>
								{!email.trim() && showErrors && <Text style={styles.errorText}>Email is required</Text>}
								{email.trim() && !isValidEmail(email) && showErrors && (
									<Text style={styles.errorText}>Invalid email format</Text>
								)}
							</View>

							{/* Phone */}
							<View style={[styles.field, styles.half]}>
								<Text style={styles.label}>
									Mobile No <Text style={styles.required}>*</Text>
								</Text>
								<TextInput
									style={styles.input}
									placeholder="07XXXXXXXXX"
									keyboardType="phone-pad"
									value={phone}
									onChangeText={setPhone}
									placeholderTextColor={Colors.placeholder}
									maxLength={11}
								/>
								{!phone.trim() && showErrors && (
									<Text style={styles.errorText}>Mobile No is required</Text>
								)}
								{phone.trim() && !isValidUKMobile(phone) && showErrors && (
									<Text style={styles.errorText}>Enter a valid mobile number</Text>
								)}
							</View>

							{/* Date */}
							<View style={styles.field}>
								<Text style={styles.label}>
									Select Date <Text style={styles.required}>*</Text>
								</Text>
								<Pressable onPress={showDatePicker}>
									<View pointerEvents="none">
										<TextInput
											style={styles.input}
											placeholder="DD-MM-YYYY" // ✅ updated placeholder
											value={date}
											placeholderTextColor={Colors.placeholder}
											editable={false}
										/>
									</View>
								</Pressable>
								{!date.trim() && showErrors && <Text style={styles.errorText}>Date is required</Text>}
							</View>

							{/* Time */}
							<View style={styles.field}>
								<Text style={styles.label}>
									Select Time <Text style={styles.required}>*</Text>
								</Text>
								<Pressable onPress={openTimeSheet}>
									<View pointerEvents="none">
										<TextInput
											style={styles.input}
											placeholder={date ? 'Select a time' : 'Pick a date first'}
											value={time}
											editable={false}
											placeholderTextColor={Colors.placeholder}
										/>
									</View>
								</Pressable>
								{!time.trim() && showErrors && <Text style={styles.errorText}>Time is required</Text>}
							</View>

							{/* Guests */}
							<View style={styles.field}>
								<Text style={styles.label}>
									Number of Guests <Text style={styles.required}>*</Text>
								</Text>
								<TextInput
									style={styles.input}
									placeholder="Number of guests"
									keyboardType="number-pad"
									value={guests}
									onChangeText={(t) => setGuests(t.replace(/\D/g, ''))}
									placeholderTextColor={Colors.placeholder}
								/>
								{showErrors && (!guests.trim() || !isValidGuests) && (
									<Text style={styles.errorText}>Enter a valid number of guests (at least 1)</Text>
								)}
							</View>

							{/* Special Requests */}
							<TextInput
								style={[styles.input, styles.textarea]}
								placeholder="Any special requests?"
								value={specialInstructions}
								onChangeText={setSpecialInstructions}
								multiline
								numberOfLines={4}
								textAlignVertical="top"
								placeholderTextColor={Colors.placeholder}
							/>

							{/* Submit Button */}
							<View style={styles.buttonContainer}>
								<CustomButton
									title="BOOK A TABLE"
									iconName="restaurant-outline"
									loading={saving}
									loadingText="Booking..."
									onPress={handleBookTable}
									style={!isFormValid() ? { opacity: 0.6 } : {}}
								/>
								{!isFormValid() && showErrors && (
									<Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
										Please fill all required fields with valid information.
									</Text>
								)}
							</View>
						</View>
					</ScrollView>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>

			{/* Date Picker */}
			<DateTimePickerModal
				isVisible={isDatePickerVisible}
				mode="date"
				onConfirm={handleConfirmDate}
				onCancel={hideDatePicker}
				minimumDate={todayStart}
			/>

			{/* Success */}
			<CustomPopUp
				visible={popupVisible}
				title="Reservation Confirmed"
				message={successMessage}
				confirmText="Great!"
				showCancel={false}
				maskClosable={false}
				onConfirm={() => setPopupVisible(false)}
			/>

			{/* Error */}
			<CustomPopUp
				visible={errorPopupVisible}
				title="Error"
				message={errorMessage}
				confirmText="OK"
				showCancel={false}
				maskClosable={false}
				onConfirm={() => setErrorPopupVisible(false)}
			/>

			{/* Time Slot Bottom Sheet */}
			<Modal
				visible={timeSheetVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setTimeSheetVisible(false)}
			>
				<TouchableWithoutFeedback onPress={() => setTimeSheetVisible(false)}>
					<View style={styles.bottomSheetBackdrop}>
						<TouchableWithoutFeedback onPress={() => { }}>
							<View style={styles.bottomSheetContainer}>
								<Text style={styles.sheetTitle}>Select Time</Text>
								<ScrollView>
									{availableTimeSlots.length === 0 ? (
										<TouchableOpacity
											style={{ paddingVertical: 16 }}
											onPress={() => setTimeSheetVisible(false)}
										>
											<Text style={{ textAlign: 'center' }}>
												No available slots for this day. Tap to close.
											</Text>
										</TouchableOpacity>
									) : (
										availableTimeSlots.map((slot, index) => (
											<TouchableOpacity
												key={index}
												style={styles.timeSlotItem}
												onPress={() => {
													setTime(slot);
													setTimeSheetVisible(false);
												}}
											>
												<Text style={styles.timeSlotText}>{slot}</Text>
											</TouchableOpacity>
										))
									)}
								</ScrollView>
							</View>
						</TouchableWithoutFeedback>
					</View>
				</TouchableWithoutFeedback>
			</Modal>

			{/* Title Bottom Sheet */}
			<Modal
				visible={titleSheetVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setTitleSheetVisible(false)}
			>
				<View style={styles.bottomSheetBackdrop}>
					<View style={styles.bottomSheetContainer}>
						<Text style={styles.sheetTitle}>Select Title</Text>
						<ScrollView>
							{TITLE_OPTIONS.map((opt) => (
								<TouchableOpacity
									key={opt}
									style={styles.timeSlotItem}
									onPress={() => {
										setTitle(opt);
										setTitleSheetVisible(false);
									}}
								>
									<Text style={styles.timeSlotText}>{opt}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16 },
	formContainer: {
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	field: { marginBottom: 16 },
	label: { marginBottom: 6, fontWeight: '600', color: '#222222' },
	input: {
		borderWidth: 1,
		borderColor: '#CCCCCC',
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
		color: '#222222',
		backgroundColor: '#FFFFFF',
	},
	row: { flexDirection: 'row', justifyContent: 'space-between' },
	half: { flex: 0.48 },
	buttonContainer: { marginTop: 24, justifyContent: 'center', alignItems: 'center' },
	textarea: { height: 100, paddingTop: 10 },
	required: { color: '#D32F2F' },
	errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4 },

	bottomSheetBackdrop: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
	},
	bottomSheetContainer: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 16,
		maxHeight: '80%',
	},
	sheetTitle: {
		fontWeight: 'bold',
		fontSize: 18,
		marginBottom: 10,
		textAlign: 'center',
	},
	timeSlotItem: {
		paddingVertical: 12,
		borderBottomColor: '#eee',
		borderBottomWidth: 1,
	},
	timeSlotText: {
		textAlign: 'center',
		fontSize: 16,
		color: Colors.text,
	},
});
