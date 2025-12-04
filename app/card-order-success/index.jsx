import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { clearRestaurantDetail } from '../../store/slices/restaurantDetailSlice';
import { clearRestaurantList } from '../../store/slices/restaurantListSlice';

export default function OrderSuccessScreen() {
	const router = useRouter();
	const dispatch = useDispatch();
	const { status, transactionId } = useLocalSearchParams();
	const restaurantName = useSelector((state) => state.cart.restaurantName);
	const restaurantDetails = useSelector((state) => state.restaurantDetail.data);
	const isSuccess = status === 1 || status?.toLowerCase?.() === 'success';

	const handleBackToHome = () => {
		// console.log("back to home")
		if (isSuccess) {
			dispatch(clearCart());
			dispatch(clearRestaurantList());
			dispatch(clearRestaurantDetail());
			router.replace('/(tabs)/search');
		} else {
			// dispatch(clearRestaurantList());
			router.replace('/(tabs)/cart');
		}
	};

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
					<Text style={styles.title}>
						Sorry, payment is unsuccessful. Please try again or call the restaurant to make a payment and confirm your
						order. Phone: {restaurantDetails?.res_business_tel_for_call}
					</Text>
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

				{/* Image with overlay text */}
				<Image
					source={{ uri: 'https://www.chefonline.co.uk/images/order-complete.jpg' }}
					style={styles.bannerImage}
					resizeMode="cover"
				/>

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
		padding: 16,
		backgroundColor: '#f4f4f4',
		flexGrow: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	card: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		width: '100%',
		maxWidth: 500,
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		marginTop: 16,
	},
	highlight: {
		fontStyle: 'italic',
		color: '#333',
	},
	orderCode: {
		marginTop: 10,
		fontSize: 14,
		textAlign: 'center',
	},
	bold: { fontWeight: '700' },
	support: {
		marginTop: 10,
		fontSize: 13,
		color: '#444',
		textAlign: 'center',
	},
	address: {
		fontSize: 13,
		color: '#666',
		textAlign: 'center',
		marginBottom: 16,
	},
	bannerImage: {
		width: '100%',
		height: 160,
		justifyContent: 'center',
		alignItems: 'center',
		marginVertical: 16,
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
		marginTop: 10,
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
		marginTop: 8,
	},
	btn: {
		// backgroundColor: isSuccess ? '#28a745' : '#ff4d4f',
		marginTop: 24,
		paddingVertical: 12,
		paddingHorizontal: 32,
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
