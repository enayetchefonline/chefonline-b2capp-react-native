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

const TITLE_OPTIONS = [
  { label: 'Mr', value: 'Mr' },
  { label: 'Mrs', value: 'Mrs' },
  { label: 'Ms', value: 'Ms' },
  { label: 'Dr', value: 'Dr' },
];

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
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [dob, setDob] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [doaPickerVisible, setDoaPickerVisible] = useState(false);
  const [postcode, setPostcode] = useState('');

  const [saving, setSaving] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const userId = authUser?.userid;

  // Dates
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
      setCity(authUser.city || '');
      setCountry(authUser.country || '');
      setDob(authUser.dob_date || authUser.date_of_birth || '');
      setAnniversary(authUser.doa || authUser.date_of_anniversery || '');
      setPostcode(authUser.postcode || '');
    }
  }, [authUser]);

  // ========= Validators =========
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());
  const isValidUKMobile = (val) => /^07\d{9}$/.test((val || '').trim()); // keep same rule you used elsewhere
  const isValidTitle = (val) => {
    if (!val) return true; // optional
    return TITLE_OPTIONS.some((t) => t.value === val);
  };
  const sanitizeName = (t) => t.replace(/[^A-Za-z' -]/g, '');
  const isName = (val) => {
    const s = (val || '').trim();
    if (!s) return false;
    if (/[@\d]/.test(s)) return false;
    return /^[A-Za-z' -]+$/.test(s);
  };
  const sanitizeTownCountry = (t) => t.replace(/[^A-Za-z -]/g, '');
  const isTownCountry = (val) => /^[A-Za-z -]+$/.test((val || '').trim());
  const isAddress = (val) => !!(val || '').trim();

  // Lenient UK postcode (uppercase & allow space)
  const normalizePostcode = (pc) => (pc || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const isUKPostcode = (pc) =>
    /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test((pc || '').toUpperCase().trim());

  // Telephone: optional; digits, spaces, + - ( ) allowed; at least 6 chars when present
  const sanitizeTelephone = (t) => t.replace(/[^0-9+\-() ]/g, '');
  const isTelephone = (val) => {
    if (!(val || '').trim()) return true; // optional
    const s = (val || '').trim();
    if (!/^[0-9+\-() ]+$/.test(s)) return false;
    return s.replace(/[^0-9]/g, '').length >= 6;
  };

  // DOB/DOA: optional; must not be future
  const isPastOrToday = (iso) => {
    if (!iso) return true; // optional
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    return d <= todayStart;
  };

  const isFormValid = () =>
    isValidTitle(title) &&
    isName(firstName) &&
    isName(lastName) &&
    isValidEmail(email) &&
    isValidUKMobile(phone) &&
    isAddress(address1) &&
    isUKPostcode(postcode) &&
    isTownCountry(town || city) &&
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
        title: title,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        mobile_no: phone.trim(),
        telephone_no: telephone.trim(),
        address1: address1.trim(),
        address2: (address2 || '').trim(),
        city: (city || town).trim(),
        country: country.trim(),
        postcode: normalizePostcode(postcode),
        dob_date: dob,
        doa: anniversary,
      };

      const response = await userEditProfileApi(payload);

      if (response?.status === 'ok' || response?.status === 'Success' || response?.success) {
        dispatch(setUser({ user: response?.UserDetails }));
        setPopupTitle('Profile Updated');
        setPopupMessage(response?.msg || 'Your changes have been saved successfully.');
        setPopupVisible(true);
      } else {
        setPopupTitle('Update Failed');
        setPopupMessage(response?.msg || 'Something went wrong!');
        setPopupVisible(true);
      }
    } catch (_error) {
      // fall back alert if popup fails to render
      setPopupTitle('Update Failed');
      setPopupMessage('Failed to update profile. Please try again.');
      setPopupVisible(true);
    } finally {
      setSaving(false);
    }
  };

  // Helper to attach error style
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
                {/* Title Bottom Sheet Selector */}
                <View style={styles.field}>
                  <Text style={styles.label}>Title</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.sheetInput,
                      showErrors && !isValidTitle(title) && styles.inputError,
                    ]}
                    onPress={() => setShowTitleSheet(true)}
                  >
                    <Text style={{ color: title ? Colors.text : '#aaa' }}>
                      {TITLE_OPTIONS.find((opt) => opt.value === title)?.label || 'Select Title'}
                    </Text>
                  </TouchableOpacity>
                  {showErrors && !isValidTitle(title) && (
                    <Text style={styles.errorText}>Please select a valid title.</Text>
                  )}
                </View>

                {/* First & Last Name */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>First Name</Text>
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
                    <Text style={styles.label}>Last Name</Text>
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

                {/* Email (disabled) */}
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputDisabled,
                      styles.inputDisabledText,
                      showErrors && !isValidEmail(email) && styles.inputError,
                    ]}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={false}
                    placeholderTextColor={Colors.disabledText || '#9CA3AF'}
                    accessibilityState={{ disabled: true }}
                  />
                  {showErrors && !isValidEmail(email) && (
                    <Text style={styles.errorText}>Invalid email format in your profile.</Text>
                  )}
                </View>

                {/* Phone & Telephone */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputDisabled,
                        styles.inputDisabledText,
                        showErrors && !isValidUKMobile(phone) && styles.inputError,
                      ]}
                      placeholder="Mobile number"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      editable={false}
                      placeholderTextColor={Colors.disabledText || '#9CA3AF'}
                      accessibilityState={{ disabled: true }}
                    />
                    {showErrors && !isValidUKMobile(phone) && (
                      <Text style={styles.errorText}>Invalid UK mobile number in your profile.</Text>
                    )}
                  </View>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Telephone</Text>
                    <TextInput
                      style={inputStyle(isTelephone(telephone))}
                      placeholder="Landline"
                      keyboardType="phone-pad"
                      value={telephone}
                      onChangeText={(t) => setTelephone(sanitizeTelephone(t))}
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isTelephone(telephone) && (
                      <Text style={styles.errorText}>Use digits, spaces, + - ( ); at least 6 digits.</Text>
                    )}
                  </View>
                </View>

                {/* DOB Picker */}
                <View style={styles.field}>
                  <Text style={styles.label}>Date of Birth (DOB)</Text>
                  <Pressable onPress={() => setDobPickerVisible(true)}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputDisabled, // looks disabled but pressable area opens picker
                        !isPastOrToday(dob) && showErrors && styles.inputError,
                      ]}
                      placeholder="YYYY-MM-DD"
                      value={dob}
                      editable={false}
                      pointerEvents="none"
                      placeholderTextColor={Colors.disabledText || '#9CA3AF'}
                    />
                  </Pressable>
                  {showErrors && !isPastOrToday(dob) && (
                    <Text style={styles.errorText}>DOB cannot be in the future.</Text>
                  )}
                </View>

                {/* Anniversary Picker */}
                <View style={styles.field}>
                  <Text style={styles.label}>Anniversary Date (DOA)</Text>
                  <Pressable onPress={() => setDoaPickerVisible(true)}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputDisabled,
                        !isPastOrToday(anniversary) && showErrors && styles.inputError,
                      ]}
                      placeholder="YYYY-MM-DD"
                      value={anniversary}
                      editable={false}
                      pointerEvents="none"
                      placeholderTextColor={Colors.disabledText || '#9CA3AF'}
                    />
                  </Pressable>
                  {showErrors && !isPastOrToday(anniversary) && (
                    <Text style={styles.errorText}>Anniversary cannot be in the future.</Text>
                  )}
                </View>

                {/* Address Lines */}
                <View style={styles.field}>
                  <Text style={styles.label}>Address Line 1</Text>
                  <TextInput
                    style={inputStyle(isAddress(address1))}
                    placeholder="Street address, P.O. box, etc."
                    value={address1}
                    onChangeText={setAddress1}
                    placeholderTextColor={Colors.placeholder}
                  />
                  {showErrors && !isAddress(address1) && (
                    <Text style={styles.errorText}>Address line 1 is required.</Text>
                  )}
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Address Line 2</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    value={address2}
                    onChangeText={setAddress2}
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>

                {/* Town / City / Country */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.third]}>
                    <Text style={styles.label}>Postcode</Text>
                    <TextInput
                      style={inputStyle(isUKPostcode(postcode))}
                      placeholder="Enter postcode"
                      value={postcode}
                      onChangeText={(t) => setPostcode(t.toUpperCase())}
                      autoCapitalize="characters"
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isUKPostcode(postcode) && (
                      <Text style={styles.errorText}>Enter a valid UK postcode (e.g., SW1A 1AA).</Text>
                    )}
                  </View>
                  <View style={[styles.field, styles.third]}>
                    <Text style={styles.label}>Town</Text>
                    <TextInput
                      style={inputStyle(isTownCountry(town || city))}
                      placeholder="Town"
                      value={town}
                      onChangeText={(t) => setTown(sanitizeTownCountry(t))}
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isTownCountry(town || city) && (
                      <Text style={styles.errorText}>Town is required (letters and spaces only).</Text>
                    )}
                  </View>
                  <View style={[styles.field, styles.third]}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                      style={inputStyle(isTownCountry(country))}
                      placeholder="Country"
                      value={country}
                      onChangeText={(t) => setCountry(sanitizeTownCountry(t))}
                      placeholderTextColor={Colors.placeholder}
                    />
                    {showErrors && !isTownCountry(country) && (
                      <Text style={styles.errorText}>Country is required (letters and spaces only).</Text>
                    )}
                  </View>
                </View>

                {/* Save Button */}
                <View style={styles.buttonContainer}>
                  <CustomButton
                    title="SAVE CHANGES"
                    iconName="save-outline"
                    loading={saving}
                    loadingText="Saving…"
                    onPress={handleSave}
                    style={!isFormValid() && showErrors ? { opacity: 0.75 } : {}}
                  />
                  {!isFormValid() && showErrors && (
                    <Text style={{ color: '#D32F2F', marginTop: 10, textAlign: 'center' }}>
                      Please fix the errors highlighted above.
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* DOB */}
        <DateTimePickerModal
          isVisible={dobPickerVisible}
          mode="date"
          minimumDate={oldestDate}
          maximumDate={todayStart}
          onConfirm={(date) => {
            const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')}`;
            setDob(formatted);
            setDobPickerVisible(false);
          }}
          onCancel={() => setDobPickerVisible(false)}
        />

        {/* DOA */}
        <DateTimePickerModal
          isVisible={doaPickerVisible}
          mode="date"
          minimumDate={oldestDate}
          maximumDate={todayStart}
          onConfirm={(date) => {
            const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')}`;
            setAnniversary(formatted);
            setDoaPickerVisible(false);
          }}
          onCancel={() => setDoaPickerVisible(false)}
        />

        <CustomPopUp
          visible={popupVisible}
          title={popupTitle}
          message={popupMessage}
          confirmText="Great!"
          showCancel={false}
          maskClosable={false}
          onConfirm={() => setPopupVisible(false)}
          onCancel={() => setPopupVisible(false)}
        />

        {/* Title Bottom Sheet Modal */}
        <Modal
          visible={showTitleSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTitleSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={() => setShowTitleSheet(false)}>
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
                  <Text style={[styles.sheetOptionText, opt.value === title && styles.sheetOptionTextSelected]}>
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
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
  field: {
    marginBottom: 16,
  },
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
    color: Colors.text,
    height: 45,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 45,
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    flex: 0.48,
  },
  third: {
    flex: 0.3,
  },
  buttonContainer: {
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Sheet Styles
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
  sheetTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  sheetOption: {
    paddingVertical: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  sheetOptionSelected: {
    backgroundColor: '#f5f5f5',
  },
  sheetOptionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  sheetOptionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },

  // Disabled visuals
  inputDisabled: {
    backgroundColor: Colors.disabledBg || '#F2F4F7',
    borderColor: Colors.disabledBorder || '#E5E7EB',
  },
  inputDisabledText: {
    color: Colors.disabledText || '#9CA3AF',
  },
});
