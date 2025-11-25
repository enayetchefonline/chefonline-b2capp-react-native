// app/(tabs)/profile/index.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

    setOtpSecondsLeft(180); // reset when modal opens

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

  // ⭐ decide verified vs not verified based on mobile_verify_status
  const isVerified = user?.mobile_verify_status === '1';

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

          {/* ⭐ Name + verification icon row */}
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {user.first_name || ''} {user.last_name || ''}
            </Text>
            {isVerified ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#16A34A" // green
                style={styles.statusIcon}
              />
            ) : (
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#DC2626" // red
                style={styles.statusIcon}
              />
            )}
          </View>

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

      {/* 🔹 Delete Confirm Overlay */}
      {showDeleteConfirmModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Profile</Text>
            <Text style={styles.modalMessage}>
              Type <Text style={{ fontWeight: 'bold' }}>DELETE</Text> to confirm profile deletion.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type DELETE here"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleteLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  !canDelete && { opacity: 0.5 },
                ]}
                onPress={handleConfirmDelete}
                disabled={!canDelete || deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔹 OTP Modal */}
      {showOtpModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Deletion</Text>
            <Text style={styles.modalMessage}>
              An OTP has been sent to your registered mobile number. Enter the code to confirm
              profile deletion.
            </Text>

            <Text style={styles.timerText}>Time left: {formatTime(otpSecondsLeft)}</Text>

            <TextInput
              style={styles.modalInput}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter OTP"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={6}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpCode('');
                }}
                disabled={otpLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  !canVerifyOtp && { opacity: 0.5 },
                ]}
                onPress={handleVerifyOtp}
                disabled={!canVerifyOtp}
              >
                {otpLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔹 Dialog (success / error) */}
      {dialog.visible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{dialog.isError ? 'Error' : 'Message'}</Text>
            <Text style={styles.modalMessage}>{dialog.message}</Text>

            <View style={[styles.modalButtonRow, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleDialogOk}
              >
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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

  // ⭐ new: name row + status icon
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusIcon: {
    marginLeft: 4,
  },

  nameText: { fontSize: 18, fontWeight: '600', color: Colors.text },
  infoText: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  buttonGrid: {
    width: '100%',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  // Overlays / modals
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    color: Colors.text,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  modalCancelButton: {
    backgroundColor: '#E5E7EB',
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary,
  },
  modalCancelText: {
    fontSize: 14,
    color: '#374151',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  timerText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
});
