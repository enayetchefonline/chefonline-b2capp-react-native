import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import Colors from '../../../../constants/color';
import { userLoginApi } from '../../../../lib/api';
import { setUser } from '../../../../store/slices/authSlice';

// === Google Auth ===
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// ✅ Using same Web Client ID for all platforms
const GOOGLE_CLIENT_ID = '129487390256-u084ovr3h7hpla4i742pjkjsatpf900n.apps.googleusercontent.com';

export default function LoginScreen() {
	const router = useRouter();
	const {redirect} = useLocalSearchParams();
	const [redirectUrl, setRedirectUrl] = useState(null);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [checkingLogin, setCheckingLogin] = useState(true);

	const dispatch = useDispatch();

	const authUser = useSelector((state) => state.auth.user);

	console.log("authUser", authUser)

	// Initialize Google request (use same client for all)
	const [request, response, promptAsync] = Google.useAuthRequest({
		webClientId: GOOGLE_CLIENT_ID,
		androidClientId: GOOGLE_CLIENT_ID,
		iosClientId: GOOGLE_CLIENT_ID,
		scopes: ['openid', 'profile', 'email'],
		useProxy: true, // ✅ allows Expo Go login without custom redirect scheme
	});

	// Handle Google auth response
	useEffect(() => {
		(async () => {
			if (response?.type === 'success') {
				try {
					setLoading(true);
					const {authentication} = response;
					const accessToken = authentication?.accessToken ?? '';
					const idToken = authentication?.idToken ?? '';

					// Fetch user info from Google
					const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
						headers: {Authorization: `Bearer ${accessToken}`},
					}).then((r) => r.json());

					const userDetails = {
						name: profile?.name || '',
						email: profile?.email || '',
						picture: profile?.picture || '',
						provider: 'google',
						provider_sub: profile?.sub || '',
					};

					// Save locally
					await AsyncStorage.setItem('accessToken', idToken || accessToken || 'google_oauth_token');
					await AsyncStorage.setItem('userData', JSON.stringify(userDetails));

					const ip = await getUserIp();
					await AsyncStorage.setItem('userIp', ip);

					dispatch(setUser({user: userDetails, token: idToken || accessToken, ip}));

					router.replace(redirectUrl || '/profile');
					setRedirectUrl(null);
				} catch (err) {
					console.error('Google login flow error:', err);
					Alert.alert('Google Login Failed', 'Something went wrong during Google sign-in.');
				} finally {
					setLoading(false);
				}
			} else if (response?.type === 'error') {
				Alert.alert('Google Login Failed', response.error?.message || 'Unknown error');
			}
		})();
	}, [response]); // eslint-disable-line react-hooks/exhaustive-deps

	// Trigger Google login
	const handleGoogleLogin = async () => {
		try {
			if (!request) {
				Alert.alert('Please try again', 'Google auth module not ready yet.');
				return;
			}
			await promptAsync();
		} catch (e) {
			console.error('Google prompt error:', e);
			Alert.alert('Google Login Failed', 'Unable to open Google login.');
		}
	};

	const handleFacebookLogin = () => {
		Alert.alert('Info', 'Facebook login not implemented yet.');
	};

	// Load remembered email/password
	useEffect(() => {
		const loadCredentials = async () => {
			const savedEmail = await AsyncStorage.getItem('rememberedEmail');
			const savedPassword = await AsyncStorage.getItem('rememberedPassword');
			if (savedEmail && savedPassword) {
				setEmail(savedEmail);
				setPassword(savedPassword);
				setRememberMe(true);
			}
		};
		loadCredentials();
	}, []);

	useEffect(() => {
		const checkLoginStatus = async () => {
			const token = await AsyncStorage.getItem('accessToken');
			if (token) {
				router.replace(redirect || '/profile');
			} else {
				setCheckingLogin(false);
			}
		};
		checkLoginStatus();
	}, []);

	useEffect(() => {
		if (redirect) setRedirectUrl(redirect);
	}, [redirect]);

	const getUserIp = async () => {
		try {
			const response = await fetch('https://api.ipify.org?format=json');
			const data = await response.json();
			return data.ip || '0.0.0.0';
		} catch {
			return '0.0.0.0';
		}
	};

	// Normal email login
	const handleLogin = async () => {
		setLoading(true);
		try {
			const ip = await getUserIp();
			const response = await userLoginApi(email, password);

			console.log("user info", response)

			if (response?.status === 'Success' && response?.UserDetails?.access_token) {
				const {access_token, ...userDetails} = response.UserDetails;

				await AsyncStorage.setItem('accessToken', access_token);
				await AsyncStorage.setItem('userData', JSON.stringify(userDetails));
				await AsyncStorage.setItem('userIp', ip);

				if (rememberMe) {
					await AsyncStorage.setItem('rememberedEmail', email);
					await AsyncStorage.setItem('rememberedPassword', password);
				} else {
					await AsyncStorage.removeItem('rememberedEmail');
					await AsyncStorage.removeItem('rememberedPassword');
				}

				dispatch(setUser({user: userDetails, token: access_token, ip}));
				router.replace(redirectUrl || '/profile');
			} else {
				Alert.alert('Login Failed', 'Invalid credentials or missing token.');
			}
		} catch (error) {
			console.error('Login Error:', error);
			Alert.alert('Error', 'Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (checkingLogin) {
		return (
			<View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
				<ActivityIndicator size="large" color={Colors.primary} />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{flex: 1}}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
		>
			<ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
				<View style={styles.container}>
					<View style={styles.loginBox}>
						<Text style={styles.title}>Login</Text>

						<TextInput
							style={styles.input}
							placeholder="Email"
							placeholderTextColor={Colors.placeholder}
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
						/>

						<View style={styles.passwordContainer}>
							<TextInput
								style={styles.passwordInput}
								placeholder="Password"
								placeholderTextColor={Colors.placeholder}
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
							/>
							<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
								<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.text} />
							</TouchableOpacity>
						</View>

						<View style={styles.rememberRow}>
							<TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkbox}>
								<Ionicons name={rememberMe ? 'checkbox-outline' : 'square-outline'} size={20} color={Colors.primary} />
							</TouchableOpacity>
							<Text style={styles.rememberText}>Remember Me</Text>
						</View>

						<TouchableOpacity
							style={[styles.button, {flexDirection: 'row', justifyContent: 'center'}]}
							onPress={handleLogin}
							disabled={loading}
						>
							{loading ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text style={styles.buttonText}>Sign In</Text>
							)}
						</TouchableOpacity>

						{/* Google & Facebook login */}
						{/* <View style={{gap: 10, marginTop: 12}}>
							<TouchableOpacity
								style={[styles.socialButton, {backgroundColor: '#DB4437'}]}
								onPress={handleGoogleLogin}
								disabled={!request || loading}
							>
								<Ionicons name="logo-google" size={18} color="#fff" style={styles.socialIcon} />
								<Text style={styles.socialText}>Continue with Google</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.socialButton, {backgroundColor: '#1877F2'}]}
								onPress={handleFacebookLogin}
							>
								<Ionicons name="logo-facebook" size={18} color="#fff" style={styles.socialIcon} />
								<Text style={styles.socialText}>Continue with Facebook</Text>
							</TouchableOpacity>
						</View> */}

						<TouchableOpacity onPress={() => router.push('profile/forget-password')}>
							<Text style={styles.forgotText}>Forgot Password?</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => router.push('profile/register')}>
							<Text style={styles.registerText}>
								Don&apos;t have an account? <Text style={styles.registerLink}>Register Now</Text>
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 20,
		backgroundColor: Colors.background,
	},
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loginBox: {
		width: '100%',
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 20,
		textAlign: 'center',
	},
	input: {
		height: 48,
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		marginBottom: 16,
		color: Colors.text,
	},
	passwordContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 12,
		marginBottom: 16,
	},
	passwordInput: {
		flex: 1,
		height: 48,
		color: Colors.text,
	},
	button: {
		backgroundColor: Colors.primary,
		paddingVertical: 14,
		borderRadius: 6,
		alignItems: 'center',
	},
	buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
	forgotText: {color: Colors.primary, marginTop: 16, textAlign: 'center'},
	registerText: {marginTop: 10, color: Colors.text, textAlign: 'center'},
	registerLink: {color: Colors.primary, fontWeight: 'bold'},
	rememberRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
	checkbox: {marginRight: 8},
	rememberText: {color: Colors.text, fontSize: 14},
	socialButton: {
		height: 48,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
	},
	socialIcon: {marginRight: 8},
	socialText: {color: '#fff', fontWeight: '600', fontSize: 15},
});
