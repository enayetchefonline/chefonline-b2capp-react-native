import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { clearRestaurantDetail } from '../../store/slices/restaurantDetailSlice';
import { clearRestaurantList } from '../../store/slices/restaurantListSlice';

export default function CardPaymentWebview() {
	const {url} = useLocalSearchParams();
	const router = useRouter();
	const dispatch = useDispatch();

	const [loading, setLoading] = useState(true); // initial true to show loader on screen load
	const insets = useSafeAreaInsets();

	const storeRestaurantList = useSelector((state) => state.restaurantList.restaurantList);

	const handleBackToHome = () => {
		console.log()
		setLoading(true);
		dispatch(clearCart());
		dispatch(clearRestaurantList());
		dispatch(clearRestaurantDetail());

		// console.log("storeResturantLIst ..........", storeRestaurantList)

		setTimeout(() => {
			router.replace('/(tabs)/search');
		}, 500);
	};

	return (
		<SafeAreaView style={styles.container}>
			<WebView
				source={{uri: url}}
				style={styles.webview}
				scalesPageToFit={true}
				onLoadStart={() => setLoading(true)}
				onLoadEnd={() => setLoading(false)}
			/>

			{/* Loading Spinner Overlay */}
			{loading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color="#EC1839" />
				</View>
			)}

			<View style={[styles.footer, {paddingBottom: insets.bottom || 20}]}>
				<TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
					<Text style={styles.backButtonText}>Back to Home</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	webview: {
		flex: 1,
		width: Dimensions.get('window').width,
	},
	footer: {
		paddingHorizontal: 10,
		backgroundColor: 'white',
		alignItems: 'center',
	},
	backButton: {
		backgroundColor: '#EC1839',
		paddingVertical: 12,
		borderRadius: 8,
		width: '100%',
	},
	backButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		textAlign: 'center',
		fontSize: 16,
	},
	loadingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(255,255,255,0.6)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
});
