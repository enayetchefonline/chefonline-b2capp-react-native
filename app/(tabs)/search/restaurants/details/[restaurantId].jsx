import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { getPaymentMethodOption, individualRestaurantsApi } from '../../../../../lib/api';
import { getCurrentApiDateTimeObj, getRestaurantScheduleStatus } from '../../../../../lib/utils/restaurantSchedule';
import {
	addItemToCart,
	setDiscount,
	setOffer,
	setOrderPolicy,
	setRestaurantId,
	setRestaurantName,
	updateItemQuantity,
} from './../../../../../store/slices/cartSlice';
import { setRestaurantDetail, setRestaurantPaymentOptions } from './../../../../../store/slices/restaurantDetailSlice';

import ScrollableTabString from 'react-native-scrollable-tabstring';

// --- COLOR CONSTANTS ---
const COLORS = {
	background: '#F5F5F5',
	text: '#333333',
	border: '#E0E0E0',
	white: '#FFFFFF',
	primary: '#EC1839',
	secondary: '#333333',
	secondaryText: '#888888',
	cardShadow: '#000000',
	divider: '#f0f0f0',
	gray: '#666666',
	lightGray: '#e0e0e0',
	lightestGray: '#f0f0f0',
	modalBg: 'rgba(0, 0, 0, 0.5)',
};

export default function RestaurantDetailScreen() {
	const router = useRouter();
	const { restaurantId } = useLocalSearchParams();
	const dispatch = useDispatch();

	const [restaurantDetails, setRestaurantDetails] = useState(null);
	const [tabIndex, setTabIndex] = useState(0);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState(null);
	const [selectedOptionParentName, setSelectedOptionParentName] = useState('');
	const [restaurantScheduleStatus, setRestaurantScheduleStatus] = useState('');
	const [loading, setLoading] = useState(true);

	const cartItems = useSelector((state) => state.cart.items);
	const storeOrderType = useSelector((state) => state.cart.orderType);

	

	// console.log("restaurantDetails:", JSON.stringify(restaurantDetails?.accept_reservation));
	// console.log("restaurantScheduleStatus:", restaurantScheduleStatus);
	// const isResturantClosed = restaurantScheduleStatus === 'CLOSED';

	// Fetch payment options and restaurant details
	useEffect(() => {
		if (!restaurantId) return;
		dispatch(setRestaurantId(restaurantId));
		(async () => {
			try {
				const response = await getPaymentMethodOption(restaurantId);
				dispatch(setRestaurantPaymentOptions(response.payment_methods));
			} catch (error) {
				console.error('Error fetching payment options:', error);
			}
		})();
	}, [restaurantId, dispatch]);

	useEffect(() => {
		if (!restaurantId) return;
		const fetchData = async () => {
			try {
				const response = await individualRestaurantsApi(restaurantId);
				// console.log("individualRestaurantsApi response:", JSON.stringify(response));
				const restaurant = response.app?.[0];
				setRestaurantDetails(restaurant);
				dispatch(setRestaurantDetail(restaurant));
				setLoading(false);

				dispatch(setDiscount(restaurant?.discount ?? {}));
				dispatch(setOffer(restaurant?.offer ?? {}));
				dispatch(setOrderPolicy(restaurant?.order_policy ?? {}));
				dispatch(setRestaurantName(restaurant?.restaurant_name ?? ''));

				const scheduleList = restaurant?.restuarent_schedule?.schedule ?? [];
				const currentApiDateTimeObj = getCurrentApiDateTimeObj();
				const status = getRestaurantScheduleStatus(scheduleList, currentApiDateTimeObj);
				setRestaurantScheduleStatus(status);
			} catch (error) {
				console.error('Error fetching restaurant:', error);
				setLoading(false);
			}
		};
		fetchData();
	}, [restaurantId, dispatch]);

	// --- Helper Functions ---
	const addToCart = (item) => {
		dispatch(addItemToCart(item));
	};

	const updateQuantity = (itemId, newQuantity) => {
		dispatch(updateItemQuantity({ itemId, quantity: newQuantity }));
	};

	const isItemInCart = (itemId) => cartItems.hasOwnProperty(itemId);
	const getItemQuantity = (itemId) => cartItems[itemId]?.quantity || 0;

	const getParentDishName = useCallback(
		(parentId) => {
			for (const cuisine of restaurantDetails?.cuisine || []) {
				for (const category of cuisine?.category || []) {
					for (const dish of category?.dish || []) {
						if (dish.dish_id === parentId) {
							return dish.dish_name;
						}
					}
				}
			}
			return '';
		},
		[restaurantDetails]
	);

	const calculateTotal = () =>
		Object.values(cartItems)
			.reduce((total, { item, quantity }) => total + parseFloat(item.dish_price) * quantity, 0)
			.toFixed(2);

	// --- Menu Data Preparation ---
	const categories =
		restaurantDetails?.cuisine?.flatMap((cuisine) => cuisine.category?.map((cat) => cat.category_name)) || [];

	const tabCategories = categories.map((cat) => ({ label: cat }));

	const tabDataSections = categories.map((cat) => {
		const matchedDishes =
			restaurantDetails?.cuisine
				?.flatMap((cuisine) => cuisine.category?.filter((catObj) => catObj.category_name === cat))
				?.flatMap((catObj) => catObj?.dish || []) || [];
		return {
			category: cat,
			dishes: matchedDishes,
		};
	});

	const handleGoToCart = () => {

		if (storeOrderType === 'reservation' && restaurantScheduleStatus === 'CLOSED') {
			alert("Sorry we are closed today");
			return;
		} else if (storeOrderType === 'takeaway' && restaurantScheduleStatus === 'CLOSED') {
			alert("Sorry we are closed today");
			return;
		} else {
			// Proceed to cart
			router.push('/cart');
		}
		
		
		
	}

	// --- UI Render Functions ---
	const renderHeader = () => (
		<View style={styles.header}>
			<View style={styles.headerTop}>
				<Text style={styles.restaurantName}>{restaurantDetails?.restaurant_name || 'Restaurant Name'}</Text>
				<View style={styles.discountContainer}>
					{restaurantDetails?.discount?.status === 1 && restaurantDetails?.discount?.off?.length > 0 && (
						<>
							<Text style={styles.discountTextWithBg}>
								{restaurantDetails?.discount?.off?.[0]?.discount_amount}% Discount
							</Text>
							<Text style={styles.discountText}>Min: £{restaurantDetails?.discount?.off?.[0]?.eligible_amount}</Text>
						</>
					)}
				</View>
			</View>
			<View style={styles.preparationTimeContainer}>
				{restaurantScheduleStatus === 'OPEN' ? (
					<>
						<View style={styles.row}>
							<Ionicons name="bag-check" size={14} color={COLORS.primary} style={styles.iconSmall} />
							<Text style={styles.preparationTime}>
								{(() => {
									const time = restaurantDetails?.order_policy?.policy?.find((p) => p.policy_name === 'Collection')
										?.policy_time;
									return time ? `${time} min` : 'Collection not available';
								})()}
							</Text>
						</View>
						<View style={styles.row}>
							<Ionicons name="bicycle-sharp" size={14} color={COLORS.primary} style={styles.iconSmall} />
							<Text style={styles.preparationTime}>
								{(() => {
									const time = restaurantDetails?.order_policy?.policy?.find((p) => p.policy_name === 'Delivery')
										?.policy_time;
									return time ? `${time} min` : 'Delivery not available';
								})()}
							</Text>
						</View>
					</>
				) : (
					restaurantScheduleStatus === 'PRE-ORDER' && (
						<View style={styles.row}>
							<Ionicons name="bag-check" size={14} color={COLORS.primary} style={styles.iconSmall} />
							<Text style={styles.preparationTime}>{restaurantScheduleStatus}</Text>
						</View>
					)
				)}
			</View>
			{(() => {
				const delivery = restaurantDetails?.order_policy?.policy?.find((p) => p.policy_name === 'Delivery');
				return delivery?.min_order ? (
					<Text style={styles.minDelivery}>Minimum Delivery: £{delivery.min_order}</Text>
				) : null;
			})()}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.viewMenuScrollContainer}
			>
				<TouchableOpacity
					style={styles.viewMenuButton}
					onPress={() => router.push(`/search/restaurants/review/${restaurantId}`)}
				>
					<Text style={styles.viewMenuText}>Review</Text>
				</TouchableOpacity>
				<View style={styles.line} />
				<TouchableOpacity
					style={styles.viewMenuButton}
					onPress={() => router.push(`/search/restaurants/info/${restaurantId}`)}
				>
					<Text style={styles.viewMenuText}>Info</Text>
				</TouchableOpacity>
				<View style={styles.line} />
				{
					restaurantDetails?.accept_reservation === "1" && (
						<>
						<TouchableOpacity
							style={styles.viewMenuButton}
							onPress={() => router.push(`/search/restaurants/reservation/${restaurantId}`)}
						>
							<Text style={styles.viewMenuText}>Reservation</Text>
						</TouchableOpacity>
						<View style={styles.line} />
						</>
						
					)
				}
				
				<TouchableOpacity
					style={styles.viewMenuButton}
					onPress={() => router.push(`/search/restaurants/offer/${restaurantId}`)}
				>
					<Text style={styles.viewMenuText}>Offer</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);

	const renderMenuItem = (item, categoryName) => (
		<View style={styles.menuItem} key={`${categoryName}-${item.dish_id}`}>
			<View style={styles.menuItemTextContainer}>
				<Text style={styles.menuItemName}>{item.dish_name}</Text>
				<Text style={styles.menuItemDescription}>{item.dish_description}</Text>
				{!!item.dish_allergens?.length && (
					<Text style={styles.menuItemAllergens}>
						Allergens:{' '}
						{item.dish_allergens
							.map((id) => {
								const allergenMap = {
									1: 'Fish',
									2: 'Peanuts',
									3: 'Nut',
									4: 'Egg',
									5: 'Milk',
									6: 'Mustard',
									7: 'Soya',
									8: 'Crustaceans',
									9: 'Sesame Seeds',
									10: 'Cereals glut',
								};
								return allergenMap[id] || '';
							})
							.filter(Boolean)
							.join(', ')}
					</Text>
				)}
			</View>
			<View style={styles.menuItemPriceContainer}>
				<Text style={styles.menuItemPrice}>£{item.dish_price}</Text>
			</View>
			<View style={styles.itemActions}>
				{item.option?.length > 0 ? (
					<TouchableOpacity
						style={styles.subItemButton}
						onPress={() => {
							setSelectedOptions(item.option);
							setSelectedOptionParentName(item.dish_name);
							setModalVisible(true);
						}}
					>
						<Text style={styles.subItemButtonText}>Options</Text>
					</TouchableOpacity>
				) : isItemInCart(item.dish_id) ? (
					<>
						<TouchableOpacity
							style={styles.qtyBtn}
							onPress={() => updateQuantity(item.dish_id, getItemQuantity(item.dish_id) - 1)}
						>
							<Ionicons name="remove-outline" size={16} color={COLORS.primary} />
						</TouchableOpacity>
						<Text style={styles.qtyText}>{getItemQuantity(item.dish_id)}</Text>
						<TouchableOpacity
							style={styles.qtyBtn}
							onPress={() => updateQuantity(item.dish_id, getItemQuantity(item.dish_id) + 1)}
						>
							<Ionicons name="add-outline" size={16} color={COLORS.primary} />
						</TouchableOpacity>
					</>
				) : (
					<TouchableOpacity style={styles.subItemButton} onPress={() => addToCart(item)}>
						<Text style={styles.subItemButtonText}>Add</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);

	// Footer render (pass meetsAnyPolicy as an argument)
	const renderFooter = () => (
		<View style={styles.footer}>
			<View>
				<Text style={styles.totalText}>TOTAL: £{calculateTotal()}</Text>
				<Text style={styles.itemCountText}>
					{Object.keys(cartItems).length} {Object.keys(cartItems).length === 1 ? 'item' : 'items'}
				</Text>
			</View>
			<TouchableOpacity
				style={styles.proceedTouchable}
				onPress={handleGoToCart}
				disabled={Object.keys(cartItems).length === 0}
			>
				<Text style={styles.proceedText}>Go to Cart</Text>
			</TouchableOpacity>
		</View>
	);
	const renderOptionsModal = () => (
		<Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>{selectedOptionParentName}</Text>
						<Text style={styles.modalTotalText}>TOTAL: £{calculateTotal()}</Text>
					</View>
					<ScrollView>
						{selectedOptions?.map((option) => (
							<View style={styles.menuItem} key={option.self_id}>
								<View style={styles.menuItemTextContainer}>
									<Text style={styles.menuItemName}>{option.option_name}</Text>
									<Text style={styles.menuItemDescription}>
										{option.option_description === 'N/A' ? '' : option.option_description}
									</Text>
								</View>
								<View style={styles.menuItemPriceContainer}>
									<Text style={styles.menuItemPrice}>£{option.option_price}</Text>
								</View>
								<View style={styles.itemActions}>
									{isItemInCart(option.self_id) ? (
										<>
											<TouchableOpacity
												style={styles.qtyBtn}
												onPress={() => updateQuantity(option.self_id, getItemQuantity(option.self_id) - 1)}
											>
												<Ionicons name="remove-outline" size={16} color={COLORS.primary} />
											</TouchableOpacity>
											<Text style={styles.qtyText}>{getItemQuantity(option.self_id)}</Text>
											<TouchableOpacity
												style={styles.qtyBtn}
												onPress={() => updateQuantity(option.self_id, getItemQuantity(option.self_id) + 1)}
											>
												<Ionicons name="add-outline" size={16} color={COLORS.primary} />
											</TouchableOpacity>
										</>
									) : (
										<TouchableOpacity
											style={styles.subItemButton}
											onPress={() =>
												addToCart({
													...option,
													dish_id: option.self_id,
													dish_price: option.option_price,
													dish_name: `${getParentDishName(option.parent_dish_id).replace(/:$/, '')}: ${option.option_name
														}`,
													dish_description: option.option_description,
												})
											}
										>
											<Text style={styles.subItemButtonText}>Add</Text>
										</TouchableOpacity>
									)}
								</View>
							</View>
						))}
					</ScrollView>
					<TouchableOpacity style={styles.closeModal} onPress={() => setModalVisible(false)}>
						<Text style={styles.closeText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);

	// --- Main Render ---
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.loadingText}>Loading restaurant...</Text>
				<ActivityIndicator size="large" color={COLORS.primary} />
			</View>
		);
	}

	const policies = restaurantDetails?.order_policy?.policy || [];
	const totalAmount = parseFloat(calculateTotal());
	const meetsAnyPolicy = policies.some((p) => {
		const min = parseFloat(p.min_order ?? 0);
		return totalAmount >= min;
	});

	return (
		<View style={styles.container}>
			{renderHeader()}

			<View style={styles.menuContainer}>
				<ScrollableTabString
					dataTabs={tabCategories}
					dataSections={tabDataSections}
					onPressTab={setTabIndex}
					renderTabName={(item) => <Text style={styles.menuCategoryText}>{item.label}</Text>}
					renderSection={(section) => (
						<View key={section.category} style={styles.menuSectionWrapper}>
							<Text style={styles.menuSectionTitle}>{section.category}</Text>
							{section.dishes.length > 0 ? (
								section.dishes.map((item) => renderMenuItem(item, section.category))
							) : (
								<Text style={styles.noItemsText}>No items in this category</Text>
							)}
						</View>
					)}
					selectedTabStyle={styles.menuCategoryTextActive}
					unselectedTabStyle={styles.menuCategoryText}
					initialTab={tabIndex}
				/>
			</View>

			{Object.keys(cartItems).length > 0 && <View>{renderFooter(meetsAnyPolicy)}</View>}
			{renderOptionsModal()}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
		padding: 15,
		gap: 10,
	},
	header: {
		backgroundColor: COLORS.white,
		borderRadius: 8,
		padding: 16,
		shadowColor: COLORS.cardShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	headerTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 5,
	},
	restaurantName: {
		fontSize: 24,
		fontWeight: 'bold',
		flex: 1,
		color: COLORS.text,
	},
	discountContainer: {
		alignItems: 'flex-end',
	},
	discountTextWithBg: {
		fontSize: 12,
		color: COLORS.white,
		backgroundColor: COLORS.primary,
		padding: 5,
		borderRadius: 5,
	},
	discountText: {
		fontSize: 13,
		fontWeight: 'bold',
		color: COLORS.text,
	},
	minDelivery: {
		fontSize: 14,
		color: COLORS.gray,
	},
	viewMenuScrollContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 5,
		gap: 5,
		justifyContent: 'center',
		width: '100%',
		marginTop: 10,
	},
	viewMenuButton: {
		paddingHorizontal: 0,
	},
	viewMenuText: {
		color: COLORS.primary,
		fontWeight: '600',
		fontSize: 14,
		textTransform: 'uppercase',
	},
	line: {
		width: 1,
		height: '60%',
		backgroundColor: COLORS.primary,
		marginHorizontal: 5,
	},
	preparationTimeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 15,
		marginBottom: 5,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	iconSmall: {
		marginRight: 5,
	},
	preparationTime: {
		fontSize: 14,
		color: COLORS.gray,
	},
	menuContainer: {
		flex: 1,
		backgroundColor: COLORS.white,
		gap: 15,
		borderRadius: 8,
		shadowColor: COLORS.cardShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
		overflow: 'hidden',
	},
	menuCategoryText: {
		fontSize: 14,
		color: COLORS.text,
		paddingHorizontal: 10,
		paddingVertical: 15,
	},
	menuCategoryTextActive: {
		fontSize: 14,
		color: COLORS.primary,
		fontWeight: 'bold',
		paddingHorizontal: 10,
		paddingVertical: 15,
	},
	menuSectionWrapper: {
		backgroundColor: COLORS.white,
		shadowColor: COLORS.cardShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	menuSectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: COLORS.text,
		backgroundColor: COLORS.lightestGray,
		paddingHorizontal: 10,
	},
	menuItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: COLORS.divider,
		gap: 10,
	},
	menuItemTextContainer: {
		flex: 2,
	},
	menuItemName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 5,
		color: COLORS.text,
	},
	menuItemDescription: {
		fontSize: 14,
		color: COLORS.gray,
		marginBottom: 5,
	},
	menuItemAllergens: {
		fontSize: 12,
		color: COLORS.secondaryText,
		fontStyle: 'italic',
	},
	menuItemPriceContainer: {
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	menuItemPrice: {
		fontSize: 16,
		fontWeight: 'bold',
		color: COLORS.text,
	},
	itemActions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 10,
	},
	subItemButton: {
		backgroundColor: COLORS.white,
		borderWidth: 1,
		borderColor: COLORS.primary,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 5,
	},
	subItemButtonText: {
		color: COLORS.primary,
		fontSize: 12,
		textTransform: 'uppercase',
	},
	qtyBtn: {
		backgroundColor: COLORS.lightestGray,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 5,
	},
	qtyText: {
		fontSize: 16,
		fontWeight: 'bold',
		minWidth: 20,
		textAlign: 'center',
		color: COLORS.text,
	},
	noItemsText: {
		textAlign: 'center',
		color: COLORS.gray,
		marginVertical: 20,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: COLORS.primary,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	totalText: {
		color: COLORS.white,
		fontSize: 12,
		lineHeight: 18,
	},
	itemCountText: {
		color: COLORS.white,
		fontSize: 10,
		lineHeight: 14,
	},
	proceedTouchable: {
		backgroundColor: '#A70000',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 4,
	},
	proceedText: {
		color: COLORS.white,
		fontSize: 14,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: COLORS.modalBg,
	},
	modalContent: {
		width: '90%',
		maxHeight: '80%',
		padding: 20,
		backgroundColor: COLORS.white,
		borderRadius: 10,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		color: COLORS.text,
	},
	modalTotalText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: COLORS.primary,
	},
	closeModal: {
		marginTop: 20,
		alignItems: 'center',
		paddingVertical: 10,
		backgroundColor: COLORS.primary,
		borderRadius: 5,
	},
	closeText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: COLORS.background,
	},
	loadingText: {
		fontSize: 16,
		color: COLORS.text,
		marginBottom: 10,
	},
	stickyFooter: {
		position: 'absolute',
		bottom: 15,
		left: 15,
		right: 15,
	},
});

// app/(tabs)/search/restaurants/details/[restaurantId].jsx
