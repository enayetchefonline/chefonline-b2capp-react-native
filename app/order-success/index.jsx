import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';

export default function OrderSuccessScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const { status, transactionId, discount, carrybag, delivery, total, message } = useLocalSearchParams();
	const storeItemList = useSelector((state) => state.cart.items);
	const restaurantName = useSelector((state) => state.cart.restaurantName);
	const restaurantDetails = useSelector((state) => state.restaurantDetail.data);

	console.log("status", status)

	// 👉 for responsive heights
	const { height: screenHeight } = useWindowDimensions();

	const isSuccess = status === 1 || status === 'Success';

	const handleBackToHome = () => {
		if (isSuccess) {
			dispatch(clearCart());
			router.replace('/(tabs)/search');
		} else {
			router.replace('/(tabs)/cart');
		}
	};

	// Pre-compute subtotal
	const subtotal = Object.values(storeItemList)
		.reduce((sum, itemObj) => sum + parseFloat(itemObj.item.dish_price) * itemObj.quantity, 0)
		.toFixed(2);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.card}>
				<Ionicons
					name={isSuccess ? 'checkmark-circle' : 'close-circle'}
					size={80}
					color={isSuccess ? '#28a745' : '#e74c3c'}
				/>

				{isSuccess ? (
					<Text style={styles.title}>
						Thank you for your order with <Text style={styles.highlight}>{restaurantName}</Text>
					</Text>
				) : (
					<>
					<Text style={styles.title}>Please wait for 3 minutes to place a new order.</Text>
					<Text style={styles.message}>{message}</Text>
					</>
					
				)}

				{isSuccess ? (
					<Text style={styles.orderCode}>
						Your order code is <Text style={styles.bold}>{transactionId}</Text>
					</Text>
				) : null}

				{isSuccess ? (
					<>
						<Text style={styles.support}>
							If you need to make any changes to your order, please call {restaurantDetails?.res_business_tel_for_call}
						</Text>
						<Text style={styles.address}>{restaurantDetails?.address}</Text>
					</>
				) : null}

				<Image
					source={{ uri: 'https://www.chefonline.co.uk/images/order-complete.jpg' }}
					style={styles.bannerImage}
					resizeMode="cover"
				/>

				{/* Summary */}
				<View
					style={[
						styles.summaryBox,
						{ maxHeight: screenHeight * 0.45 }, // cap summary box height to ~45% of screen
					]}
				>
					<Text style={styles.summaryTitle}>My Order</Text>

					{/* Scroll only the items list */}
					<ScrollView
						nestedScrollEnabled
						showsVerticalScrollIndicator={true}     // 👈 show scrollbar
						indicatorStyle="black"                   // 👈 iOS hint for darker indicator
						style={{ maxHeight: screenHeight * 0.22, paddingRight: 4 }} // 👈 small right padding
						contentContainerStyle={{ paddingBottom: 6 }}
						scrollIndicatorInsets={{ right: 1 }}     // 👈 keep indicator visible
					>
						{Object.values(storeItemList).map((itemObj, index) => {
							const { dish_name, dish_price } = itemObj.item;
							const quantity = itemObj.quantity;
							const totalPrice = (parseFloat(dish_price) * quantity).toFixed(2);
							return (
								<Text style={styles.summaryLine} key={index}>
									{quantity} x {dish_name} - £{totalPrice}
								</Text>
							);
						})}
					</ScrollView>

					{/* Totals (non-scrolling) */}
					<View style={{ marginTop: 8, backgroundColor: '#fff', padding: 8, borderRadius: 6, borderColor: '#ddd', borderWidth: 1 }}>
						<Text style={styles.summaryLine}>Subtotal: £{subtotal}</Text>

						{parseFloat(discount) > 0 && (
							<Text style={styles.summaryLine}>Discount: -£{parseFloat(discount).toFixed(2)}</Text>
						)}

						{parseFloat(delivery) > 0 && (
							<Text style={styles.summaryLine}>Delivery: £{parseFloat(delivery).toFixed(2)}</Text>
						)}

						{parseFloat(carrybag) > 0 && (
							<Text style={styles.summaryLine}>Carry Bag: £{parseFloat(carrybag).toFixed(2)}</Text>
						)}

						<Text style={styles.total}>Total: £{parseFloat(total).toFixed(2)}</Text>
					</View>
				</View>

				<TouchableOpacity
					style={[styles.btn, isSuccess ? styles.btnSuccess : styles.btnError]}
					onPress={handleBackToHome}
				>
					<Text style={styles.btnText}>{isSuccess ? 'Back to Home' : 'Back to Cart'}</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 32,
		padding: 16,
		paddingBottom: 24,
		backgroundColor: '#f4f4f4',
		flexGrow: 1,
		alignItems: 'center',
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		width: '100%',
		maxWidth: 500,
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: 12,
	},
	message: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		marginTop: 8,
	},
	highlight: {
		fontStyle: 'italic',
		color: '#333',
	},
	orderCode: {
		marginTop: 8,
		fontSize: 14,
		textAlign: 'center',
	},
	bold: { fontWeight: '700' },
	support: {
		marginTop: 8,
		fontSize: 13,
		color: '#444',
		textAlign: 'center',
	},
	address: {
		fontSize: 13,
		color: '#666',
		textAlign: 'center',
		marginBottom: 12,
	},
	bannerImage: {
		width: '100%',
		height: 120, // slightly smaller to help fit within one screen
		justifyContent: 'center',
		alignItems: 'center',
		marginVertical: 12,
	},
	overlayText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '900',
		backgroundColor: '#00000088',
		padding: 6,
		textAlign: 'center',
	},
	summaryBox: {
		backgroundColor: '#f9f9f9',
		width: '100%',
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
	},
	summaryTitle: {
		fontWeight: 'bold',
		fontSize: 16,
		marginBottom: 8,
	},
	summaryLine: {
		fontSize: 14,
		color: '#333',
		marginBottom: 4,
	},
	total: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000',
		marginTop: 6,
	},
	btn: {
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 28,
		borderRadius: 6,
	},
	btnText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	btnSuccess: {
		backgroundColor: '#28a745',
	},
	btnError: {
		backgroundColor: '#ff4d4f',
	},
});
