import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Colors from '../../../constants/color';

export default function Layout() {
	const router = useRouter();
	const cart = useSelector((state) => state.cart.items);
	const restaurantId = useSelector((state) => state.cart.restaurantId);

	return (
		<Stack screenOptions={{ headerShown: true, headerTitleAlign: 'left' }}>
			<Stack.Screen
				name="index"
				options={{
					headerTitle: 'Your Cart',
					headerLeft: () => null,
					headerBackVisible: false,
					headerRight: () =>
						Object.keys(cart).length > 0 ? (
							<TouchableOpacity
								style={styles.addMoreButton}
								onPress={() => router.push(`/search/restaurants/details/${restaurantId}`)}
							>
								<Text style={styles.addMoreText}>Add More</Text>
							</TouchableOpacity>
						) : null,
				}}
			/>
			<Stack.Screen name="checkout/index" options={{ headerTitle: 'Checkout' }} />
			<Stack.Screen name="delivery/index" options={{ headerTitle: 'Delivery Detail' }} />
			<Stack.Screen name="order-success/index" options={{ headerTitle: 'Order Success' }} />
		</Stack>
	);
}

const styles = StyleSheet.create({
	addMoreButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		marginRight: 10,
	},
	addMoreText: {
		color: Colors.primary,
		fontSize: 16,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
});
