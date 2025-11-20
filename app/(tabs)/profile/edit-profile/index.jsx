import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { userEditProfileApi } from '../../../../lib/api';
import { setUser } from '../../../../store/slices/authSlice';

// Title Options
const TITLE_OPTIONS = [
  { label: 'Mr', value: 'Mr' },
  { label: 'Mrs', value: 'Mrs' },
  { label: 'Ms', value: 'Ms' },
  { label: 'Dr', value: 'Dr' },
];

// ⭐ Reusable Label Component
const Label = ({ text, required = false }) => (
  <Text style={styles.label}>
    {text} {required && <Text style={{ color: 'red' }}>*</Text>}
  </Text>
);

export default function EditProfileScreen() {
  const [title, setTitle] = useState('');
  const [showTitleSheet, setShowTitleSheet] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [town, setTown] = useState('');
  const [country, setCountry] = useState('');
  const [postcode, setPostcode] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');

  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [doaPickerVisible, setDoaPickerVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [popupIsSuccess, setPopupIsSuccess] = useState(false); // ✅ NEW

  const router = useRouter();

  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const userId = authUser?.userid;

  console.log("auth user .....", authUser)

  // Date limits
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const oldestDate = useMemo(() => new Date(1900, 0, 1), []);

  useEffect(() => {
    if (authUser) {
      setTitle(authUser.title || '');
      setFirstName(authUser.first_name || '');
      setLastName(authUser.last_name || '');
      setEmail(authUser.email || '');
      setPhone(authUser.mobile_no || '');
      setTelephone(authUser.telephone_no || '');
      setAddress1(authUser.address1 || '');
      setAddress2(authUser.address2 || '');
      setTown(authUser.town || '');
      setCountry(authUser.country || '');
      setDob(authUser.dob_date || authUser.date_of_birth || '');
      setAnniversary(authUser.doa || authUser.date_of_anniversery || '');
      setPostcode(authUser.postcode || '');
    }
  }, [authUser]);

  // ===== VALIDATION METHODS =====

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());

  // ⭐ Strict UK Mobile: 07xxxxxxxxx
  const isValidUKMobile = (val) => /^07\d{9}$/.test((val || '').trim());

  const isValidTitle = (val) => {
    if (!val) return true; // optional
    return TITLE_OPTIONS.some((t) => t.value === val);
  };

  const sanitizeName = (t) => t.replace(/[^A-Za-z' -]/g, '');
  const isName = (val) => /^[A-Za-z' -]+$/.test((val || '').trim());

  const sanitizeTownCountry = (t) => t.replace(/[^A-Za-z -]/g, '');
  const isTownCountry = (val) => /^[A-Za-z -]+$/.test((val || '').trim());

  const isAddress = (val) => !!(val || '').trim();

  const normalizePostcode = (pc) => (pc || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const isUKPostcode = (pc) =>
    /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test((pc || '').toUpperCase().trim());

  const sanitizeTelephone = (t) => t.replace(/[^0-9+\-() ]/g, '');
  const isTelephone = (val) => {
    if (!val || !val.trim()) return true; // optional
    const s = val.trim();
    if (!/^[0-9+\-() ]+$/.test(s)) return false;
    return s.replace(/[^0-9]/g, '').length >= 6;
  };

  // DOB/DOA: optional but must not be future if present
  const isPastOrToday = (iso) => {
    if (!iso) return true; // optional
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    return d <= todayStart;
  };

  // ⭐ Final Form Validator
  const isFormValid = () =>
    isValidTitle(title) &&
    isName(firstName) &&
    isName(lastName) &&
    isValidEmail(email) &&
    isValidUKMobile(phone) &&
    isAddress(address1) &&
    isUKPostcode(postcode) &&
    isTownCountry(town) &&
    isTownCountry(country) &&
    isTelephone(telephone) &&
    isPastOrToday(dob) &&
    isPastOrToday(anniversary);

  const handleSave = async () => {
    setShowErrors(true);
    if (!isFormValid()) return;

    setSaving(true);
    try {
      const payload = {
        userid: userId,
        title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        mobile_no: phone.trim(),
        telephone_no: telephone.trim(),
        address1: address1.trim(),
        address2: (address2 || '').trim(),
        city: town.trim(),
        country: country.trim(),
        postcode: normalizePostcode(postcode),
        dob_date: dob,
        doa: anniversary,
      };

      console.log("userEditProfileApi payload.....", payload)

      const response = await userEditProfileApi(payload);

      console.log("edit profile", response)

      if (response?.status === 'Success' || response?.status === 'Success') {
        dispatch(setUser({ user: response?.UserDetails }));

        setPopupTitle('Profile Updated');
        setPopupMessage(response?.msg || 'Your changes have been saved successfully.');
        setPopupIsSuccess(true);      // ✅ success
        setPopupVisible(true);
      } else {
        setPopupTitle('Update Failed');
        setPopupMessage(response?.msg || 'Connection error. Please try again.');
        setPopupIsSuccess(false);     // ❌ not success
        setPopupVisible(true);
      }

      console.log("auth user updated ....", authUser)
    } catch {
      setPopupTitle('Update Failed');
      setPopupMessage('Failed to update profile. Please try again.');
      setPopupIsSuccess(false);       // ❌ not success
      setPopupVisible(true);
    } finally {
      setSaving(false);
    }
  };

  // Highlight invalid fields
  const inputStyle = (valid) => [styles.input, showErrors && !valid && styles.inputError];

  return (
    <>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <View style={styles.formContainer}>

                {/* Title */}
                <View style={styles.field}>
                  <Label text="Title" />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.input, styles.sheetInput]}
                    onPress={() => setShowTitleSheet(true)}
                  >
                    <Text style={{ color: title ? Colors.text : '#aaa' }}>
                      {TITLE_OPTIONS.find((opt) => opt.value === title)?.label || 'Select Title'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Names */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Label text="First Name" required />
                    <TextInput
                      style={inputStyle(isName(firstName))}
                      placeholder="First name"
                      value={firstName}
                      onChangeText={(t) => setFirstName(sanitizeName(t))}
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isName(firstName) && (
                      <Text style={styles.errorText}>Only letters, spaces, - and ' allowed.</Text>
                    )}
                  </View>

                  <View style={[styles.field, styles.half]}>
                    <Label text="Last Name" required />
                    <TextInput
                      style={inputStyle(isName(lastName))}
                      placeholder="Last name"
                      value={lastName}
                      onChangeText={(t) => setLastName(sanitizeName(t))}
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isName(lastName) && (
                      <Text style={styles.errorText}>Only letters, spaces, - and ' allowed.</Text>
                    )}
                  </View>
                </View>

                {/* Email */}
                <View style={styles.field}>
                  <Label text="Email" required />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={email}
                    editable={false}
                  />
                </View>

                {/* Phone + Telephone */}
                <View style={[styles.field, styles.half]}>
                  <Label text="Phone" required />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={phone}
                    editable={false}
                  />
                  {showErrors && !isValidUKMobile(phone) && (
                    <Text style={styles.errorText}>Phone must be UK format 07XXXXXXXXX</Text>
                  )}
                </View>

                <View style={[styles.field, styles.half]}>
                  <Label text="Telephone" />
                  <TextInput
                    style={inputStyle(isTelephone(telephone))}
                    value={telephone}
                    placeholder="Landline"
                    keyboardType="phone-pad"
                    onChangeText={(t) => setTelephone(sanitizeTelephone(t))}
                    placeholderTextColor={Colors.placeholder}
                  />
                  {showErrors && !isTelephone(telephone) && (
                    <Text style={styles.errorText}>
                      Use digits, spaces, + - ( ); at least 6 digits.
                    </Text>
                  )}
                </View>

                {/* DOB */}
                <View style={styles.field}>
                  <Label text="Date of Birth (DOB)" />
                  <Pressable onPress={() => setDobPickerVisible(true)}>
                    <TextInput
                      style={inputStyle(isPastOrToday(dob))}
                      placeholder="YYYY-MM-DD"
                      value={dob}
                      editable={false}      // value comes from picker
                      pointerEvents="none"  // allow Pressable to handle press
                      placeholderTextColor={Colors.placeholder}
                    />
                  </Pressable>
                  {showErrors && !isPastOrToday(dob) && (
                    <Text style={styles.errorText}>DOB cannot be in the future.</Text>
                  )}
                </View>

                {/* Anniversary */}
                <View style={styles.field}>
                  <Label text="Anniversary Date (DOA)" />
                  <Pressable onPress={() => setDoaPickerVisible(true)}>
                    <TextInput
                      style={inputStyle(isPastOrToday(anniversary))}
                      placeholder="YYYY-MM-DD"
                      value={anniversary}
                      editable={false}
                      pointerEvents="none"
                      placeholderTextColor={Colors.placeholder}
                    />
                  </Pressable>
                  {showErrors && !isPastOrToday(anniversary) && (
                    <Text style={styles.errorText}>Anniversary cannot be in the future.</Text>
                  )}
                </View>

                {/* Address 1 */}
                <View style={styles.field}>
                  <Label text="Address Line 1" required />
                  <TextInput
                    style={inputStyle(isAddress(address1))}
                    value={address1}
                    onChangeText={setAddress1}
                    placeholder="Street address, P.O. box, etc."
                    placeholderTextColor={Colors.placeholder}
                  />
                  {showErrors && !isAddress(address1) && (
                    <Text style={styles.errorText}>Address line 1 is required.</Text>
                  )}
                </View>

                {/* Address 2 */}
                <View style={styles.field}>
                  <Label text="Address Line 2" />
                  <TextInput
                    style={styles.input}
                    value={address2}
                    onChangeText={setAddress2}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>

                {/* Town / Country / Postcode */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.third]}>
                    <Label text="Postcode" required />
                    <TextInput
                      style={inputStyle(isUKPostcode(postcode))}
                      value={postcode}
                      onChangeText={(t) => setPostcode(t.toUpperCase())}
                      placeholder="SW1A 1AA"
                      autoCapitalize="characters"
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isUKPostcode(postcode) && (
                      <Text style={styles.errorText}>Enter a valid UK postcode (e.g., SW1A 1AA).</Text>
                    )}
                  </View>

                  <View style={[styles.field, styles.third]}>
                    <Label text="Town" required />
                    <TextInput
                      style={inputStyle(isTownCountry(town))}
                      value={town}
                      onChangeText={(t) => setTown(sanitizeTownCountry(t))}
                      placeholder="Town"
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isTownCountry(town) && (
                      <Text style={styles.errorText}>Town is required (letters and spaces only).</Text>
                    )}
                  </View>

                  <View style={[styles.field, styles.third]}>
                    <Label text="Country" required />
                    <TextInput
                      style={inputStyle(isTownCountry(country))}
                      value={country}
                      onChangeText={(t) => setCountry(sanitizeTownCountry(t))}
                      placeholder="Country"
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isTownCountry(country) && (
                      <Text style={styles.errorText}>
                        Country is required (letters and spaces only).
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <CustomButton
                    title="SAVE CHANGES"
                    iconName="save-outline"
                    loading={saving}
                    onPress={handleSave}
                    loadingText="Saving…"
                  />
                  {!isFormValid() && showErrors && (
                    <Text style={{ color: '#D32F2F', marginTop: 10, textAlign: 'center' }}>
                      Please fix the highlighted fields.
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* DOB Picker */}
        <DateTimePickerModal
          isVisible={dobPickerVisible}
          mode="date"
          minimumDate={oldestDate}
          maximumDate={todayStart}
          onConfirm={(date) => {
            const f = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')}`;
            setDob(f);
            setDobPickerVisible(false);
          }}
          onCancel={() => setDobPickerVisible(false)}
        />

        {/* DOA Picker */}
        <DateTimePickerModal
          isVisible={doaPickerVisible}
          mode="date"
          minimumDate={oldestDate}
          maximumDate={todayStart}
          onConfirm={(date) => {
            const f = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')}`;
            setAnniversary(f);
            setDoaPickerVisible(false);
          }}
          onCancel={() => setDoaPickerVisible(false)}
        />

        {/* Popup */}
        <CustomPopUp
          visible={popupVisible}
          title={popupTitle}
          message={popupMessage}
          confirmText="Great!"
          showCancel={false}
          maskClosable={false}
          onConfirm={() => {
            setPopupVisible(false);
            if (popupIsSuccess) {
              router.replace('/(tabs)/profile'); // ✅ Only redirect on success
            }
          }}
        />

        {/* Title Sheet */}
        <Modal
          visible={showTitleSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTitleSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheetBackdrop}
            onPress={() => setShowTitleSheet(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.sheetContainer}>
              <Text style={styles.sheetTitle}>Select Title</Text>

              {TITLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sheetOption, opt.value === title && styles.sheetOptionSelected]}
                  onPress={() => {
                    setTitle(opt.value);
                    setShowTitleSheet(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      opt.value === title && styles.sheetOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: { padding: 16 },

  formContainer: {
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

  field: { marginBottom: 16 },

  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: Colors.text,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 45,
    backgroundColor: '#fff',
    color: Colors.text,
  },

  inputError: { borderColor: '#D32F2F' },

  inputDisabled: {
    backgroundColor: '#F2F4F7',
    borderColor: '#E5E7EB',
    color: '#9CA3AF',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  half: { flex: 0.48 },
  third: { flex: 0.32 },

  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  // Bottom Sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sheetOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sheetOptionSelected: { backgroundColor: '#f5f5f5' },
  sheetOptionText: { textAlign: 'center', fontSize: 16, color: Colors.text },
  sheetOptionTextSelected: { color: Colors.primary, fontWeight: 'bold' },

  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },

  sheetInput: {
    justifyContent: 'center',
  },
});
