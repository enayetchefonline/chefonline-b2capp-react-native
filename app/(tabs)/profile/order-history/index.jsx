import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import Colors from '../../../../constants/color';
import { getOrderList } from '../../../../lib/api';

// ⭐ For read-only star display
const STARS = [1, 2, 3, 4, 5];

export default function OrderHistoryScreen() {
	const router = useRouter();
	const authUser = useSelector((state) => state.auth.user);
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);

	console.log(
		'order state',
		orders.map((o) =>
			o?.review_status?.rating_comment_status === true
				? 'reviewed'
				: 'not reviewed'
		)
	);

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				const response = await getOrderList({ userid: authUser?.userid });

				console.log('getOrderList', JSON.stringify(response));

				if (Array.isArray(response?.orders)) {
					setOrders(response.orders);
				} else {
					setOrders([]);
				}
			} catch (error) {
				console.error('Failed to fetch order list:', error);
				setOrders([]);
			} finally {
				setLoading(false);
			}
		};

		if (authUser?.userid) {
			fetchOrders();
		}
	}, [authUser?.userid]);

	const renderItem = ({ item }) => {
		const reviewStatus = item?.review_status || {};

		const isReviewed =
			reviewStatus?.rating_status === true &&
			reviewStatus?.rating_comment_status === true;

		// Convert to numbers (API sends strings like "5")
		const food = Number(reviewStatus?.quality_of_food) || 0;
		const service = Number(reviewStatus?.quality_of_service) || 0;
		const value = Number(reviewStatus?.value_of_money) || 0;

		const hasDetailedRating = food > 0 || service > 0 || value > 0;

		const avgRating = hasDetailedRating ? (food + service + value) / 3 : 0;
		const roundedRating = Math.round(avgRating); // for filled stars

		return (
			<Pressable
				onPress={() =>
					router.push({
						pathname: '/profile/order-detail',
						params: { orderId: item.order_no },
					})
				}
				style={styles.card}
			>
				{/* Header */}
				<View style={styles.row}>
					<Text style={styles.restaurant}>{item.restaurant_name}</Text>
					<Text style={styles.orderId}>ORDER ID - {item.order_no}</Text>
				</View>

				{/* Divider */}
				<View style={styles.divider} />

				{/* Address & Date */}
				<View style={[styles.row, styles.justifyBetween]}>
					<View style={styles.row}>
						<Ionicons
							name="location-outline"
							size={16}
							color={Colors.primary}
							style={styles.iconSmall}
						/>
						<Text style={styles.address}>{item.postcode}</Text>
					</View>
					<Text style={styles.date}>{item.order_date}</Text>
				</View>

				{/* Times */}
				<View style={[styles.row, styles.justifyBetween, styles.mt4]}>
					<Text style={styles.times}>
						IN: {item.order_time} | OUT: {item.delivery_time}
					</Text>
				</View>

				{/* Type & Amount */}
				<View style={[styles.row, styles.mt4]}>
					<View style={styles.row}>
						<Ionicons
							name="bag-check-outline"
							size={16}
							color={Colors.primary}
							style={styles.iconSmall}
						/>
						<Text style={styles.type}>{item.order_type}</Text>
					</View>
					<Text style={styles.cash}>
						Paid: £{parseFloat(item.grand_total || 0).toFixed(2)}
					</Text>
				</View>

				{/* Action / Rating */}
				<View style={[styles.row, styles.buttonRow]}>
					{isReviewed ? (
						// ⭐ Already reviewed: show star row instead of button
						<View style={styles.reviewPill}>
							<View style={styles.starRow}>
								{STARS.map((i) => (
									<Ionicons
										key={i}
										name={i <= roundedRating ? 'star' : 'star-outline'}
										size={18}
										color={Colors.primary}
										style={styles.starIcon}
									/>
								))}
							</View>
							<Text style={styles.reviewText}>
								{hasDetailedRating
									? `${avgRating.toFixed(1)} / 5`
									: 'Reviewed'}
							</Text>
						</View>
					) : (
						// ✅ Not reviewed yet: show Review button
						<CustomButton
							title="REVIEW & RATING"
							iconName="star-outline"
							onPress={() =>
								router.push({
									pathname: '/profile/review-rating',
									params: {
										orderId: item.order_no,
										restaurantId: item.rest_id,
									},
								})
							}
							containerStyle={styles.btnHalf}
						/>
					)}
				</View>
			</Pressable>
		);
	};

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={{ marginTop: 10, color: Colors.text }}>
					Loading Order History...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<Text style={styles.title}>Total Orders: {orders.length}</Text>
			<FlatList
				data={orders}
				keyExtractor={(item) =>
					item.id?.toString() ||
					item.orderId?.toString() ||
					item.order_no?.toString()
				}
				renderItem={renderItem}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View style={styles.empty}>
						<Text style={{ color: Colors.text }}>No orders found.</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	title: {
		fontWeight: 'bold',
		color: Colors.text,
		marginTop: 20,
		marginBottom: 10,
		textAlign: 'right',
		paddingRight: 20,
	},
	list: {
		padding: 16,
	},
	card: {
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
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	justifyBetween: {
		justifyContent: 'space-between',
	},
	restaurant: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
	},
	orderId: {
		fontSize: 12,
		color: Colors.text,
	},
	iconSmall: {
		marginRight: 6,
	},
	address: {
		fontSize: 14,
		color: Colors.text,
	},
	date: {
		fontSize: 12,
		color: Colors.text,
	},
	times: {
		fontSize: 12,
		color: Colors.text,
	},
	cash: {
		fontSize: 12,
		color: Colors.text,
	},
	type: {
		fontSize: 14,
		color: Colors.primary,
		marginLeft: 4,
	},
	mt4: {
		marginTop: 8,
	},
	buttonRow: {
		justifyContent: 'flex-end',
		marginTop: 12,
	},
	btnHalf: {
		width: '48%',
	},
	divider: {
		width: '100%',
		height: 1,
		backgroundColor: Colors.border || '#ccc',
		marginVertical: 12,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	empty: {
		marginTop: 80,
		alignItems: 'center',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},

	// ⭐ New styles for rating pill + stars
	reviewPill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: Colors.background || '#f5f5f5',
		flexDirection: 'row',
		alignItems: 'center',
	},
	starRow: {
		flexDirection: 'row',
		marginRight: 6,
	},
	starIcon: {
		marginRight: 2,
	},
	reviewText: {
		fontSize: 12,
		color: Colors.text,
	},
});
