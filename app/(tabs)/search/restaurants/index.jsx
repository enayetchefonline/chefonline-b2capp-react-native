import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';

import { ActivityIndicator } from 'react-native-paper';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import { searchRestaurantsApi } from '../../../../lib/api';
import { getCurrentApiDateTimeObj, getRestaurantScheduleStatus } from '../../../../lib/utils/restaurantSchedule';
import { clearCart } from '../../../../store/slices/cartSlice';
import { clearRestaurantDetail } from '../../../../store/slices/restaurantDetailSlice';
import { setRestaurantList } from '../../../../store/slices/restaurantListSlice';

const COLORS = {
	background: '#F9FAFB',
	text: '#22223B',
	border: '#E9ECEF',
	white: '#FFFFFF',
	primary: '#EC1839',
	secondaryText: '#6C757D',
	cardShadow: 'rgba(44,44,44,0.08)',
	imageBg: '#F3F5F7',
	divider: '#F1F3F5',
	accent: '#FFD700',
	discountBg: '#FFF1F3',
	discountText: '#EC1839',
	badge: '#FFE7E7',
};

export default function RestaurantListScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const storeRestaurantList = useSelector((state) => state.restaurantList.restaurantList);
	const cart = useSelector((state) => state.cart);

	const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);
	const [hasUserScrolled, setHasUserScrolled] = useState(false);
	// const [onEndReachedCalledDuringMomentum, setOnEndReachedCalledDuringMomentum] = useState(false);


	const searchText = useSelector((state) => state.cart.searchText);
	const selectedCuisine = useSelector((state) => state.cart.selectedCuisine);
	const selectedDeliveryType = useSelector((state) => state.cart.orderType);

	const [pageNo, setPageNo] = useState(2);
	const [isFetching, setIsFetching] = useState(false);
	const [hasMoreData, setHasMoreData] = useState(true);

	const [showCartPopup, setShowCartPopup] = useState(false);
	const [showRedStickerPopup, setShowRedStickerPopup] = useState(false);
	const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
	const [showClosedPopup, setShowClosedPopup] = useState(false);

	// const storeOrderType = useSelector((state) => state.cart.orderType);

	console.log("storeRestaurantList.........", storeRestaurantList.map((rest) => rest?.rest_id))

	// useEffect(() => {
	// 	setPageNo(2); // Reset to page 2 only, keep store list intact
	// 	setHasMoreData(true);
	// }, [searchText, selectedCuisine, selectedDeliveryType]);

	// const resetAndFetch = () => {
	// 	setPageNo(2);
	// 	setHasMoreData(true);
	// 	dispatch(setRestaurantList([]));
	// 	fetchSearchRestaurant(1);
	// };

	const fetchSearchRestaurant = async (page) => {
		if (!hasMoreData || isFetching) return;

		setIsFetching(true);

		const data = {
			searchText,
			cuisineType: selectedCuisine || 'all',
			orderType: selectedDeliveryType || 'takeaway',  // fallback safe
			pageNo: page,
		};

		try {
			const response = await searchRestaurantsApi(data);
			const result = response?.app;

			if (Array.isArray(result) && result[0]?.status === 'Failed') {
				setHasMoreData(false);
			} else if (Array.isArray(result)) {
				if (page === 1) {
					// 🔹 just in case you ever call page 1 from here
					dispatch(setRestaurantList(result));
				} else {
					// 🔹 append page 2, 3, ...
					dispatch(setRestaurantList([...storeRestaurantList, ...result]));
				}
				setPageNo(page + 1);
			} else {
				setHasMoreData(false);
			}
		} catch (error) {
			console.error('Error fetching restaurants:', error);
			setHasMoreData(false);
		} finally {
			setIsFetching(false);
		}
	};


	// const fetchSearchRestaurant = async (page) => {
	// 	if (!hasMoreData || isFetching) return;

	// 	setIsFetching(true);
	// 	const data = {
	// 		searchText,
	// 		cuisineType: selectedCuisine || 'all',
	// 		orderType: selectedDeliveryType || 'Delivery',
	// 		pageNo: page,
	// 	};

	// 	try {
	// 		// console.log("dsadasjdksakdjksajkdsajkdjskj..............2")
	// 		const response = await searchRestaurantsApi(data);
	// 		const result = response?.app;
	// 		// console.log("searchRestaurantsApi", JSON.stringify(result))
	// 		const restId = result.map((rest) => rest?.rest_id);


	// 		// console.log("restaurant search.........", JSON.stringify(result))
	// 		// console.log("restId.........", restId)

	// 		if (Array.isArray(result) && result[0]?.status === 'Failed') {
	// 			setHasMoreData(false);
	// 		} else if (Array.isArray(result)) {
	// 			if (page === 1) {
	// 				dispatch(setRestaurantList(result));
	// 			} else {
	// 				dispatch(setRestaurantList([...storeRestaurantList, ...result]));
	// 			}
	// 			setPageNo(page + 1);
	// 		} else {
	// 			setHasMoreData(false);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching restaurants:', error);
	// 		setHasMoreData(false);
	// 	} finally {
	// 		setIsFetching(false);
	// 	}
	// };

	const handleRestaurantPress = (restaurantId) => {
		const restaurant = storeRestaurantList.find((r) => r.rest_id === restaurantId);
		if (!restaurant) return;

		if (restaurant?.red_sticker === 1) {
			setShowRedStickerPopup(true);
			return;
		}

		const scheduleList = restaurant?.restuarent_schedule?.schedule || [];
		console.log("rest schedulelist", JSON.stringify(scheduleList))
		const status = getRestaurantScheduleStatus(scheduleList, getCurrentApiDateTimeObj());
		// if (status === 'CLOSED' && storeOrderType !== 'reservation') {
		// 	setShowClosedPopup(true);
		// 	return;
		// }

		if (Object.keys(cart.items).length > 0 && cart.restaurantId && cart.restaurantId !== restaurantId) {
			setSelectedRestaurantId(restaurantId);
			setShowCartPopup(true);
		} else {
			router.push(`/search/restaurants/details/${restaurantId}`);
		}
	};

	const handleConfirmChangeRestaurant = () => {
		dispatch(clearCart());
		dispatch(clearRestaurantDetail());
		setShowCartPopup(false);
		if (selectedRestaurantId) {
			router.push(`/search/restaurants/details/${selectedRestaurantId}`);
			setSelectedRestaurantId(null);
		}
	};

	const renderItem = ({ item }) => {
		const deliveryMinOrder =
			item?.order_policy?.policy?.find((policy) => policy?.policy_name === 'Delivery')?.min_order ?? null;
		const collectionTimes =
			item?.order_policy?.policy
				?.filter((policy) => policy?.policy_name === 'Collection')
				?.map((p) => `${p.policy_time} mins`)
				?.join(', ') ?? '';
		const deliveryTimes =
			item?.order_policy?.policy
				?.filter((policy) => policy?.policy_name === 'Delivery')
				?.map((p) => `${p.policy_time} mins`)
				?.join(', ') ?? '';
		const isDiscount = item?.discount?.status === 1 && item?.discount?.off?.length > 0;
		const isOffer = item?.offer?.status === 1;

		// console.log("isOffer", JSON.stringify(item))

		return (
			<TouchableOpacity
				style={styles.restaurantItem}
				onPress={() => handleRestaurantPress(item.rest_id)}
				activeOpacity={0.9}
			>
				<View style={styles.cardContainer}>
					<View style={styles.restaurantImageContainer}>
						<Image source={{ uri: item.logo }} style={styles.restaurantImage} />
						{isOffer && (
							<View style={styles.discountBadge}>
								<Ionicons name="pricetag" size={13} color={COLORS.discountText} />
								<Text style={styles.discountBadgeText}>Offer</Text>
							</View>
						)}
					</View>
					<View style={styles.detailsContainer}>
						<Text style={styles.restaurantName} numberOfLines={1}>
							{item.restaurant_name}
						</Text>
						<Text style={styles.cuisine} numberOfLines={1}>
							{item.available_cuisine?.cuisine?.length
								? item.available_cuisine.cuisine
									.map((c) => c.name?.charAt(0).toUpperCase() + c.name?.slice(1).toLowerCase())
									.join(', ')
								: 'Cuisine not available'}
						</Text>
						<Text style={styles.cuisine}>{item.postcode}</Text>
						{item.rating?.rating_count > 0 && (
							<View style={styles.row}>
								<Ionicons name="star" size={16} color={COLORS.primary} />
								<Text style={styles.ratingBold}>{item.rating?.avg_rating ?? 0}</Text>
								<Text style={styles.ratingCount}>({item.rating?.rating_count} reviews)</Text>
							</View>
						)}
						{deliveryMinOrder && (
							<Text style={styles.minDelivery}>
								Min Delivery: <Text style={{ fontWeight: 'bold' }}>£{deliveryMinOrder}</Text>
							</Text>
						)}
					</View>
					{isDiscount && (
						<View style={styles.discountContainer}>
							<Text style={styles.discountText}>{item.discount.off[0].discount_amount}% OFF</Text>
							<Text style={styles.discountEligibleText}>Min £{item.discount.off[0].eligible_amount}</Text>
						</View>
					)}
				</View>

				<View style={styles.cardFooterContainer}>
					{[
						item.accept_reservation === 1 && (
							<View key="reservation" style={styles.locationRow}>
								<Ionicons name="calendar" size={16} color={COLORS.primary} />
								<Text style={styles.footerText}>Reservation</Text>
							</View>
						),
						item.accept_collection === 1 && (
							<View key="collection" style={styles.locationRow}>
								<Ionicons name="bag-check" size={16} color={COLORS.primary} />
								<Text style={styles.footerText}>Collection {collectionTimes ? `(${collectionTimes})` : ''}</Text>
							</View>
						),
						item.accept_delivery === 1 && (
							<View key="delivery" style={styles.locationRow}>
								<Ionicons name="bicycle-outline" size={16} color={COLORS.primary} />
								<Text style={styles.footerText}>Delivery {deliveryTimes ? `(${deliveryTimes})` : ''}</Text>
							</View>
						),
					]
						.filter(Boolean)
						.reduce((acc, curr, index, arr) => {
							acc.push(curr);
							if (index < arr.length - 1) acc.push(<View key={`divider-${index}`} style={styles.line} />);
							return acc;
						}, [])}
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			{/* <Text style={styles.title}>
				{storeRestaurantList.length > 0 ? `${storeRestaurantList.length} Restaurants Found` : 'No Restaurants Found'}
			</Text> */}

			{/* <FlatList
				data={storeRestaurantList}
				renderItem={renderItem}
				keyExtractor={(item, index) => `${item.rest_id}-${index}`}
				contentContainerStyle={{ paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					// 🛡️ Only trigger when:
					// - user has started scrolling (momentum)
					// - not already fetching
					// - still has more data
					if (!onEndReachedCalledDuringMomentum && !isFetching && hasMoreData) {
						fetchSearchRestaurant(pageNo);
						setOnEndReachedCalledDuringMomentum(true);
					}
				}}
				onEndReachedThreshold={0.6}
				onMomentumScrollBegin={() => {
					// ✅ user started scrolling – allow onEndReached to work
					setOnEndReachedCalledDuringMomentum(false);
				}}
				ListFooterComponent={
					isFetching ? (
						<View style={{ paddingVertical: 20, display: 'flex', alignItems: 'center' }}>
							<ActivityIndicator size="small" color={COLORS.primary} />
							<Text style={{ textAlign: 'center', color: COLORS.secondaryText }}>Loading more...</Text>
						</View>
					) : null
				}
			/> */}

			<FlatList
				data={storeRestaurantList}
				renderItem={renderItem}
				keyExtractor={(item, index) => `${item.rest_id}-${index}`}
				contentContainerStyle={{ paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
				onScroll={(e) => {
					const offsetY = e.nativeEvent.contentOffset.y;
					if (offsetY > 0 && !hasUserScrolled) {
						setHasUserScrolled(true);   // user actually scrolled
					}
				}}
				scrollEventThrottle={16}
				onEndReached={() => {
					if (hasUserScrolled && !onEndReachedCalledDuringMomentum && !isFetching && hasMoreData) {
						fetchSearchRestaurant(pageNo);   // page 2, 3, ...
						setOnEndReachedCalledDuringMomentum(true);
					}
				}}
				onEndReachedThreshold={0.4} // a bit lower is safer
				onMomentumScrollBegin={() => {
					setOnEndReachedCalledDuringMomentum(false);
				}}
				ListFooterComponent={
					isFetching ? (
						<View style={{ paddingVertical: 20, display: 'flex', alignItems: 'center' }}>
							<ActivityIndicator size="small" color={COLORS.primary} />
							<Text style={{ textAlign: 'center', color: COLORS.secondaryText }}>Loading more...</Text>
						</View>
					) : null
				}
			/>


			<CustomPopUp
				visible={showCartPopup}
				title="Change Restaurant?"
				message="Your cart will be lost while you select a different restaurant."
				onConfirm={handleConfirmChangeRestaurant}
				onCancel={() => setShowCartPopup(false)}
				confirmText="Yes"
				cancelText="No"
				showCancel
			/>

			<CustomPopUp
				visible={showRedStickerPopup}
				title="Sorry for any inconvenience"
				message="Our online ordering system is coming soon"
				onConfirm={() => setShowRedStickerPopup(false)}
				confirmText="OK"
				showCancel={false}
			/>

			<CustomPopUp
				visible={showClosedPopup}
				title="Sorry!"
				message="Restaurant is closed for today"
				onConfirm={() => setShowClosedPopup(false)}
				confirmText="OK"
				showCancel={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 12, paddingTop: 16, backgroundColor: COLORS.background },
	title: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
	restaurantItem: {
		marginBottom: 4,
		backgroundColor: COLORS.white,
		borderRadius: 10,
		shadowColor: COLORS.cardShadow,
		shadowOpacity: 1,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 16,
		elevation: 6,
		borderWidth: 1,
		borderColor: COLORS.border,
		padding: 10,
	},
	cardContainer: { flexDirection: 'row', gap: 10 },
	restaurantImageContainer: {
		width: 100,
		height: 100,
		borderRadius: 14,
		backgroundColor: COLORS.imageBg,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	restaurantImage: { width: '100%', height: '100%', borderRadius: 14, resizeMode: 'cover' },
	discountBadge: {
		position: 'absolute',
		top: 8,
		left: 8,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.badge,
		borderRadius: 10,
		paddingVertical: 2,
		paddingHorizontal: 7,
		zIndex: 2,
	},
	discountBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.discountText, marginLeft: 3 },
	detailsContainer: { flex: 1, justifyContent: 'center' },
	restaurantName: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
	cuisine: { fontSize: 13, color: COLORS.secondaryText },
	row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 3 },
	ratingBold: { fontWeight: 'bold', fontSize: 13, color: COLORS.secondaryText, marginHorizontal: 2 },
	ratingCount: { fontSize: 12, color: COLORS.secondaryText },
	minDelivery: { fontSize: 12, color: COLORS.secondaryText, marginTop: 5 },
	discountContainer: { alignItems: 'flex-end' },
	discountText: {
		color: COLORS.discountText,
		fontWeight: 'bold',
		fontSize: 13,
		backgroundColor: COLORS.discountBg,
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
		marginBottom: 1,
	},
	discountEligibleText: { fontSize: 11, color: COLORS.text },
	cardFooterContainer: { marginTop: 10, flexDirection: 'row', gap: 5 },
	locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
	footerText: { fontSize: 12, color: COLORS.text },
	line: { width: 1, backgroundColor: COLORS.primary },
});
