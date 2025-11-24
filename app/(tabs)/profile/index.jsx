// app/(tabs)/profile/index.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';

import CustomButton from '../../../components/ui/CustomButton';
import Colors from '../../../constants/color';
import { useIpAddress } from '../../../hooks/useIpAddress';
import { deleteProfileRequest, verifyDeleteProfileOtp } from '../../../lib/api';
import { setUser } from '../../../store/slices/authSlice';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(180);

  const [dialog, setDialog] = useState({ visible: false, message: '', isError: false });

  const { ipAddress } = useIpAddress();

  // ✅ Only hydrate from AsyncStorage if Redux has no user yet
  useEffect(() => {
    const loadUserData = async () => {
      // If user already exists in Redux (e.g., after edit), just stop loading
      if (user) {
        setLoading(false);
        return;
      }

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
  }, [dispatch, router, user]);

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
        setShowDeleteConfirmModal(false);
        setOtpCode('');
        setOtpSecondsLeft(180);
        setShowOtpModal(true);
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
          <Ionicons
            name="person-circle-outline"
            size={100}
            color={Colors.primary}
            style={styles.profileIcon}
          />
          <Text style={styles.nameText}>
            {user.first_name || ''} {user.last_name || ''}
          </Text>
          <Text style={styles.infoText}>{user.email}</Text>
          <Text style={styles.infoText}>{user.mobile_no}</Text>
          <Text style={styles.infoText}>{user.postcode ?? 'Postcode not available'}</Text>
        </View>

        <View style={styles.buttonGrid}>
          <CustomButton
            title="EDIT PROFILE"
            iconName="create-outline"
            onPress={() => router.push('/profile/edit-profile')}
          />
          <CustomButton
            title="RESET PASSWORD"
            iconName="key-outline"
            onPress={() => router.push('/profile/reset-password')}
          />
          <CustomButton
            title="ORDER HISTORY"
            iconName="list-outline"
            onPress={() => router.push('/profile/order-history')}
          />
          <CustomButton title="SIGN OUT" iconName="exit-outline" onPress={handleSignOut} />
          <CustomButton
            title="DELETE PROFILE"
            type="delete"
            iconName="trash-outline"
            onPress={handleDelete}
          />
        </View>
      </View>

      {/* Modals (same as your code) */}
      {/* ... keep your delete / otp / dialog modals unchanged ... */}
      {/* (I won't rewrite them again here since logic is same) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  buttonGrid: {
    width: '100%',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ... keep your existing modal styles ...
});
