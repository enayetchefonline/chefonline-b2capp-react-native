import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Modal,
	Platform,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import Swiper from 'react-native-swiper';
import { Ionicons } from 'react-native-vector-icons';
import { useDispatch } from 'react-redux';
import CustomButton from '../../../components/ui/CustomButton';
import Colors from '../../../constants/color';
import { cuisineListApi, getSliderImageApi, searchRestaurantsApi } from '../../../lib/api';
import { setCuisine, setOrderType, setSearchText } from '../../../store/slices/cartSlice';
import { clearRestaurantList, setRestaurantList } from '../../../store/slices/restaurantListSlice';

// Helper to fetch postcode from coordinates
const getPostcodeFromCoords = async (latitude, longitude) => {
	const url = `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		if (data.status === 200 && data.result && data.result.length > 0) {
			return data.result[0].postcode;
		}
		return null;
	} catch (_err) {
		return null;
	}
};

export default function SearchScreen() {
	const router = useRouter();
	const dispatch = useDispatch();

	const [activeTab, setActiveTab] = useState('takeaway');
	const [restaurantName, setRestaurantName] = useState('');
	const [isCuisineLoading, setIsCuisineLoading] = useState(false);
	const [selectedCuisine, setSelectedCuisine] = useState('');
	// const [searchResult, setSearchResult] = useState([]);
	const [cuisineList, setCuisineList] = useState([]);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [sliderImage, setSliderImage] = useState([]);
	const [locationLoading, setLocationLoading] = useState(false);
	// Snackbar
	const [visibleSnackBar, setVisibleSnackBar] = useState(false);
	const [snackBarMessage, setSnackBarMessage] = useState('');

	// const storeRestaurantList = useSelector((state) => state.restaurantList.restaurantList);

	// ✅ Simple UK postcode regex (covers standard formats)
	const UK_POSTCODE_REGEX =
		/^(([Gg][Ii][Rr]\s?0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2}))$/;

	// ✅ Auto-format UK postcode: remove spaces, uppercase, add single space before last 3 chars
	const formatUkPostcode = (value) => {
		if (!value) return '';
		const trimmed = value.trim().toUpperCase().replace(/\s+/g, '');
		if (trimmed.length <= 3) return trimmed; // not enough to format
		return `${trimmed.slice(0, trimmed.length - 3)} ${trimmed.slice(-3)}`;
	};

	// ✅ Decide if a string "looks like" a postcode (contains digit + reasonable length)
	const looksLikePostcode = (value) => {
		if (!value) return false;
		const trimmed = value.trim().replace(/\s+/g, '');
		// basic heuristic: must contain at least 1 digit and length between 5–8
		return /\d/.test(trimmed) && trimmed.length >= 5 && trimmed.length <= 8;
	};


	useEffect(() => {
		fetchCuisineList();
		getSliderImage();
	}, []);

	const getSliderImage = async () => {
		const response = await getSliderImageApi();
		setSliderImage(response.result || []);
	};

	// Get location and set postcode/town as search text
	const getCurrentLocation = async () => {
		setLocationLoading(true);
		try {
			// ==== FOR TESTING ONLY: use hardcoded coordinates ====
			/* const testLat = 51.5239319;
			const testLon = -0.0738251;
			const postcode = await getPostcodeFromCoords(testLat, testLon);
			if (postcode) {
				setRestaurantName(postcode);
			} else {
				setSnackBarMessage('Sorry! No postcode found');
				setVisibleSnackBar(true);
			} */
			// ==== END TESTING ONLY ====

			// ==== FOR PRODUCTION, COMMENT OUT THE ABOVE BLOCK AND UNCOMMENT BELOW ====

			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				setSnackBarMessage('Permission to access location was denied');
				setVisibleSnackBar(true);
				setLocationLoading(false);
				return;
			}
			let loc = await Location.getCurrentPositionAsync({});
			if (loc && loc.coords) {
				const postcode = await getPostcodeFromCoords(loc.coords.latitude, loc.coords.longitude);
				if (postcode) {
					setRestaurantName(postcode);
				} else {
					setSnackBarMessage('Sorry! No postcode found');
					setVisibleSnackBar(true);
				}
			}
		} catch (error) {
			console.log('Location error:', error);
			setSnackBarMessage('Error getting location');
			setVisibleSnackBar(true);
		}
		setLocationLoading(false);
	};

	const fetchCuisineList = async () => {
		setIsCuisineLoading(true);
		try {
			const response = await cuisineListApi();
			if (Array.isArray(response)) {
				setCuisineList(response);
			} else {
				setCuisineList([]);
				console.error('Invalid cuisine list structure');
			}
		} catch (error) {
			console.error('Error fetching cuisines:', error);
			setCuisineList([]);
		} finally {
			setIsCuisineLoading(false);
		}
	};

	const fetchSearchRestaurant = async () => {
		const data = {
			searchText: restaurantName,
			cuisineType: selectedCuisine || 'all',
			orderType: activeTab,
			pageNo: 1,
		};

		try {
			const response = await searchRestaurantsApi(data);

			if (response?.app && Array.isArray(response.app)) {
				if (response.app[0]?.status === 'Failed') {
					setSnackBarMessage(`We found 0 restaurant in ${restaurantName}`.toUpperCase());
					setVisibleSnackBar(true);
					dispatch(setRestaurantList([]));
					return { success: false };
				} else {
					dispatch(setRestaurantList(response.app));   // 🔹 store page 1 in Redux
					return { success: true, data: response.app };
				}
			} else {
				setSnackBarMessage('Invalid response format');
				setVisibleSnackBar(true);
				return { success: false };
			}
		} catch (error) {
			console.error('Search error:', error);
			setSnackBarMessage('Something went wrong while searching');
			setVisibleSnackBar(true);
			return { success: false };
		}
	};


	// const fetchSearchRestaurant = async () => {
	// 	const data = {
	// 		searchText: restaurantName,
	// 		cuisineType: selectedCuisine || 'all',
	// 		orderType: activeTab,
	// 		pageNo: 1,
	// 	};

	// 	// console.log("search result", data)

	// 	try {
	// 		const response = await searchRestaurantsApi(data);

	// 		if (response?.app && Array.isArray(response.app)) {
	// 			if (response.app[0]?.status === 'Failed') {
	// 				setSnackBarMessage(`We found 0 restaurant in ${restaurantName}`.toUpperCase());
	// 				setVisibleSnackBar(true);
	// 				// setSearchResult([]);
	// 				dispatch(setRestaurantList([]));
	// 				return {success: false};
	// 			} else {
	// 				dispatch(setRestaurantList(response.app));
	// 				// setSearchResult(response.app);
	// 				return {success: true, data: response.app};
	// 			}
	// 		} else {
	// 			setSnackBarMessage('Invalid response format');
	// 			setVisibleSnackBar(true);
	// 			// setSearchResult([]);
	// 			return {success: false};
	// 		}
	// 	} catch (error) {
	// 		console.error('Search error:', error);
	// 		setSnackBarMessage('Something went wrong while searching');
	// 		setVisibleSnackBar(true);
	// 		// setSearchResult([]);
	// 		return {success: false};
	// 	}
	// };

	const handleFindRestaurant = async () => {
		// ✅ Get clean input
		const rawInput = (restaurantName || '').trim();

		// ✅ Minimum length check (fixes "E" case)
		if (rawInput.length <= 1) {
			setSnackBarMessage('Please enter your Postcode/Town/Restaurant name');
			setVisibleSnackBar(true);
			return;
		}

		// ✅ Decide if we should treat it as postcode
		let finalSearchText = rawInput;

		if (looksLikePostcode(rawInput)) {
			// Auto-format like "E16SS" -> "E1 6SS"
			const formatted = formatUkPostcode(rawInput);

			// Validate against UK postcode pattern
			if (!UK_POSTCODE_REGEX.test(formatted)) {
				setSnackBarMessage('Please enter a valid UK postcode (e.g. E1 6SS)');
				setVisibleSnackBar(true);
				return; // ❌ Do NOT call API
			}

			// Use formatted in UI + Redux
			finalSearchText = formatted;
			setRestaurantName(formatted);
		}

		setIsLoading(true);

		// 🔹 Keep your existing Redux logic, just use finalSearchText
		dispatch(clearRestaurantList());
		dispatch(setSearchText(finalSearchText));
		dispatch(setCuisine(selectedCuisine || 'all'));
		dispatch(setOrderType(activeTab));

		const result = await fetchSearchRestaurant(); // still uses restaurantName internally
		if (result?.success) {
			router.push(`/search/restaurants`);
		}

		setIsLoading(false);
	};


	const handleCuisineSelect = (cuisine) => {
		setSelectedCuisine(cuisine);
		setIsModalVisible(false);
	};

	const handleCuisineClear = () => {
		setSelectedCuisine('');
		fetchSearchRestaurant();
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
				<View style={styles.container}>
					<View style={styles.sliderMain}>
						{sliderImage.length > 0 ? (
							<Swiper
								autoplay
								autoplayTimeout={3}
								showsPagination={true}
								dotColor="#ccc"
								activeDotColor="#EC1839"
								style={{ borderRadius: 10 }}
								paginationStyle={{ top: 165 }}
							>
								{sliderImage.map((img, idx) => (
									<Image
										key={idx}
										source={{
											uri: typeof img === 'string' ? img : img?.url || img?.image || '',
										}}
										style={styles.image}
									/>
								))}
							</Swiper>
						) : (
							<ActivityIndicator size="large" color="#EC1839" />
						)}
					</View>

					<View style={styles.searchTabSectionMain}>
						<View style={styles.tabsContainer}>
							<TouchableOpacity
								style={[styles.tab, activeTab === 'takeaway' && styles.activeTab]}
								onPress={() => setActiveTab('takeaway')}
							>
								<Text style={[styles.tabText, activeTab === 'takeaway' && styles.activeTabText]}>Order A Takeaway</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.tab, activeTab === 'reservation' && styles.activeTab]}
								onPress={() => setActiveTab('reservation')}
							>
								<Text style={[styles.tabText, activeTab === 'reservation' && styles.activeTabText]}>
									Make A Reservation
								</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.contentSection}>
							<View style={styles.inputContainer}>
								<Ionicons name="search" size={20} color="#ccc" style={styles.inputIcon} />
								<TextInput
									style={styles.input}
									placeholder="Postcode/Town/Restaurant Name"
									placeholderTextColor={Colors.placeholder}
									value={restaurantName}
									onChangeText={setRestaurantName}
								/>
								<TouchableOpacity onPress={getCurrentLocation} disabled={locationLoading}>
									<MaterialIcons
										name="my-location"
										size={22}
										color={locationLoading ? '#ccc' : '#EC1839'}
										style={{ paddingLeft: 8 }}
									/>
								</TouchableOpacity>
							</View>

							<View style={styles.inputContainer}>
								<Ionicons name="chevron-down" size={20} color="#ccc" style={styles.inputIcon} />
								<Text style={styles.input} onPress={() => setIsModalVisible(true)}>
									{isCuisineLoading ? (
										<ActivityIndicator size="small" color="red" />
									) : (
										selectedCuisine || 'Select Cuisine'
									)}
								</Text>
								{selectedCuisine && (
									<TouchableOpacity onPress={handleCuisineClear} style={styles.clearButton}>
										<Ionicons name="close-circle" size={20} color="#ccc" />
									</TouchableOpacity>
								)}
							</View>

							<CustomButton
								title="FIND RESTAURANT"
								onPress={handleFindRestaurant}
								containerStyle={styles.button}
								textStyle={styles.buttonText}
								iconName="search-outline"
								iconPosition="left"
								disabled={!restaurantName || isLoading}
								loading={isLoading}
							/>
						</View>
					</View>

					<View style={styles.stepSection}>
						<Image source={require('../../../assets/images/search/home-page-image.png')} style={styles.stepImage} />
					</View>

					<Modal
						animationType="slide"
						transparent
						visible={isModalVisible}
						onRequestClose={() => setIsModalVisible(false)}
					>
						<View style={styles.modalContainer}>
							<View style={styles.modalContent}>
								<View style={styles.modalHeader}>
									<TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.cancelIcon}>
										<Ionicons name="close" size={30} color="black" />
									</TouchableOpacity>
								</View>
								<Text style={styles.modalTitle}>Select Cuisine</Text>
								<ScrollView style={styles.scrollView}>
									{cuisineList.length > 0 ? (
										cuisineList.map((cuisine, index) => (
											<TouchableOpacity
												key={index}
												style={styles.modalOption}
												onPress={() => handleCuisineSelect(cuisine)}
											>
												<Text style={styles.modalOptionText}>{cuisine || 'Unknown Cuisine'}</Text>
											</TouchableOpacity>
										))
									) : (
										<Text>No cuisines available</Text>
									)}
								</ScrollView>
							</View>
						</View>
					</Modal>
					<Snackbar
						visible={visibleSnackBar}
						duration={5000}
						onDismiss={() => {
							setSnackBarMessage('');
							setVisibleSnackBar(false);
						}}
						action={{
							label: 'OK',
							onPress: () => {
								setSnackBarMessage('');
								setVisibleSnackBar(false);
							},
						}}
					>
						{/* Force upper case here */}
						<Text style={{ color: '#fff' }}>{snackBarMessage.toUpperCase()}</Text>
					</Snackbar>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#fff',
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	container: {
		flex: 1,
		backgroundColor: '#fff',
		gap: 10,
	},
	sliderMain: {
		height: 150,
		width: '90%',
		marginHorizontal: '5%',
		borderRadius: 10,
		marginTop: 10,
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
		borderRadius: 10,
	},
	searchTabSectionMain: {
		marginHorizontal: '5%',
		borderRadius: 10,
		marginTop: 20,
	},
	tabsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	tab: {
		flex: 1,
		padding: 10,
		backgroundColor: '#E0E0E0',
		borderTopEndRadius: 10,
		borderTopStartRadius: 10,
		alignItems: 'center',
	},
	activeTab: {
		backgroundColor: '#EC1839',
	},
	tabText: {
		fontSize: 16,
		color: '#333',
	},
	activeTabText: {
		color: '#fff',
	},
	contentSection: {
		padding: 10,
		backgroundColor: '#F2F2F2',
		borderBottomRightRadius: 10,
		borderBottomLeftRadius: 10,
		borderTopColor: '#EC1839',
		borderTopWidth: 5,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 10,
		marginBottom: 15,
	},
	input: {
		flex: 1,
		paddingHorizontal: 5,
		paddingVertical: 5,
		fontSize: 16,
		borderRadius: 10,
		color: '#333',
	},
	inputIcon: {
		marginRight: 5,
	},
	button: {
		width: '100%',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	stepSection: {
		marginHorizontal: '5%',
	},
	stepImage: {
		width: '100%',
		height: 220,
		resizeMode: 'cover',
		borderRadius: 10,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContent: {
		width: '100%',
		backgroundColor: '#fff',
		padding: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginBottom: 10,
	},
	cancelIcon: {
		padding: 10,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	modalOption: {
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	modalOptionText: {
		fontSize: 16,
		color: '#333',
	},
	scrollView: {
		maxHeight: 300,
	},
	clearButton: {
		position: 'absolute',
		right: 10,
		top: 10,
		padding: 5,
	},
	snackbar: {
		position: 'absolute',
		bottom: 40, // or 20 for closer to bottom
		left: 20,
		right: 20,
		backgroundColor: '#1a1a1a',
		borderRadius: 8,
		padding: 12,
		flexDirection: 'row',
		alignItems: 'center',
		elevation: 5,
		zIndex: 999,
	},
	snackbarText: {
		color: '#fff',
		flex: 1,
	},
	snackbarClose: {
		color: '#fff',
		fontWeight: 'bold',
		marginLeft: 15,
	},
});