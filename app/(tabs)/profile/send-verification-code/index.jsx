import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RadioButton } from 'react-native-paper';
import Colors from '../../../../constants/color';
import { sendOtpApi } from '../../../../lib/api';

const normalizePhoneForSms = (p) => {
  if (!p) return '';
  const trimmed = String(p).replace(/\s+/g, '');
  // Remove a single leading 0 (e.g., 07xxxxxxxxx -> 7xxxxxxxxx)
  if (trimmed.startsWith('0')) return trimmed.slice(1);
  // Keep +countryCode forms unchanged (e.g., +447xxxxxxxxx)
  return trimmed;
};

export default function SendVerificationCodeScreen() {
  const { user } = useLocalSearchParams();
  const userInfo = JSON.parse(user || '{}');
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('Fetching...');

  const user_id = userInfo.id;
  const email = userInfo.email;
  const phone = userInfo.mobile_no;

  const maskedEmail = email?.replace(/(.{1}).+(.{2}@.+)/, '$1*******$2');
  const maskedPhone = phone?.startsWith('+')
    ? phone.replace(/(\+\d{2})(\d{2})\d+(\d{3})/, '$1******$3') // +44 format
    : phone?.replace(/(07)(\d{2})\d+(\d{3})/, '$1******$3'); // 07 format

  const getUserIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIpAddress(data.ip || '0.0.0.0');
    } catch (error) {
      console.error('Failed to fetch IP:', error);
      setIpAddress('0.0.0.0');
    }
  };

  useEffect(() => {
    getUserIp();
  }, []);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const payload = {
        funId: 127,
        user_id,
      };

      if (selectedMethod === 'sms') {
        payload.mobile = normalizePhoneForSms(phone);
      } else if (selectedMethod === 'email') {
        payload.email = email;
      }

      const response = await sendOtpApi(payload);
      // console.log('response otp....', response);

      if (response?.status === 'success') {
        router.push({
          pathname: '/profile/otp',
          params: {
            user: JSON.stringify(userInfo),
            method: selectedMethod,
          },
        });
      } else {
        Alert.alert('Failed', response?.msg || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Send OTP ❌', err);
      Alert.alert('Error', 'Something went wrong while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.heading}>Forgot Password</Text>

        <View style={styles.card}>
          <Text style={styles.optionTitle}>Select your option for receiving verification code.</Text>

          <View style={styles.radioRow}>
            <View style={styles.radioButtonWrapper}>
              <RadioButton
                value="sms"
                status={selectedMethod === 'sms' ? 'checked' : 'unchecked'}
                onPress={() => setSelectedMethod('sms')}
                color={Colors.primary}
                uncheckedColor="#888"
              />
            </View>
            <Text style={styles.radioText}>Via sms: {maskedPhone || '-'}</Text>
          </View>

          <View style={styles.radioRow}>
            <View style={styles.radioButtonWrapper}>
              <RadioButton
                value="email"
                status={selectedMethod === 'email' ? 'checked' : 'unchecked'}
                onPress={() => setSelectedMethod('email')}
                color={Colors.primary}
                uncheckedColor="#888"
              />
            </View>
            <Text style={styles.radioText}>Via email: {maskedEmail || '-'}</Text>
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send OTP</Text>}
          </TouchableOpacity>

          <Text style={styles.note}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>PLEASE NOTE</Text>
            {`: Your IP Address ${ipAddress}, We Use This IP For Verification Purpose.`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 20,
    elevation: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.text,
  },
  card: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
  },
  optionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioText: {
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: {
    marginTop: 16,
    backgroundColor: '#e53947',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    marginTop: 14,
    fontSize: 12,
    color: '#555',
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
