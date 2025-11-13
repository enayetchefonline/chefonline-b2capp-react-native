import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomButton from '../../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../../components/ui/CustomPopUp';
import Colors from '../../../../../constants/color';
import { makeReservation } from '../../../../../lib/api';

export default function ReservationScreen() {
  const { restaurantId } = useLocalSearchParams();

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
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  // Start-of-day for today; used to block past dates
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ========= Validators =========
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidUKMobile = (val) => /^07\d{9}$/.test(val.trim());

  // Title: letters + spaces + dots only (optional field)
  const isValidTitle = (val) => {
    const s = val.trim();
    if (!s) return true; // optional
    return /^[A-Za-z. ]{1,10}$/.test(s); // keep it tight (initials/titles)
  };

  // Name: letters, spaces, hyphens, apostrophes; no digits or '@'
  const isName = (val) => {
    const s = val.trim();
    if (!s) return false;
    if (/[@\d]/.test(s)) return false;
    return /^[A-Za-z' -]+$/.test(s);
  };

  // guests must be integer >= 1
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

  // ========= Pickers =========
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
    setDate(`${day}/${month}/${year}`);
    hideDatePicker();
  };

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);
  const handleConfirmTime = (timeObj) => {
    const hours = timeObj.getHours();
    const minutes = timeObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${((hours + 11) % 12) + 1}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    setTime(formattedTime);
    hideTimePicker();
  };

  // ========= API =========
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
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mr, Mrs, Dr"
                  value={title}
                  onChangeText={(t) => {
                    // keep only letters, spaces, dots
                    const cleaned = t.replace(/[^A-Za-z. ]/g, '');
                    setTitle(cleaned);
                  }}
                  placeholderTextColor={Colors.placeholder}
                />
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
                      // allow letters, spaces, hyphens, apostrophes
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

              {/* Phone & Telephone */}
              <View style={styles.row}>
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
                  {!phone.trim() && showErrors && <Text style={styles.errorText}>Mobile No is required</Text>}
                  {phone.trim() && !isValidUKMobile(phone) && showErrors && (
                    <Text style={styles.errorText}>Enter a valid mobile number</Text>
                  )}
                </View>
                <View style={[styles.field, styles.half]}>
                  <Text style={styles.label}>Telephone No</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Landline"
                    keyboardType="phone-pad"
                    value={telephone}
                    onChangeText={setTelephone}
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
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
                      placeholder="DD/MM/YYYY"
                      value={date}
                      placeholderTextColor={Colors.placeholder}
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
                <Pressable onPress={showTimePicker}>
                  <View pointerEvents="none">
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM AM/PM"
                      value={time}
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
                  onChangeText={(t) => setGuests(t.replace(/\D/g, ''))} // digits only
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

      {/* Blocks past dates */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        minimumDate={todayStart}
      />

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={hideTimePicker}
      />

      <CustomPopUp
        visible={popupVisible}
        title="Reservation Confirmed"
        message={successMessage}
        confirmText="Great!"
        showCancel={false}
        maskClosable={false}
        onConfirm={() => setPopupVisible(false)}
      />

      <CustomPopUp
        visible={errorPopupVisible}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        showCancel={false}
        maskClosable={false}
        onConfirm={() => setErrorPopupVisible(false)}
      />
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
});
