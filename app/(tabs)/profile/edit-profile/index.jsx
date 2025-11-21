import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { userEditProfileApi } from '../../../../lib/api';
import { setUser } from '../../../../store/slices/authSlice';

// ⭐ Reusable Label Component
const Label = ({ text, required = false }) => (
  <Text style={styles.label}>
    {text} {required && <Text style={{ color: 'red' }}>*</Text>}
  </Text>
);

export default function EditProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [town, setTown] = useState('');
  const [postcode, setPostcode] = useState('');

  const [saving, setSaving] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [popupIsSuccess, setPopupIsSuccess] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const userId = authUser?.userid;

  console.log('auth user .....', authUser);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.first_name || '');
      setLastName(authUser.last_name || '');
      setEmail(authUser.email || '');
      setPhone(authUser.mobile_no || '');
      setAddress1(authUser.address1 || '');
      setTown(authUser.town || '');
      setPostcode(authUser.postcode || '');
    }
  }, [authUser]);

  // ===== VALIDATION METHODS =====

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());

  // ⭐ Strict UK Mobile: 07xxxxxxxxx
  const isValidUKMobile = (val) => /^07\d{9}$/.test((val || '').trim());

  const sanitizeName = (t) => t.replace(/[^A-Za-z' -]/g, '');
  const isName = (val) => /^[A-Za-z' -]+$/.test((val || '').trim());

  const sanitizeTownCountry = (t) => t.replace(/[^A-Za-z -]/g, '');
  const isTownCountry = (val) => /^[A-Za-z -]+$/.test((val || '').trim());

  const isAddress = (val) => !!(val || '').trim();

  const normalizePostcode = (pc) => (pc || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const isUKPostcode = (pc) =>
    /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test((pc || '').toUpperCase().trim());

  // ⭐ Final Form Validator (no Title, no Country, no DOB, no Address2)
  const isFormValid = () =>
    isName(firstName) &&
    isName(lastName) &&
    isValidEmail(email) &&
    isValidUKMobile(phone) &&
    isAddress(address1) &&
    isUKPostcode(postcode) &&
    isTownCountry(town);

  const handleSave = async () => {
    setShowErrors(true);
    if (!isFormValid()) return;

    setSaving(true);
    try {
      const payload = {
        userid: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        mobile_no: phone.trim(),
        telephone_no: authUser?.telephone_no || '', // preserve old value
        address1: address1.trim(),
        address2: authUser?.address2 || '',        // keep existing or empty
        city: town.trim(),
        postcode: normalizePostcode(postcode),
        // no title, no country, no dob_date, no doa
      };

      console.log('userEditProfileApi payload.....', payload);

      const response = await userEditProfileApi(payload);

      console.log('edit profile', response);

      if (response?.status === 'Success') {
        dispatch(setUser({ user: response?.UserDetails }));

        setPopupTitle('Profile Updated');
        setPopupMessage(response?.msg || 'Your changes have been saved successfully.');
        setPopupIsSuccess(true);
        setPopupVisible(true);
      } else {
        setPopupTitle('Update Failed');
        setPopupMessage(response?.msg || 'Connection error. Please try again.');
        setPopupIsSuccess(false);
        setPopupVisible(true);
      }

      console.log('auth user updated ....', authUser);
    } catch (e) {
      console.log('edit profile error', e);
      setPopupTitle('Update Failed');
      setPopupMessage('Failed to update profile. Please try again.');
      setPopupIsSuccess(false);
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

                {/* Phone (Editable) */}
                <View style={styles.field}>
                  <Label text="Mobile No" required />
                  <TextInput
                    style={inputStyle(isValidUKMobile(phone))}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="07XXXXXXXXX"
                    keyboardType="phone-pad"
                    maxLength={11}
                    placeholderTextColor={Colors.placeholder}
                  />
                  {showErrors && !isValidUKMobile(phone) && (
                    <Text style={styles.errorText}>Phone must be UK format 07XXXXXXXXX</Text>
                  )}
                </View>

                {/* Address 1 */}
                <View style={styles.field}>
                  <Label text="Address" required />
                  <TextInput
                    style={inputStyle(isAddress(address1))}
                    value={address1}
                    onChangeText={setAddress1}
                    placeholder="Street address, P.O. box, etc."
                    placeholderTextColor={Colors.placeholder}
                  />
                  {showErrors && !isAddress(address1) && (
                    <Text style={styles.errorText}>Address is required.</Text>
                  )}
                </View>

                {/* Town / Postcode */}
                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
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

                  <View style={[styles.field, styles.half]}>
                    <Label text="Town/City" required />
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
              router.replace('/(tabs)/profile');
            }
          }}
        />
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

  buttonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
});
