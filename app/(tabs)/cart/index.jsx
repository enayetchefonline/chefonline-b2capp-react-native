import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Modal, RadioButton, Snackbar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import CustomPopUp from '../../../components/ui/CustomPopUp';

// API and Redux actions
import { useIpAddress } from '../../../hooks/useIpAddress';
import { carrierBag, checkUserPhone, userPhoneVerify } from '../../../lib/api';
import {
  addItemToCart,
  setCarryBag,
  setOrderMode,
  setSelectedRestaurantDiscountId,
  setSelectedRestaurantOfferId,
  updateItemQuantity,
} from '../../../store/slices/cartSlice';

import { setUser } from '../../../store/slices/authSlice';

// --- FIXED COLOR CONSTANTS ---
const COLORS = {
  background: '#F5F5F5',
  text: '#333333',
  border: '#E0E0E0',
  white: '#FFFFFF',
  primary: '#EC1839', // Strong red
  secondary: '#333333',
  shadow: '#000000',
  secondaryText: '#ccc',
};

export default function CartScreen() {
  const dispatch = useDispatch();
  const router = useRouter();

  // 👇 get screen height to control the items area's max height
  const { height: screenHeight } = useWindowDimensions();

  const [showMinOrderPopup, setShowMinOrderPopup] = useState(false);
  const [showNoOfferDiscountPopup, setShowNoOfferDiscountPopup] = useState(false);

  const [numberVrificationModalVisible, setNumberVrificationModalVisible] = useState(false);
  const [numberVrificationOTPModalVisible, setNumberVrificationOTPModalVisible] = useState(false);

  const [visibleSnackBar, setVisibleSnackBar] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const restaurantId = useSelector((state) => state.cart.restaurantId);
  const storeItemList = useSelector((state) => state.cart.items);
  const storeOrderPolicy = useSelector((state) => state.cart.order_policy);
  const storeDiscount = useSelector((state) => state.cart.discount);
  const storeOffer = useSelector((state) => state.cart.offer);
  const storeSelectedDiscountId = useSelector((state) => state.cart.selected_discount_id);
  const storeSelectedOfferId = useSelector((state) => state.cart.selected_offer_id);

  // get user, token, ip from auth slice
  const { user: authUser, token: authToken, ip: authIp } = useSelector((state) => state.auth);

  // 🔢 Phone modal state
  const [phoneInput, setPhoneInput] = useState(authUser?.mobile_no || '');
  const [phoneError, setPhoneError] = useState('');

  // 🔔 Phone / OTP status popup
  const [phoneStatusPopupVisible, setPhoneStatusPopupVisible] = useState(false);
  const [phoneStatusPopupTitle, setPhoneStatusPopupTitle] = useState('');
  const [phoneStatusPopupMessage, setPhoneStatusPopupMessage] = useState('');

  // ⭐ OTP modal state
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // IP address via reusable hook
  const { ipAddress } = useIpAddress();

  const isUserHasNumber = authUser?.mobile_no && authUser?.mobile_no !== '';

  // console.log('isUserHasNumber', isUserHasNumber);

  const availableModes = (storeOrderPolicy?.policy || []).map((p) => p.policy_name);

  const [mode, setMode] = useState(null);

  const cartItems = Object.values(storeItemList || {}).map(({ item, quantity }) => ({
    id: item?.dish_id,
    name: item?.dish_name,
    price: parseFloat(item?.dish_price || 0),
    qty: quantity,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const loadCarryBag = useCallback(
    async () => {
      try {
        const response = await carrierBag({ restId: restaurantId });

        if (response?.restaurant_service_id && parseFloat(response.price) > 0) {
          const bagId = 'carry_bag';

          // ✅ Prevent adding carry bag again if already exists
          if (storeItemList[bagId]) {
            return;
          }

          const carryBagItem = {
            dish_id: bagId,
            dish_name: 'Carry Bag',
            dish_price: response.price,
          };

          dispatch(setCarryBag(response));
          dispatch(addItemToCart(carryBagItem));
        }
      } catch (err) {
        console.error('❌ Failed to load carry bag:', err);
      }
    },
    [restaurantId, storeItemList, dispatch]
  );

  // 👉 Load carry bag when restaurant & cart items exist
  useEffect(() => {
    if (restaurantId && Object.keys(storeItemList).length > 0) {
      loadCarryBag();
    }
  }, [restaurantId, storeItemList, loadCarryBag]);

  // 👉 Only reset mode when cart becomes completely empty
  useEffect(() => {
    if (!storeItemList || Object.keys(storeItemList).length === 0) {
      setMode(null);
    }
  }, [storeItemList]);

  // 👉 Handle:
  // 1) Auto-select single policy
  // 2) Auto-select single applicable discount/offer
  useEffect(() => {
    // --- 1) Auto-select order policy if only one and cart has items ---
    if (!mode && availableModes.length === 1 && Object.keys(storeItemList || {}).length > 0) {
      const singleMode = availableModes[0];
      setMode(singleMode);
      dispatch(setOrderMode(singleMode));
    }

    // If mode not selected yet (or no items), no need to evaluate discounts/offers
    if (!mode || subtotal <= 0) {
      return;
    }

    // --- 2) Calculate applicable discounts for current mode + subtotal ---
    let applicableDiscountsLocal = [];
    if (storeDiscount?.status === 1 && Array.isArray(storeDiscount.off)) {
      applicableDiscountsLocal = storeDiscount.off.filter((d) => {
        const orderType = d.order_type?.toLowerCase();
        return (
          d.active === 1 &&
          (orderType === mode.toLowerCase() || orderType === 'both') &&
          parseFloat(d.eligible_amount || 0) <= subtotal
        );
      });
    }

    // --- 3) Calculate applicable offers for current subtotal ---
    let applicableOffersLocal = [];
    if (storeOffer?.status === 1 && Array.isArray(storeOffer.offer_list)) {
      applicableOffersLocal = storeOffer.offer_list.filter((o) => {
        return o.active === 1 && parseFloat(o.eligible_amount || 0) <= subtotal;
      });
    }

    // --- 4) Auto-select only if there is exactly ONE option in total (one discount OR one offer) ---
    if (!storeSelectedDiscountId && !storeSelectedOfferId) {
      const totalOptions = applicableDiscountsLocal.length + applicableOffersLocal.length;

      if (totalOptions === 1) {
        if (applicableDiscountsLocal.length === 1) {
          const onlyDiscount = applicableDiscountsLocal[0];
          dispatch(setSelectedRestaurantDiscountId(onlyDiscount.discount_id));
        } else if (applicableOffersLocal.length === 1) {
          const onlyOffer = applicableOffersLocal[0];
          dispatch(setSelectedRestaurantOfferId(onlyOffer.id));
        }
      }
    }
  }, [
    availableModes,
    mode,
    storeItemList,
    dispatch,
    storeDiscount,
    storeOffer,
    storeSelectedDiscountId,
    storeSelectedOfferId,
    subtotal,
  ]);

  const applicableDiscounts = (storeDiscount?.status === 1 ? storeDiscount.off : []).filter((d) => {
    const orderType = d.order_type?.toLowerCase();
    return (
      d.active === 1 &&
      (orderType === mode?.toLowerCase() || orderType === 'both') &&
      parseFloat(d.eligible_amount || 0) <= subtotal
    );
  });

  const applicableOffers = (storeOffer?.status === 1 ? storeOffer.offer_list : []).filter((o) => {
    return o.active === 1 && parseFloat(o.eligible_amount || 0) <= subtotal;
  });

  const increaseQty = (id, currentQty) => {
    dispatch(updateItemQuantity({ itemId: id, quantity: currentQty + 1 }));
  };

  const decreaseQty = (id, currentQty) => {
    if (currentQty > 1) {
      dispatch(updateItemQuantity({ itemId: id, quantity: currentQty - 1 }));
    } else {
      dispatch(updateItemQuantity({ itemId: id, quantity: 0 }));
    }
  };

  const getMinOrderAmount = () => {
    const currentPolicy = storeOrderPolicy?.policy?.find((p) => p.policy_name === mode);
    return parseFloat(currentPolicy?.min_order || '0');
  };

  // 🔢 Phone validation helpers (for modal only)
  const ukMobileRegex = /^07\d{9}$/;
  const isPhoneValid = ukMobileRegex.test((phoneInput || '').trim());

  // ✅ callCheckUserPhone – calls API with proper payload + returns response
  const callCheckUserPhone = async (phone) => {
    try {
      const payload = {
        user_id: authUser?.userid,
        ip_address: ipAddress, // from useIpAddress hook
        phone_no: phone,
      };

      const response = await checkUserPhone(payload);
      // console.log('response checkUserPhone', response);
      return response;
    } catch (error) {
      console.error('checkUserPhone error:', error);
      throw error;
    }
  };

  // ⭐ Helper: which phone to use for OTP
  const getPhoneForOtp = () => {
    const fromUser = authUser?.mobile_no;
    const fromInput = phoneInput;
    return (fromUser || fromInput || '').trim();
  };

  // ✅ Only validate while typing (no API here)
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, ''); // keep digits only
    setPhoneInput(cleaned);

    if (cleaned && !ukMobileRegex.test(cleaned)) {
      setPhoneError('Enter a valid UK mobile number (e.g., 07123456789)');
    } else {
      setPhoneError('');
    }
  };

  // ✅ Save button: call API, update Redux, AND persist to AsyncStorage
  const handleSavePhone = async () => {
    const trimmed = (phoneInput || '').trim();

    if (!ukMobileRegex.test(trimmed)) {
      setPhoneError('Enter a valid UK mobile number (e.g., 07123456789)');
      return;
    }

    try {
      // 1) Send OTP + register number on backend
      const response = await callCheckUserPhone(trimmed);

      if (response?.status === 'success') {
        // 2) Build updated user (still unverified)
        const updatedUser = {
          ...authUser,
          mobile_no: trimmed,
          mobile_verify_status: '0',
        };

        // 3) Update Redux store
        dispatch(
          setUser({
            user: updatedUser,
            token: authToken,
            ip: authIp || ipAddress,
          })
        );

        // 4) Persist to AsyncStorage
        try {
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
          if (authToken) {
            await AsyncStorage.setItem('accessToken', authToken);
          }
        } catch (storageErr) {
          console.log('Failed to save updated user to AsyncStorage', storageErr);
        }

        // 5) Close phone modal and open OTP modal
        setNumberVrificationModalVisible(false);
        setOtpInput('');
        setOtpError('');
        setNumberVrificationOTPModalVisible(true);
      } else {
        const msg =
          response?.msg ||
          'Failed to verify number. Please try again.';

        // Special handling: max OTP request limit reached
        if (
          msg.toLowerCase().includes('maximum number of otp requests')
        ) {
          // Close phone modal, show info popup
          setNumberVrificationModalVisible(false);
        }

        setPhoneStatusPopupTitle('Error');
        setPhoneStatusPopupMessage(msg);
        setPhoneStatusPopupVisible(true);
      }
    } catch (error) {
      console.error('handleSavePhone error', error);
      setPhoneStatusPopupTitle('Error');
      setPhoneStatusPopupMessage('Something went wrong. Please try again.');
      setPhoneStatusPopupVisible(true);
    }
  };

  // ⭐ OTP verify handler
  const handleVerifyOtp = async () => {
    const trimmedOtp = (otpInput || '').trim();

    if (!trimmedOtp) {
      setOtpError('Please enter the OTP you received.');
      return;
    }

    if (!/^\d{4,6}$/.test(trimmedOtp)) {
      setOtpError('Enter a valid OTP (4–6 digits).');
      return;
    }

    if (!authUser?.userid) {
      setOtpError('User info missing. Please login again.');
      return;
    }

    const phoneNo = getPhoneForOtp();
    if (!phoneNo) {
      setOtpError('Phone number missing. Please try again.');
      return;
    }

    try {
      setOtpLoading(true);

      const resp = await userPhoneVerify({
        user_id: authUser.userid,
        ip_address: ipAddress,
        phone_no: phoneNo,
        otp: trimmedOtp,
      });

      // console.log('userPhoneVerify response', resp);

      if (resp?.status === 'success') {
        // ✅ Mark user as verified
        const updatedUser = {
          ...authUser,
          mobile_no: phoneNo,
          mobile_verify_status: '1',
          mobile_verify_date: new Date().toISOString(),
        };

        // 🔥 Update Redux store
        dispatch(
          setUser({
            user: updatedUser,
            token: authToken,
            ip: authIp || ipAddress,
          })
        );

        // keep local phone input in sync
        setPhoneInput(phoneNo);

        // 🔥 Persist to AsyncStorage
        try {
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
          if (authToken) {
            await AsyncStorage.setItem('accessToken', authToken);
          }
        } catch (storageErr) {
          console.log('Failed to persist verified user', storageErr);
        }

        setNumberVrificationOTPModalVisible(false);
        setOtpInput('');
        setOtpError('');

        setSnackBarMessage(resp?.msg || 'Phone number verified successfully.');
        setVisibleSnackBar(true);

        // 👉 After successful verification, continue normal proceed flow
        //    but SKIP phone/OTP checks (otherwise OTP modal will show again)
        await handleProceed(true);
      } else {
        setOtpError(resp?.msg || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('handleVerifyOtp error', err);
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ⭐ handleProceed with optional skipPhoneCheck flag
  const handleProceed = async (skipPhoneCheck = false) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace({
          pathname: '/profile/login',
          params: { redirect: '/cart' },
        });
        return;
      }

      // Only do phone / OTP logic if NOT skipping
      if (!skipPhoneCheck) {
        // CASE 1: User already has a number but not verified → show OTP modal
        if (authUser?.mobile_no && authUser?.mobile_verify_status === '0') {
          try {
            const resp = await callCheckUserPhone(authUser.mobile_no);

            if (resp?.status === 'success') {
              setOtpInput('');
              setOtpError('');
              setNumberVrificationOTPModalVisible(true);
            } else {
              const msg =
                resp?.msg ||
                'Failed to send OTP. Please try again.';

              // Special handling: max OTP request reached
              if (
                msg.toLowerCase().includes('maximum number of otp requests')
              ) {
                // Just show message, do not open OTP modal
              }

              setPhoneStatusPopupTitle('Error');
              setPhoneStatusPopupMessage(msg);
              setPhoneStatusPopupVisible(true);
            }
          } catch (e) {
            console.log('Failed to send OTP for existing number', e);
            setPhoneStatusPopupTitle('Error');
            setPhoneStatusPopupMessage('Failed to send OTP. Please try again.');
            setPhoneStatusPopupVisible(true);
          }
          return;
        }

        // CASE 2: User has no number at all → first phone modal, then OTP modal
        if (!authUser?.mobile_no) {
          setNumberVrificationModalVisible(true);
          return;
        }
      }

      // From here: phone is verified OR we explicitly skipped phone check

      if (!mode) {
        setSnackBarMessage('Please select order type: Collection or Delivery');
        setVisibleSnackBar(true);
        return;
      }

      const minAmount = getMinOrderAmount();
      if (subtotal < minAmount) {
        setShowMinOrderPopup(true);
        return;
      }

      const hasAvailableDiscounts = storeDiscount?.status === 1 && storeDiscount.off?.length > 0;
      const hasAvailableOffers = storeOffer?.status === 1 && storeOffer.offer_list?.length > 0;

      const shouldPromptForDiscountOrOffer =
        (hasAvailableDiscounts || hasAvailableOffers) && !storeSelectedDiscountId && !storeSelectedOfferId;

      if (shouldPromptForDiscountOrOffer) {
        setShowNoOfferDiscountPopup(true);
        return;
      }

      if (mode.toLowerCase() === 'collection') {
        setMode(null);
        router.push('/cart/checkout');
      } else if (mode.toLowerCase() === 'delivery') {
        router.push('/cart/delivery');
      } else {
        console.warn('Invalid order mode');
      }
    } catch (error) {
      console.error('handleProceed error:', error);
    }
  };

  const selectedDiscount = applicableDiscounts.find((d) => d.discount_id === storeSelectedDiscountId);

  const discountAmount =
    selectedDiscount?.discount_type === 'Percentage'
      ? (subtotal * parseFloat(selectedDiscount.discount_amount || 0)) / 100
      : parseFloat(selectedDiscount?.discount_amount || 0);

  const total = subtotal - discountAmount;

  // For masking phone in OTP modal
  const otpPhoneMasked = (() => {
    const p = getPhoneForOtp();
    if (!p) return '';
    if (p.length <= 4) return p;
    return p.replace(/(\d{3})\d+(\d{2})/, '$1******$2');
  })();

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={200} color={COLORS.secondaryText} />
          <Text style={{ color: COLORS.secondaryText, fontSize: 20, textTransform: 'uppercase' }}>
            Your cart is empty
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 150, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Order Type Toggle */}
          <View style={styles.toggleRow}>
            {availableModes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.toggleBtn, mode === type && styles.toggleBtnActive]}
                onPress={() => {
                  setMode(type);
                  dispatch(setOrderMode(type));
                }}
              >
                <Text style={[styles.toggleText, mode === type && styles.toggleTextActive]}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cart Items (scrollable inside a fixed-height area) */}
          <View style={styles.listCard}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: screenHeight * 0.5 }}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {cartItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {item.qty} x {item.name}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id, item.qty)}>
                      <Ionicons name="remove-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.priceText}>£{(item.price * item.qty).toFixed(2)}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id, item.qty)}>
                      <Ionicons name="add-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Available Discounts */}
          {applicableDiscounts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Discounts</Text>
              <RadioButton.Group
                onValueChange={(value) => {
                  dispatch(setSelectedRestaurantDiscountId(value));
                  dispatch(setSelectedRestaurantOfferId(''));
                }}
                value={storeSelectedDiscountId}
              >
                {applicableDiscounts.map((d) => (
                  <View key={d.discount_id} style={styles.radioItem}>
                    <View style={styles.radioButtonWrapper}>
                      <RadioButton value={d.discount_id} color={COLORS.primary} uncheckedColor="#888" />
                    </View>
                    <Text style={styles.radioLabel}>
                      {d.discount_title} - {d.discount_description}
                    </Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>
          )}

          {/* Available Offers */}
          {applicableOffers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Offers</Text>
              <RadioButton.Group
                onValueChange={(value) => {
                  dispatch(setSelectedRestaurantOfferId(value));
                  dispatch(setSelectedRestaurantDiscountId(''));
                }}
                value={storeSelectedOfferId}
              >
                {applicableOffers.map((o) => (
                  <View key={o.id} style={styles.radioItem}>
                    <View style={styles.radioButtonWrapper}>
                      <RadioButton value={o.id} color={COLORS.primary} uncheckedColor="#888" />
                    </View>
                    <Text style={styles.radioLabel}>{o.offer_title}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </View>
          )}
        </ScrollView>
      )}

      {/* Summary Footer */}
      {cartItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.summaryText}>SUBTOTAL: £{subtotal.toFixed(2)}</Text>
            {storeSelectedDiscountId && (
              <Text style={styles.summaryText}>
                DISCOUNT: -£{discountAmount.toFixed(2)}{' '}
                {selectedDiscount?.discount_title ? `(${selectedDiscount.discount_title})` : ''}
              </Text>
            )}
            <Text style={styles.summaryText}>TOTAL: £{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.proceedTouchable} onPress={() => handleProceed()}>
            <Text style={styles.proceedText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomPopUp
        visible={showMinOrderPopup}
        title="Minimum Order Required"
        message={`Minimum order for ${mode} is £${getMinOrderAmount().toFixed(2)}. Your subtotal is £${subtotal.toFixed(
          2
        )}.`}
        onConfirm={() => setShowMinOrderPopup(false)}
        showCancel={false}
        confirmText="OK"
      />

      <CustomPopUp
        visible={showNoOfferDiscountPopup}
        title="Continue Without Offer or Discount?"
        message="You haven't selected any discount or offer. Do you want to continue?"
        showCancel
        onCancel={() => setShowNoOfferDiscountPopup(false)}
        onConfirm={() => {
          setShowNoOfferDiscountPopup(false);
          setMode(null);
          router.push('/cart/checkout');
        }}
      />

      {/* Phone / OTP status popup */}
      <CustomPopUp
        visible={phoneStatusPopupVisible}
        title={phoneStatusPopupTitle}
        message={phoneStatusPopupMessage}
        onConfirm={() => setPhoneStatusPopupVisible(false)}
        showCancel={false}
        confirmText="OK"
      />

      <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
        <Snackbar
          visible={visibleSnackBar}
          duration={3000}
          onDismiss={() => {
            setSnackBarMessage('');
            setVisibleSnackBar(false);
          }}
          action={{
            label: 'OK',
            onPress: () => {
              setSnackBarMessage('');
              setVisibleSnackBar(false);
            },
          }}
        >
          {snackBarMessage}
        </Snackbar>
      </View>

      {/* Phone Number Modal */}
      <Modal
        visible={numberVrificationModalVisible}
        onDismiss={() => setNumberVrificationModalVisible(false)}
        contentContainerStyle={styles.phoneModalContainer}
      >
        <Text style={styles.phoneModalTitle}>Mobile Number</Text>

        <TextInput
          style={styles.phoneInput}
          placeholder="Enter your UK mobile number (e.g., 07123456789)"
          placeholderTextColor="#D1D5DB"
          keyboardType="phone-pad"
          maxLength={11}
          value={phoneInput}
          onChangeText={handlePhoneChange}
        />

        {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}

        <View style={styles.phoneButtonRow}>
          <TouchableOpacity
            style={[styles.phoneButton, styles.phoneCancelButton]}
            onPress={() => {
              setNumberVrificationModalVisible(false);
              setPhoneInput(authUser?.mobile_no || '');
              setPhoneError('');
            }}
          >
            <Text style={styles.phoneCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.phoneButton,
              styles.phoneSaveButton,
              !isPhoneValid && { opacity: 0.5 },
            ]}
            onPress={handleSavePhone}
            disabled={!isPhoneValid}
          >
            <Text style={styles.phoneSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ⭐ OTP Modal */}
      <Modal
        visible={numberVrificationOTPModalVisible}
        onDismiss={() => setNumberVrificationOTPModalVisible(false)}
        contentContainerStyle={styles.phoneModalContainer}
      >
        <Text style={styles.phoneModalTitle}>Enter OTP</Text>
        {otpPhoneMasked ? (
          <Text style={{ fontSize: 12, color: COLORS.text, marginBottom: 8 }}>
            We have sent a verification code to {otpPhoneMasked}
          </Text>
        ) : null}

        <TextInput
          style={styles.phoneInput}
          placeholder="Enter OTP"
          placeholderTextColor="#D1D5DB"
          keyboardType="number-pad"
          maxLength={6}
          value={otpInput}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '');
            setOtpInput(cleaned);
            setOtpError('');
          }}
        />

        {otpError ? <Text style={styles.phoneError}>{otpError}</Text> : null}

        <View style={styles.phoneButtonRow}>
          <TouchableOpacity
            style={[styles.phoneButton, styles.phoneCancelButton]}
            onPress={() => {
              setNumberVrificationOTPModalVisible(false);
              setOtpInput('');
              setOtpError('');
            }}
          >
            <Text style={styles.phoneCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.phoneButton,
              styles.phoneSaveButton,
              (otpLoading || otpInput.length < 4) && { opacity: 0.5 },
            ]}
            onPress={handleVerifyOtp}
            disabled={otpLoading || otpInput.length < 4}
          >
            <Text style={styles.phoneSaveText}>{otpLoading ? 'Verifying...' : 'Verify'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 12, color: COLORS.text },
  toggleTextActive: { color: COLORS.white },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  itemText: { flex: 1, fontSize: 14, color: COLORS.text },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 6,
  },
  priceText: { fontSize: 14, color: COLORS.text },

  section: { marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: COLORS.text },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radioLabel: { fontSize: 14, color: COLORS.text },

  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  summaryText: { color: COLORS.white, fontSize: 12, lineHeight: 18 },
  proceedTouchable: {
    backgroundColor: '#A70000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  proceedText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },

  emptyCart: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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

  phoneModalContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginHorizontal: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  phoneModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },

  phoneInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.text,
  },

  phoneError: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
  },

  phoneButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },

  phoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 4,
    marginLeft: 8,
  },

  phoneCancelButton: {
    backgroundColor: '#F3F4F6',
  },

  phoneSaveButton: {
    backgroundColor: COLORS.primary,
  },

  phoneCancelText: {
    color: '#4B5563',
    fontSize: 14,
  },

  phoneSaveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
