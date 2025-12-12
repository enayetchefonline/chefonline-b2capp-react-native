import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';

export default function TabLayout() {
	const cartItems = useSelector((state) => state.cart.items);
	const cartCount = Object.keys(cartItems).length;
	const router = useRouter();

	const [snackbarVisible, setSnackbarVisible] = useState(false);

	return (
		<>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: 'red',
					tabBarInactiveTintColor: 'gray',
					tabBarStyle: { backgroundColor: 'white' },
					tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
					tabBarLabelPosition: 'below-icon',
				}}
			>
				<Tabs.Screen
					name="search"
					options={{
						title: 'Search',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="search" color={color} size={size} />
						),
					}}
				/>

				<Tabs.Screen
					name="cart"
					options={{
						title: 'Cart',
						unmountOnBlur: true,
						href: cartCount === 0 ? null : undefined, // ✅ hide tab completely
						tabBarIcon: ({ color }) => (
							<View>
								<FontAwesome name="shopping-cart" color={color} size={22} />
								{cartCount > 0 && (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{cartCount}</Text>
									</View>
								)}
							</View>
						),
					}}
				/>

				{/* <Tabs.Screen
					name="cart"
					options={{
						title: 'Cart',
						tabBarIcon: ({ color }) => (
							<View>
								<FontAwesome name="shopping-cart" color={color} size={22} />
								{cartCount > 0 && (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{cartCount}</Text>
									</View>
								)}
							</View>
						),
					}}
					listeners={() => ({
						tabPress: (e) => {
							if (cartCount === 0) {
								e.preventDefault();
								setSnackbarVisible(true);

								setTimeout(() => {
									router.replace('/(tabs)/search');
								}, 300);
							}
						},
					})}
				/> */}


				<Tabs.Screen
					name="profile"
					options={{
						title: 'Profile',
						tabBarIcon: ({ color }) => (
							<FontAwesome name="user" color={color} size={22} />
						),
					}}
				/>

				<Tabs.Screen
					name="settings"
					options={{
						title: 'Settings',
						tabBarIcon: ({ color }) => (
							<Ionicons name="settings" color={color} size={22} />
						),
					}}
				/>
			</Tabs>

			{/* 🔔 Snackbar */}
			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={2000}
				style={{ backgroundColor: '#333' }}
			>
				Cart is empty. Please add items first.
			</Snackbar>
		</>
	);
}


const styles = StyleSheet.create({
	badge: {
		position: 'absolute',
		right: -10,
		top: -5,
		backgroundColor: 'red',
		borderRadius: 10,
		minWidth: 18,
		height: 18,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 4,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});
