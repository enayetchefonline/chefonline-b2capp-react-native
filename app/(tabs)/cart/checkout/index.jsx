import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { checkVoucher, confirmOrder, getCarrierBagData } from '../../../../lib/api';
import { getmyguavapay, myguavapayPaymentUpdate } from '../../../../lib/utils/myguava-api';
import { getAvailableTimeSlots } from '../../../../lib/utils/restaurantSchedule';
import { getRyftpay } from '../../../../lib/utils/ryftpay-api';
import {
    setSelectedRestaurantDiscountId,
    setSelectedRestaurantOfferId,
    setSpecialNote,
    setVoucher,
} from '../../../../store/slices/cartSlice';

export default function CheckoutScreen() {
	// Navigation and Redux
	const router = useRouter();
	const dispatch = useDispatch();

	// Popup/modal visibility
	const [timeSheetVisible, setTimeSheetVisible] = useState(false);
	const [notePopupVisible, setNotePopupVisible] = useState(false);
	const [voucherPopupVisible, setVoucherPopupVisible] = useState(false);
	const [voucherValidationPopupVisible, setVoucherValidationPopupVisible] = useState(false);
	const [voucherValidationMessage, setVoucherValidationMessage] = useState('');
	const [removeVoucherConfirmVisible, setRemoveVoucherConfirmVisible] = useState(false);
	const [verificationCodePopupVisible, setVerificationCodePopupVisible] = useState(false);

	// State for order process
	const [verificationCode, setVerificationCode] = useState('');
	const [lastOrderPayload, setLastOrderPayload] = useState(null);
	const [selectedTime, setSelectedTime] = useState('');
	const [selectedPaymentSettingID, setPaymentSettingID] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState('Card');
	const [donationAmount, setDonationAmount] = useState('');
	const [donationConfirmed, setDonationConfirmed] = useState(false);
	const [donationPopupVisible, setDonationPopupVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const [verificationLoading, setVerificationLoading] = useState(false);
	const [errorPopupVisible, setErrorPopupVisible] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	// Carrier bag options
	const [carrierBag, setCarrierBag] = useState(null);
	const [carrierBagQtn, setcarrierBagQtn] = useState(0);
	const [carrierBagPrice, setcarrierBagPrice] = useState(0);
	const [carrierBagFinalPayload, setCarrierBagFinalPayload] = useState(null);

	// Redux selectors
	const storeNote = useSelector((state) => state.cart.note);
	const storeVoucher = useSelector((state) => state.cart.voucher);
	const storeItemList = useSelector((state) => state.cart.items);
	const storeDiscount = useSelector((state) => state.cart.discount);
	const storeSelectedDiscountId = useSelector((state) => state.cart.selected_discount_id);
	const storeSelectedOfferId = useSelector((state) => state.cart.selected_offer_id);
	const storePostCodeCharge = useSelector((state) => state.cart.postCodeCharge);
	const storeOrderMode = useSelector((state) => state.cart.order_mode);
	const authUser = useSelector((state) => state.auth.user);
	const restaurantId = useSelector((state) => state.cart.restaurantId);
	const restaurantName = useSelector((state) => state.cart.restaurantName);
	const restaurantDetails = useSelector((state) => state.restaurantDetail.data);
	const availablePaymentMethods = useSelector((state) => state.restaurantDetail.payment_options);

	// Controlled input values
	const [specialNote, setSpecialNoteText] = useState(storeNote || '');
	const [voucherCode, setVoucherCodeText] = useState(storeVoucher?.vouchar_code || '');

	// console.log('storeSelectedDiscountId', storeSelectedDiscountId);

	const normalize = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
	const appliesToMode = (orderType, mode) => {
		const t = normalize(orderType);
		const m = normalize(mode);
		// Treat '', 'both', 'all', 'any' as universal
		if (!t || ['both', 'all', 'any', 'all modes'].includes(t)) return true;
		return t === m;
	};

	// Set default payment method and paymentSettingID when payment options change
	useEffect(() => {
		if (availablePaymentMethods && availablePaymentMethods.length > 0) {
			setPaymentMethod(availablePaymentMethods[0]?.payment_method || 'Cash');
			setPaymentSettingID(availablePaymentMethods[0]?.payment_settings_id || 0);
		}
	}, [availablePaymentMethods]);

	// Fetch carrier bag options and calculate quantity/price when restaurant or cart changes
	useEffect(() => {
		async function fetchCarrierBag() {
			const response = await getCarrierBagData({restId: restaurantId});

			let carrierBagQtn = 0;
			let carrierBagPrice = 0;
			let restaurantServiceId = null;

			// Find Carry Bag item only
			const carryBagEntry = Object.values(storeItemList).find(
				({item}) => item.dish_name?.toLowerCase() === 'carry bag'
			);

			if (carryBagEntry) {
				carrierBagQtn = carryBagEntry.quantity;
				carrierBagPrice = parseFloat(carryBagEntry.item.dish_price) * carryBagEntry.quantity;
			}

			if (response && response.restaurant_service_id) {
				restaurantServiceId = response.restaurant_service_id;
				setCarrierBag(response);
			} else {
				setCarrierBag(null);
			}

			setcarrierBagQtn(carrierBagQtn);
			setcarrierBagPrice(carrierBagPrice);

			const carrierBagTotal = carrierBagPrice;

			let carrierBagPayload = '';
			if (carrierBagTotal > 0 && restaurantServiceId && carrierBagQtn > 0 && carrierBagPrice > 0) {
				carrierBagPayload = JSON.stringify([
					{
						restaurant_service_id: restaurantServiceId,
						quantity: carrierBagQtn,
						price: carrierBagPrice,
					},
				]);
			} else {
				carrierBagPayload = JSON.stringify([]);
			}

			setCarrierBagFinalPayload(carrierBagPayload);
		}

		fetchCarrierBag();
	}, [restaurantId, storeItemList]);

	// Time slots for delivery/collection
	const availableTimeSlots = getAvailableTimeSlots(
		restaurantDetails?.restuarent_schedule?.schedule || [],
		storeOrderMode || 'Collection',
		restaurantDetails?.order_policy?.policy?.find((p) => p.policy_name === storeOrderMode)?.policy_time || 0
	);

	// console.log('availableTimeSlots', availableTimeSlots);
	// console.log('restaurantDetails', JSON.stringify(restaurantDetails.restuarent_schedule));

	// Default selected time
	useEffect(() => {
		if (availableTimeSlots.length > 0 && !selectedTime) {
			setSelectedTime(availableTimeSlots[0]);
		}
	}, [availableTimeSlots]);

	// Carry Bag Extraction
	const carryBagItem = Object.values(storeItemList).find(({item}) => item.dish_name?.toLowerCase() === 'carry bag');
	const carryBagTotal = carryBagItem ? parseFloat(carryBagItem.item.dish_price) * carryBagItem.quantity : 0;

	// Map cart items to array with price/total (excluding carry bag)
	const itemList = Object.values(storeItemList)
		.filter(({item}) => item.dish_name?.toLowerCase() !== 'carry bag')
		.map(({item, quantity}) => ({
			id: item.dish_id,
			name: item.dish_name,
			price: parseFloat(item.dish_price),
			qty: quantity,
			total: parseFloat(item.dish_price) * quantity,
		}));

	// Subtotal (excluding carry bag)
	const subtotal = itemList.reduce((sum, i) => sum + i.total, 0);

	// Discount and voucher logic
	let discountVal = 0;
	let voucherVal = 0;
	let selectedDiscount = null;

	const isVoucherApplied = !!storeVoucher?.id;
	const isVoucherFixed = storeVoucher?.is_fixed === '1';
	const isFirstOrderVoucher = storeVoucher?.is_type === '1';
	const isStackable = storeVoucher?.applicable_with_other_offers === '1';
	const isFirstOrder = parseInt(authUser?.total_orders_given || 0) === 0;

	const orderMode = (storeOrderMode || '').trim();

	// Grab the chosen discount from store
	const selectedDiscountRaw = (storeDiscount?.off || []).find((d) => d.discount_id === storeSelectedDiscountId);

	// Check if it’s applicable for THIS mode + subtotal
	const discountApplicable =
		!!selectedDiscountRaw &&
		selectedDiscountRaw.active === 1 &&
		appliesToMode(selectedDiscountRaw.order_type, orderMode) &&
		subtotal >= parseFloat(selectedDiscountRaw.eligible_amount || 0);

	if (!isVoucherApplied || isStackable) {
		selectedDiscount = discountApplicable ? selectedDiscountRaw : null;
		if (selectedDiscount) {
			const amt = parseFloat(selectedDiscount.discount_amount || 0);
			if (normalize(selectedDiscount.discount_type) === 'percentage') {
				discountVal = (subtotal * amt) / 100;
			} else {
				discountVal = amt || 0;
			}
		}
	}

	// Voucher calculation
	if (isVoucherApplied && (!isFirstOrderVoucher || isFirstOrder)) {
		const minOrder = parseFloat(storeVoucher?.min_order || 0);
		if (subtotal >= minOrder) {
			if (isVoucherFixed) {
				voucherVal = parseFloat(storeVoucher.discount_amount || 0);
			} else {
				voucherVal = (subtotal * parseFloat(storeVoucher.discount_amount || 0)) / 100;
			}
		}
	}

	// Delivery charge
	const deliveryCharge =
		storePostCodeCharge?.status === 'Success'
			? parseFloat(storePostCodeCharge.user_postcode_charge?.min_delivery_charge || 0)
			: 0;

	// Final total calculations
	const donationNum = Number(donationAmount) || 0;
	const finalTotal = donationNum + subtotal + deliveryCharge - discountVal - voucherVal;
	const finalTotalWithCarryBag = finalTotal + carryBagTotal;

	// Voucher code submit handler
	async function handleVoucherCodeSubmit(code) {
		try {
			if (!code?.trim()) return;
			const result = await checkVoucher({
				restId: restaurantId,
				userId: authUser?.userid || '',
				voucherCode: code,
				grandTotal: subtotal.toFixed(2),
				email: authUser?.email || '',
			});

			const voucher = result?.data?.voucher;
			const totalOrdersGiven = parseInt(result?.total_orders_given || 0);
			if (result?.status === 1 && voucher) {
				if (voucher?.is_type === '1' && totalOrdersGiven > 0) {
					setVoucherValidationMessage('This voucher is only valid for your first order.');
				} else {
					dispatch(setVoucher(voucher));
					if (voucher.applicable_with_other_offers === '0') {
						dispatch(setSelectedRestaurantDiscountId(''));
						dispatch(setSelectedRestaurantOfferId(''));
					}
					setVoucherValidationMessage('Voucher applied successfully!');
					setVoucherPopupVisible(false);
				}
			} else {
				setVoucherValidationMessage(result?.message || 'Invalid or inactive voucher.');
			}
		} catch (error) {
			setVoucherValidationMessage('Failed to validate voucher. Please try again.');
		} finally {
			setVoucherPopupVisible(false); // 🟢 First, close the previous popup
			setTimeout(
				() => {
					setVoucherValidationPopupVisible(true); // 🟢 Then safely open the validation popup
				},
				Platform.OS === 'ios' ? 300 : 0
			);
		}
	}

	// Verification (SMS code) handler
	async function handleVerificationSubmit() {
		if (!verificationCode || !lastOrderPayload) return;
		setVerificationLoading(true);
		const newPayload = {
			...lastOrderPayload,
			verification_code: verificationCode,
		};
		try {
			const response = await confirmOrder(newPayload);
			if (typeof response === 'string' && response.includes('MySQL server has gone away')) {
				setVerificationCodePopupVisible(false);
				alert('Something went wrong. Please try again.');
				return;
			}
			if (response.status === 'Success') {
				setVerificationCodePopupVisible(false);
				// dispatch(clearCart());
				router.push({
					pathname: '/order-success',
					params: {
						orderId: response.order_ID,
						status: response.status,
						message: response.msg,
						transactionId: response.transaction_id,
						items: JSON.stringify(itemList), // must stringify
						discount: discountVal.toFixed(2),
						carrybag: carryBagTotal.toFixed(2),
						delivery: deliveryCharge.toFixed(2),
						total: finalTotalWithCarryBag.toFixed(2),
					},
				});
			} else if (response.status === 'Failure') {
				setVerificationCodePopupVisible(false);
				router.push({
					pathname: '/order-success',
					params: {
						orderId: response.order_ID,
						status: response.status,
						message: response.msg,
						transactionId: response.transaction_id,
						items: JSON.stringify(itemList), // must stringify
						discount: discountVal.toFixed(2),
						carrybag: carryBagTotal.toFixed(2),
						delivery: deliveryCharge.toFixed(2),
						total: finalTotalWithCarryBag.toFixed(2),
					},
				});
			}
		} catch {
			setVoucherValidationMessage('Something went wrong. Please try again.');
			setVoucherValidationPopupVisible(true);
		} finally {
			setVerificationLoading(false);
		}
	}

	// Order submission
	async function handleOrderSubmit() {
		await submitOrder();
	}

	// Payment method selection
	function selectedPaymentMethod(method) {
		const selectedType = method.payment_method;
		setPaymentMethod(selectedType);
		setPaymentSettingID(method.payment_settings_id);
		if (selectedType === 'Card') {
			setDonationPopupVisible(true);
		} else {
			setDonationAmount('');
			setDonationConfirmed(false);
		}
	}

	// Main order submission logic
	async function submitOrder() {
		setLoading(true);
		if (!storeItemList || Object.keys(storeItemList).length === 0) {
			setErrorMessage('Your cart is empty. Please add some items before placing an order.');
			setErrorPopupVisible(true);
			setLoading(false);
			return;
		}
		if (!authUser?.address1 || !authUser?.town || !authUser?.postcode) {
			setErrorMessage('Please enter your address before placing an order.');
			setErrorPopupVisible(true);
			setLoading(false);
			return;
		}
		const orderList = Object.values(storeItemList)
			.filter(({item}) => item.dish_name?.toLowerCase() !== 'carry bag')
			.map(({item, quantity}) => {
				if (!item.pizza) {
					return [{DishId: item.dish_id, quantity}];
				} else {
					const pizza = {
						...item.pizza,
						dish_name: item.dish_name,
						dish_price: parseFloat(item.dish_price).toFixed(2),
						quantity,
					};
					return [{DishId: item.dish_id, quantity, pizza}];
				}
			});

		const selectedOrderPolicy = restaurantDetails?.order_policy?.policy?.find((p) => p.policy_name === storeOrderMode);
		const orderPolicyId = selectedOrderPolicy?.policy_id || '';
		const payload = {
			user_id: authUser?.userid || '',
			order_policy_id: orderPolicyId,
			OrderList: orderList,
			post_code: authUser?.postcode || '',
			address: authUser?.address1 || '',
			city: authUser?.town || '',
			payment_option: paymentMethod === 'Card' ? 12 : 0,
			total_amount: subtotal.toFixed(2),
			grand_total: finalTotalWithCarryBag.toFixed(2),
			discount_id: storeVoucher?.id ? '' : storeSelectedDiscountId || '',
			voucher_id: storeVoucher?.id || '',
			offer_id: storeVoucher?.id ? '' : storeSelectedOfferId || '',
			pre_order_delivery_time: selectedTime,
			comments: specialNote,
			delivery_charge: deliveryCharge.toFixed(2),
			rest_id: restaurantId,
			carrierBag: carrierBagFinalPayload,
			platform: Platform.OS === 'ios' ? 1 : 2,
			...(donationNum && donationConfirmed ? {donate_amount: donationNum} : {}),
		};

		try {
			const response = await confirmOrder(payload);

			console.log('response.......', response);

			if (response.status === 'MySQL server has gone away477' && Object.keys(storeItemList).length > 0) {
				alert('Order confirmation failed. Please try again.');
			}

			if (response.status && response.status.toUpperCase() === 'SUCCESS') {
				if (selectedPaymentSettingID != 0 && paymentMethod === 'Card') {
					await paymentGatewayHandler(response);
				} else {
					paymentSuccess(response);
				}
			} else if (response.status === 'sms_sent') {
				setVerificationCodePopupVisible(true);
				setLastOrderPayload({...payload});
				setVerificationCode(response.code);
			} else if (response.status === 'Failed' && Object.keys(storeItemList).length > 0) {
				setErrorMessage('Order failed. Please try again later.');
				setErrorPopupVisible(true);
			}
		} catch (error) {
			setErrorMessage('Order confirmation failed. Please try again.');
			setErrorPopupVisible(true);
		} finally {
			setLoading(false);
		}
	}

	// Payment/redirect after order
	async function paymentGatewayHandler(response) {
		if (selectedPaymentSettingID == 12) {
			const redirectURL = response.barclay_response.Body.beginWebPaymentResponse.return.redirectURL;
			// dispatch(clearCart());
			router.push({
				pathname: '/card-payment-webview',
				params: {url: redirectURL},
			});
		} else if (selectedPaymentSettingID == 14) {
			const apiresponseData = response.barclay_response?.Body?.beginWebPaymentResponse;
			if (!apiresponseData || !apiresponseData.return) return;
			const {purchaseAmount, currencyCode} = apiresponseData.return;
			const ryftpayCreateSessionBody = {
				amount: purchaseAmount || 0,
				currency: currencyCode || 'GBP',
				customerEmail: authUser?.email || 'unknown@example.com',
				metadata: {
					orderId: response?.order_ID || 'Unknown',
					r_id: response?.request_data.rest_id || 'Unknown',
				},
				customerDetails: {
					firstName: (authUser?.first_name || '').trim(),
					lastName: authUser?.last_name || '',
				},
				returnUrl: 'https://www.chefonline.co.uk',
			};
			const ryftpayResponse = await getRyftpay(ryftpayCreateSessionBody);
			if (ryftpayResponse?.data?.status === 'PendingPayment') {
				router.push({
					pathname: '/cart/ryftpay',
					params: {
						responseData: JSON.stringify(ryftpayResponse.data, null, 2),
						configData: JSON.stringify(ryftpayResponse.config, null, 2),
						transactionId: response.transaction_id,
					},
				});
			}
		} else if (selectedPaymentSettingID == 16) {
			const apiresponseData = response.barclay_response?.Body?.beginWebPaymentResponse;
			if (!apiresponseData || !apiresponseData.return) return;
			const {totalAmount, currencyCode} = apiresponseData.return;
			const myGuavaCreateSessionBody = {
				referenceNumber: response.order_ID || 'Unknown',
				purpose: 'PURCHASE',
				totalAmount: {
					baseUnits: (totalAmount / 100).toFixed(2),
					currency: currencyCode || 'GBP',
				},
				customerEmail: authUser.email || 'unknown@example.com',
				requestor: {
					customData: {
						shared: {
							firstName: authUser.first_name.trim() || '',
							lastName: authUser.last_name.trim() || '',
							r_id: response?.request_data?.rest_id || 'Unknown',
							orderId: response?.order_ID || 'Unknown',
						},
						secret: {
							r_id: response?.request_data?.rest_id || 'Unknown',
						},
					},
				},
				payer: {
					contactEmail: authUser.email || 'unknown@example.com',
				},
				firstName: authUser.first_name.trim(),
				lastName: authUser.last_name.trim(),
				callbackUrl: `https://www.chefonline.co.uk/myguava-callback-success?orderId=${response.order_ID}&transaction_id=${response.transaction_id}`,
				redirectUrl: `http://smartrestaurantsolutions.com/mobileapi-v2/v2/barclayTrigger.php/5/${response.transaction_id}`,
			};
			const myguavapayResponse = await getmyguavapay(JSON.stringify(myGuavaCreateSessionBody, null, 2));
			if (myguavapayResponse.data?.order?.id) {
				const orderUpdate = await myguavapayPaymentUpdate(
					response.data?.transaction_id,
					myguavapayResponse.data.order.id
				);
				if (orderUpdate.data?.status) {
					// dispatch(clearCart());
					router.push({
						pathname: '/card-payment-webview',
						params: {
							url: myguavapayResponse.data.order.paymentPageUrl,
						},
					});
				} else {
					setErrorMessage('Something went wrong. Please try again later');
					setErrorPopupVisible(true);
				}
			}
		}
	}

	function paymentSuccess(response) {
		router.push({
			pathname: '/order-success',
			params: {
				orderId: response.order_ID,
				status: 1,
				message: response.msg,
				transactionId: response.transaction_id,
			},
		});
		// dispatch(clearCart());
	}

	// --- RENDER ---
	return (
		<ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
			<Text style={styles.restaurantTitle}>{restaurantName}</Text>

			{/* Cart Items */}
			<View style={styles.orderCard}>
				{itemList.map((item) => (
					<View key={item.id} style={styles.itemRow}>
						<Text style={styles.itemText}>
							{item.qty} x {item.name}
						</Text>
						<Text style={styles.itemPrice}>£{item.total.toFixed(2)}</Text>
					</View>
				))}
			</View>

			{/* Carry Bag Info */}
			{carryBagItem && (
				<View style={styles.orderCard}>
					<View style={styles.itemRow}>
						<Text style={styles.itemText}>
							{carryBagItem.quantity} x {carryBagItem.item.dish_name}
						</Text>
						<Text style={styles.itemPrice}>£{carryBagTotal.toFixed(2)}</Text>
					</View>
				</View>
			)}

			{/* Summary */}
			<View style={styles.summaryCard}>
				<View style={styles.summaryRow}>
					<Text style={styles.summaryLabel}>SUB-TOTAL</Text>
					<Text style={styles.summaryValue}>£{subtotal.toFixed(2)}</Text>
				</View>
				{(!isVoucherApplied || isStackable) && storeSelectedOfferId && (
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>OFFER</Text>
						<Text style={styles.summaryValue}>Applied</Text>
					</View>
				)}
				{discountVal > 0 && (
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>
							DISCOUNT (
							{selectedDiscount?.discount_type === 'Percentage'
								? `${parseFloat(selectedDiscount?.discount_amount || 0)}%`
								: `-£${parseFloat(selectedDiscount?.discount_amount || 0)}`}
							)
						</Text>
						<Text style={styles.summaryValue}>-£{discountVal.toFixed(2)}</Text>
					</View>
				)}
				{voucherVal > 0 && (
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>
							VOUCHER DISCOUNT (
							{storeVoucher?.is_fixed === '1'
								? `-£${parseFloat(storeVoucher?.discount_amount || 0)}`
								: `${parseFloat(storeVoucher?.discount_amount || 0)}%`}
							)
						</Text>
						<Text style={styles.summaryValue}>-£{voucherVal.toFixed(2)}</Text>
					</View>
				)}
				<View style={styles.summaryRow}>
					<Text style={styles.summaryLabel}>DELIVERY CHARGE</Text>
					<Text style={styles.summaryValue}>£{deliveryCharge.toFixed(2)}</Text>
				</View>
				{carryBagItem && (
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>
							{carryBagItem.quantity} x {carryBagItem.item.dish_name}
						</Text>
						<Text style={styles.summaryValue}>£{carryBagTotal.toFixed(2)}</Text>
					</View>
				)}
				{donationNum > 0 && donationConfirmed && (
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>DONATION</Text>
						<Text style={styles.summaryValue}>£{donationNum}</Text>
					</View>
				)}
				{/* <View style={styles.summaryRow}>
					<Text style={styles.summaryLabel}>
						TOTAL ({carryBagItem ? 'Include Carrier Bag' : 'Exclude Carrier Bag'})
					</Text>
					<Text style={styles.summaryValue}>£{finalTotal.toFixed(2)}</Text>
				</View> */}

				<View style={styles.summaryRow}>
					<Text style={styles.summaryLabel}>FINAL TOTAL</Text>
					<Text style={styles.summaryValue}>£{finalTotalWithCarryBag.toFixed(2)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={styles.summaryLabel}>ORDER TYPE</Text>
					<Text style={styles.summaryValue}>{storeOrderMode}</Text>
				</View>
			</View>

			{/* Notes & Voucher */}
			<View style={styles.noteCard}>
				<View style={styles.noteRow}>
					<TouchableOpacity onPress={() => setNotePopupVisible(true)} style={styles.noteButton}>
						<Text style={styles.noteText}>ADD SPECIAL NOTE</Text>
					</TouchableOpacity>
					{isVoucherApplied ? (
						<TouchableOpacity onPress={() => setRemoveVoucherConfirmVisible(true)} style={styles.noteButton}>
							<Text style={styles.noteText}>REMOVE VOUCHER</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity onPress={() => setVoucherPopupVisible(true)} style={styles.noteButton}>
							<Text style={styles.noteText}>ADD VOUCHER CODE</Text>
						</TouchableOpacity>
					)}
				</View>
				<TouchableOpacity style={styles.timeButton} onPress={() => setTimeSheetVisible(true)}>
					<Text style={styles.timeText}>YOUR SELECTED TIME: {selectedTime}</Text>
				</TouchableOpacity>
			</View>

			{/* Payment */}
			<View style={styles.paymentCard}>
				<Text style={styles.sectionTitle}>SELECT PAYMENT OPTION</Text>
				<View style={styles.paymentRow}>
					{availablePaymentMethods.map((method, index) => (
						<TouchableOpacity
							key={index}
							style={[styles.paymentBtn, paymentMethod === method.payment_method && styles.selectedBtn]}
							onPress={() => selectedPaymentMethod(method)}
						>
							<Ionicons
								name={method.payment_method === 'Card' ? 'card-outline' : 'cash-outline'}
								size={20}
								color={paymentMethod === method.payment_method ? '#fff' : '#333'}
							/>
							<Text style={[styles.paymentText, paymentMethod === method.payment_method && styles.paymentTextSelected]}>
								{method.payment_method}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			<TouchableOpacity
				style={[styles.confirmBtn, loading && {opacity: 0.6}]}
				onPress={handleOrderSubmit}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text style={styles.confirmText}>CONFIRM ORDER</Text>
				)}
			</TouchableOpacity>

			{/* Popups */}
			<CustomPopUp
				visible={notePopupVisible}
				title="Add Special Note"
				showCancel
				onCancel={() => setNotePopupVisible(false)}
				onConfirm={() => {
					dispatch(setSpecialNote(specialNote));
					setNotePopupVisible(false);
				}}
			>
				<TextInput
					style={styles.popupInput}
					value={specialNote}
					onChangeText={setSpecialNoteText}
					placeholder="Write your note here..."
					multiline
					textAlignVertical="top"
					placeholderTextColor={Colors.placeholder}
				/>
			</CustomPopUp>

			<CustomPopUp
				visible={voucherPopupVisible}
				title="Add Voucher Code"
				showCancel
				onCancel={() => setVoucherPopupVisible(false)}
				onConfirm={() => handleVoucherCodeSubmit(voucherCode)}
				disableConfirm={!voucherCode?.trim()}
			>
				<TextInput
					style={styles.popupInputSingleLine}
					value={voucherCode}
					onChangeText={setVoucherCodeText}
					placeholder="Enter your voucher code"
					placeholderTextColor={Colors.placeholder}
					autoCapitalize="characters"
				/>
			</CustomPopUp>

			<CustomPopUp
				visible={voucherValidationPopupVisible}
				title="Voucher Status"
				message={voucherValidationMessage}
				onConfirm={() => setVoucherValidationPopupVisible(false)}
				showCancel={false}
			/>

			{/* Error Messages */}
			<CustomPopUp
				visible={errorPopupVisible}
				message={errorMessage}
				onConfirm={() => {
					setErrorPopupVisible(false);
					router.replace('/(tabs)/search');
				}}
			/>

			<CustomPopUp
				visible={removeVoucherConfirmVisible}
				title="Remove Voucher?"
				message="Are you sure you want to remove the applied voucher?"
				showCancel
				onCancel={() => setRemoveVoucherConfirmVisible(false)}
				onConfirm={() => {
					dispatch(setVoucher(null));
					setRemoveVoucherConfirmVisible(false);
					if (storeSelectedDiscountId) dispatch(setSelectedRestaurantDiscountId(storeSelectedDiscountId));
					if (storeSelectedOfferId) dispatch(setSelectedRestaurantOfferId(storeSelectedOfferId));
				}}
			/>

			{authUser?.email === 'test.engineer1@gmail.com' && (
				<CustomPopUp
					visible={verificationCodePopupVisible}
					title="Enter Verification Code"
					showCancel
					onCancel={() => setVerificationCodePopupVisible(false)}
					onConfirm={handleVerificationSubmit}
					confirmLoading={verificationLoading}
					disableConfirm={verificationLoading}
				>
					<TextInput
						style={styles.popupInputSingleLine}
						placeholder="Enter 4-digit code"
						keyboardType="numeric"
						value={verificationCode}
						onChangeText={setVerificationCode}
						maxLength={6}
						placeholderTextColor={Colors.placeholder}
					/>
				</CustomPopUp>
			)}

			<CustomPopUp
				visible={donationPopupVisible}
				title="ChefOnline Foundation"
				message="Would you like to donate for ChefOnline Foundation?"
				showCancel
				onCancel={() => {
					setDonationAmount('');
					setDonationConfirmed(false);
					setDonationPopupVisible(false);
				}}
				onConfirm={() => {
					setDonationConfirmed(true);
					setDonationPopupVisible(false);
				}}
			>
				<View style={{marginBottom: 12}}>
					<Text style={{marginBottom: 8, fontSize: 14}}>Select donation amount:</Text>
					<View style={{borderWidth: 1, borderColor: Colors.border, borderRadius: 6}}>
						<Picker
							selectedValue={donationAmount}
							onValueChange={setDonationAmount}
							itemStyle={{color: '#333'}}
							style={{color: '#333'}}
						>
							<Picker.Item label="Select" value="Select" />
							<Picker.Item label="£1" value="1" />
							<Picker.Item label="£2" value="2" />
							<Picker.Item label="£5" value="5" />
							<Picker.Item label="£10" value="10" />
						</Picker>
					</View>
				</View>
			</CustomPopUp>

			{/* Time Slot Bottom Sheet */}
			<Modal
				visible={timeSheetVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setTimeSheetVisible(false)}
			>
				<View style={styles.bottomSheetBackdrop}>
					<View style={styles.bottomSheetContainer}>
						<Text style={styles.sheetTitle}>Select Time</Text>
						<ScrollView>
							{availableTimeSlots.map((slot, index) => (
								<TouchableOpacity
									key={index}
									style={styles.timeSlotItem}
									onPress={() => {
										setSelectedTime(slot);
										setTimeSheetVisible(false);
									}}
								>
									<Text style={styles.timeSlotText}>{slot}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {paddingBottom: 40},
	container: {flex: 1, backgroundColor: Colors.background, padding: 16},
	restaurantTitle: {
		textAlign: 'center',
		fontSize: 18,
		fontWeight: 'bold',
		marginVertical: 16,
		color: Colors.text,
		textTransform: 'uppercase',
	},
	orderCard: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
	},
	itemRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6},
	itemText: {color: Colors.text, fontSize: 14},
	itemPrice: {fontWeight: '600', color: Colors.text},
	summaryCard: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
	},
	summaryRow: {flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2},
	summaryLabel: {fontSize: 14, color: Colors.text},
	summaryValue: {fontWeight: 'bold', color: Colors.text},
	noteCard: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
	},
	noteRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 12,
		gap: 5,
	},
	noteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		borderRadius: 6,
		backgroundColor: '#e6e6e6',
	},
	noteText: {color: Colors.primary, fontWeight: '500'},
	timeButton: {
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 6,
		backgroundColor: '#e6e6e6',
		marginBottom: 10,
	},
	timeText: {color: Colors.primary, fontWeight: '500'},
	paymentCard: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 12,
		marginBottom: 10,
	},
	sectionTitle: {
		textAlign: 'center',
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 10,
	},
	paymentRow: {flexDirection: 'row', justifyContent: 'space-around'},
	paymentBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 6,
		backgroundColor: '#e6e6e6',
	},
	selectedBtn: {backgroundColor: Colors.primary},
	paymentText: {marginLeft: 8, color: '#333', fontWeight: '500'},
	paymentTextSelected: {color: '#fff'},
	confirmBtn: {
		backgroundColor: Colors.primary,
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	popupInput: {
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
		backgroundColor: Colors.white,
		minHeight: 100,
		textAlignVertical: 'top',
		marginBottom: 12,
	},
	popupInputSingleLine: {
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
		backgroundColor: Colors.white,
		marginBottom: 12,
		color: Colors.text,
	},
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
