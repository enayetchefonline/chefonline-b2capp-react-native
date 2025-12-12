import { Stack } from 'expo-router';

export default function Layout() {
	return (
		<Stack screenOptions={{ headerShown: true }}>
			<Stack.Screen name="index" options={{
				headerShown: true, headerTitle: 'Profile',
				headerLeft: () => null,
				headerBackVisible: false,
			}} />
			<Stack.Screen name="edit-profile/index" options={{ headerShown: true, headerTitle: 'Edit Profile' }} />
			<Stack.Screen name="reset-password/index" options={{ headerShown: true, headerTitle: 'Reset Password' }} />
			<Stack.Screen name="order-history/index" options={{ headerShown: true, headerTitle: 'Order History' }} />
			<Stack.Screen name="review-rating/index" options={{ headerShown: true, headerTitle: 'Review & Rating' }} />
			<Stack.Screen name="login/index" options={{
				headerShown: true, headerTitle: 'Login',
				headerLeft: () => null,
				headerBackVisible: false,
			}} />
			<Stack.Screen name="register/index" options={{ headerShown: true, headerTitle: 'Register' }} />
			<Stack.Screen name="forget-password/index" options={{ headerShown: true, headerTitle: 'Forget Password' }} />
			<Stack.Screen name="order-detail/index" options={{ headerShown: true, headerTitle: 'Order Detail' }} />
			<Stack.Screen
				name="send-verification-code/index"
				options={{ headerShown: true, headerTitle: 'Verification Code' }}
			/>
			<Stack.Screen
				name="confirm-new-password/index"
				options={{ headerShown: true, headerTitle: 'Confirm New Password' }}
			/>
			<Stack.Screen name="otp/index" options={{ headerShown: true, headerTitle: 'OTP Verification' }} />
		</Stack>
	);
}
