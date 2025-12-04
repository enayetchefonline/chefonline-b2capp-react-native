import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import Colors from '../../../../../constants/color';

const RestaurantInfoScreen = () => {
	const storeRestaurantDetail = useSelector((state) => state.restaurantDetail.data);
	const schedule = storeRestaurantDetail?.restuarent_schedule?.schedule || [];
	const isReservationOn = storeRestaurantDetail?.accept_reservation === "1";

	// console.log("isReservationOn:", isReservationOn);

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			{/* Address Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>ADDRESS</Text>
				<Text style={styles.text}>{storeRestaurantDetail?.address || 'Address not available'}</Text>
			</View>

			{/* Opening Hours Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>OPENING HOURS</Text>
				{schedule.length > 0 ? (
					schedule.map((day, index) => (
						<View key={index} style={styles.hoursContainer}>
							<Text style={styles.hoursDay}>{day.day_name}</Text>
							{day.list.length > 0 ? (
								day.list
									// hide reservation slots when reservation is off
									.filter(slot => isReservationOn || slot.timing_for !== 'Reservation')
									.map((slot, idx) => (
										<View key={idx} style={styles.slotContainer}>
											<Text style={styles.timingType}>{slot.timing_for}</Text>
											<Text style={styles.hours}>
												{slot.opening_time} - {slot.closing_time}
											</Text>
										</View>
									))
							) : (
								<Text style={styles.hours}>Closed</Text>
							)}
						</View>
					))
				) : (
					<Text style={styles.text}>Opening hours not available</Text>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollContainer: {
		padding: 15,
		backgroundColor: Colors.background,
		paddingBottom: 30,
	},
	section: {
		marginBottom: 20,
		backgroundColor: Colors.white,
		padding: 15,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#DDD',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	text: {
		fontSize: 16,
		color: '#333',
	},
	hoursContainer: {
		marginBottom: 15,
	},
	hoursDay: {
		fontSize: 16,
		fontWeight: '600',
		color: '#000',
		marginBottom: 4,
	},
	slotContainer: {
		marginLeft: 10,
		marginBottom: 5,
	},
	timingType: {
		fontSize: 14,
		color: Colors.primary,
		fontWeight: '600',
	},
	hours: {
		fontSize: 14,
		color: '#333',
		marginLeft: 5,
	},
});

export default RestaurantInfoScreen;
