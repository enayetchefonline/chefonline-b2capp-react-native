import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function TabLayout() {
	const cartItems = useSelector((state) => state.cart.items);
	const cartCount = Object.keys(cartItems).length;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: 'red',
				tabBarInactiveTintColor: 'gray',
				tabBarStyle: { backgroundColor: 'white' },
				tabBarLabelStyle: {
					fontSize: 12,
					textAlign: 'center',
					marginBottom: 5,
				},
				tabBarIconStyle: {
					alignSelf: 'center',
					marginBottom: 0,
				},
				tabBarIndicatorStyle: {
					backgroundColor: 'red',
				},
				tabBarLabelPosition: 'below-icon',
			}}
		>
			<Tabs.Screen
				name="search"
				options={{
					title: 'Search',
					tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="cart"
				options={{
					title: 'Cart',
					tabBarIcon: ({ color, size }) => (
						<View>
							<FontAwesome name="shopping-cart" color={color} size={size} />
							{cartCount > 0 && (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>{cartCount}</Text>
								</View>
							)}
						</View>
					),

				}}
				// listeners={({ navigation }) => ({
				// 	tabPress: (e) => {
				// 		console.log("Cart tab pressed");

				// 		if (cartCount === 0) {
				// 			e.preventDefault();
				// 			navigation.navigate('search');   // ✅ Correct route name
				// 		}
				// 	},
				// })}

			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, size }) => <FontAwesome name="user" color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
				}}
			/>
		</Tabs>
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
