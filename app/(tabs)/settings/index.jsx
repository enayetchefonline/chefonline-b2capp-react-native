import Constants from 'expo-constants'; // ✅ ADD THIS
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../../constants/color';
import getData from '../../../lib/api';

export default function SettingScreen() {
	const router = useRouter();
	const [settings, setSettings] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSettings();
	}, []);

	const fetchSettings = async () => {
		setLoading(true);
		try {
			const res = await getData('http://smartrestaurantsolutions.com/mobile-react-api/live/Trigger.php?funId=4');
			if (res?.data?.status === 'Success') {
				setSettings(res.data.result);
			}
		} catch (err) {
			console.warn('Error fetching settings:', err.message);
		} finally {
			setLoading(false);
		}
	};

	const renderSkeleton = (_, index) => (
		<View key={index} style={styles.settingCard}>
			<View style={styles.skeletonBox} />
			<View style={styles.verticalLine} />
			<View style={styles.skeletonText} />
		</View>
	);

	const renderItem = ({item}) => (
		<TouchableOpacity
			style={styles.settingCard}
			onPress={() =>
				router.push({
					pathname: '/settings/detail',
					params: {settingsId: item.id, settingsName: item.title},
				})
			}
		>
			{item.title.toLowerCase() === 'cart' ? (
				<Ionicons name="cart-outline" size={50} color={Colors.primary} />
			) : (
				<Image source={{uri: item.icon}} style={styles.icon} />
			)}

			<View style={styles.verticalLine} />
			<Text style={styles.settingCardText}>{item.title}</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{loading ? (
				<View style={styles.skeletonWrapper}>
					{[1, 2, 3, 4].map((_, i) => renderSkeleton(_, i))}
				</View>
			) : (
				<FlatList
					data={settings}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					numColumns={2}
					columnWrapperStyle={{justifyContent: 'space-between'}}
				/>
			)}

			{/* ✅ App Version at bottom */}
			<View style={styles.versionContainer}>
				<Text style={styles.versionText}>Version: {Constants.expoConfig?.version}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
		padding: 10,
	},

	settingCard: {
		width: '48%',
		backgroundColor: Colors.white,
		borderRadius: 10,
		marginBottom: 10,
		alignItems: 'center',
		paddingVertical: 20,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},

	verticalLine: {
		width: '60%',
		height: 1,
		backgroundColor: Colors.border || '#ccc',
		marginVertical: 10,
	},

	settingCardText: {
		fontSize: 16,
		color: Colors.text,
		fontWeight: '500',
		textAlign: 'center',
		textTransform: 'uppercase',
		width: '100%',
	},

	icon: {
		width: 50,
		height: 50,
		resizeMode: 'contain',
	},

	// Skeleton Styles
	skeletonWrapper: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},

	skeletonBox: {
		width: 50,
		height: 50,
		borderRadius: 6,
		backgroundColor: '#e0e0e0',
	},

	skeletonText: {
		width: '70%',
		height: 14,
		backgroundColor: '#e0e0e0',
		borderRadius: 4,
		marginTop: 10,
	},

	// ✅ Version Text Bottom
	versionContainer: {
		position: 'absolute',
		bottom: 10,
		left: 0,
		right: 0,
		alignItems: 'center',
	},

	versionText: {
		fontSize: 14,
		color: Colors.textLight || '#777',
	},
});
