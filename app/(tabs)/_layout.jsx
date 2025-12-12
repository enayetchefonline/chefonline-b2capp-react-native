import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';

export default function TabLayout() {
	const cartItems = useSelector((state) => state.cart.items);
	const cartCount = Object.keys(cartItems).length;
	const cartEnabled = cartCount > 0;

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
				{/* SEARCH TAB */}
				<Tabs.Screen
					name="search"
					options={{
						title: 'Search',
						tabBarIcon: ({ color, size }) => (
							<Ionicons name="search" color={color} size={size} />
						),
					}}
				/>

				{/* CART TAB (CRITICAL FIX) */}
				<Tabs.Screen
					key={cartEnabled ? 'cart-enabled' : 'cart-disabled'} // 🔥 forces remount
					name="cart"
					options={{
						title: 'Cart',
						href: cartEnabled ? undefined : null, // hide if empty
						unmountOnBlur: true,                  // reset stack when switching tabs
						tabBarIcon: ({ color }) => (
							<View>
								<FontAwesome name="shopping-cart" color={color} size={22} />
								{cartEnabled && (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{cartCount}</Text>
									</View>
								)}
							</View>
						),
					}}
					listeners={{
						tabPress: (e) => {
							if (!cartEnabled) {
								e.preventDefault();
								setSnackbarVisible(true);
								return;
							}

							// 🔥 ALWAYS OPEN CART INDEX (NEVER CHECKOUT)
							e.preventDefault();
							router.replace('/(tabs)/cart');
						},
					}}
				/>

				{/* PROFILE TAB */}
				<Tabs.Screen
					name="profile"
					options={{
						title: 'Profile',
						tabBarIcon: ({ color }) => (
							<FontAwesome name="user" color={color} size={22} />
						),
					}}
				/>

				{/* SETTINGS TAB */}
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

			{/* SNACKBAR */}
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
