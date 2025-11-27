import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { updatePassword } from '../../../../lib/api';

export default function ConfirmNewPasswordScreen() {
  const router = useRouter();
  const { user } = useLocalSearchParams();

  let user_id = '';
  let email = '';

  try {
    const userInfo = JSON.parse(user || '{}');
    user_id = userInfo.id;
    email = userInfo.email;
  } catch (e) {
    console.error('Failed to parse user info:', e);
  }

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // field-level errors
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // track if confirm field is touched
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('error');

  const showPopup = (title, message, type = 'error') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupVisible(true);
  };

  // ===== VALIDATION HELPERS =====
  const validatePassword = (value) => {
    const raw = value || '';

    if (!raw.trim()) return 'Password is required';
    if (/\s/.test(raw)) return 'Spaces are not allowed in password';
    if (raw.length < 6) return 'Password must be at least 6 characters';

    return '';
  };

  const validateConfirmPassword = (value, newPwd) => {
    const raw = value || '';

    if (!raw.trim()) return 'Confirm password is required';
    if (/\s/.test(raw)) return 'Spaces are not allowed in password';
    if (raw.length < 6) return 'Password must be at least 6 characters';
    if (raw !== (newPwd || '')) return 'Passwords do not match';

    return '';
  };

  // ===== REAL-TIME HANDLERS =====
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    const err = validatePassword(text);
    setNewPasswordError(err);

    // ✅ only re-validate confirm if user has already interacted with it
    if (confirmTouched && confirmPassword) {
      const confirmErr = validateConfirmPassword(confirmPassword, text);
      setConfirmPasswordError(confirmErr);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    if (!confirmTouched) {
      setConfirmTouched(true);
    }
    setConfirmPassword(text);
    const err = validateConfirmPassword(text, newPassword);
    setConfirmPasswordError(err);
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    const newErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword, newPassword);

    setNewPasswordError(newErr);
    setConfirmPasswordError(confirmErr);

    if (newErr || confirmErr) return;

    const trimmedNew = newPassword.trim();

    try {
      const response = await updatePassword({
        user_id,
        email,
        password: trimmedNew,
      });

      if (response?.status === 'success') {
        showPopup('Success', 'Your password has been updated.', 'success');
      } else {
        showPopup('Failed', response?.msg || 'Password update failed.');
      }
    } catch (err) {
      console.error('Update Password ❌', err);
      showPopup('Error', 'Something went wrong. Please try again.');
    }
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    if (popupType === 'success') {
      router.replace('/profile/login');
    }
  };

  const hasNewError = !!newPasswordError;
  const hasConfirmError = !!confirmPasswordError;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Confirm New Password</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Enter your new password</Text>

          {/* New Password */}
          <View
            style={[
              styles.inputWrapper,
              hasNewError && { borderColor: 'red' },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.placeholder}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={handleNewPasswordChange}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {hasNewError && (
            <Text style={styles.errorText}>{newPasswordError}</Text>
          )}

          {/* Confirm Password */}
          <View
            style={[
              styles.inputWrapper,
              hasConfirmError && { borderColor: 'red' },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.placeholder}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {hasConfirmError && (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <CustomPopUp
          visible={popupVisible}
          title={popupTitle}
          message={popupMessage}
          type={popupType}
          onConfirm={handlePopupClose}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: '#e53947',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
});
