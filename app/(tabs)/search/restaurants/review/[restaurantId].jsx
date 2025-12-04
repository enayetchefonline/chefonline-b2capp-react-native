import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../../../../constants/color';
import { getReview } from '../../../../../lib/api';

const renderStars = (rating) => {
	let stars = [];
	for (let i = 1; i <= 5; i++) {
		stars.push(<Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={16} color="red" />);
	}
	return stars;
};

const RestaurantReviewScreen = () => {
	const {restaurantId} = useLocalSearchParams();
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchReview = useCallback(async () => {
		setLoading(true);
		try {
			const response = await getReview({restId: restaurantId});
			// console.log("review response", response)
			const filterResponse = response.data.filter(item => item.status === "1");
			// console.log("filterResponse", filterResponse)
			response.data = filterResponse;
			if (response.status === 'Success' && Array.isArray(response.data)) {
				const formatted = response.data.map((item) => ({
					date: item.created_date,
					qualityOfFood: parseInt(item.quality_of_food),
					qualityOfService: parseInt(item.quality_of_service),
					valueOfMoney: parseInt(item.value_of_money),
					reviewComment: item.review_comment,
				}));
				setReviews(formatted);
			}
		} catch (error) {
			console.error('Error fetching reviews:', error);
		} finally {
			setLoading(false);
		}
	}, [restaurantId]);

	useEffect(() => {
		fetchReview();
	}, [restaurantId, fetchReview]);

	const renderItem = ({item}) => (
		
		<View style={styles.reviewContainer}>
			<Text style={styles.dateText}>{item.date}</Text>

			{item.reviewComment && item.reviewComment.trim() !== '' ? (
				<Text style={styles.commnetText}>{item.reviewComment}</Text>
			) : null}

			<View style={styles.ratingsContainer}>
				<View style={styles.ratingRow}>
					<Text style={styles.ratingLabel}>QUALITY OF FOOD</Text>
					<View style={styles.starsContainer}>{renderStars(item.qualityOfFood)}</View>
				</View>
				<View style={styles.ratingRow}>
					<Text style={styles.ratingLabel}>QUALITY OF SERVICE</Text>
					<View style={styles.starsContainer}>{renderStars(item.qualityOfService)}</View>
				</View>
				<View style={styles.ratingRow}>
					<Text style={styles.ratingLabel}>VALUE OF MONEY</Text>
					<View style={styles.starsContainer}>{renderStars(item.valueOfMoney)}</View>
				</View>
			</View>
		</View>
	);

	const renderSkeleton = () => (
		<View style={styles.reviewContainer}>
			<View style={styles.skeletonBox} />
			<View style={[styles.skeletonLine, {width: '80%'}]} />
			<View style={[styles.skeletonLine, {width: '60%'}]} />
			<View style={[styles.skeletonLine, {width: '70%'}]} />
		</View>
	);

	return (
		<View style={styles.container}>
			{loading ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Loading reviews...</Text>
					<ActivityIndicator size="large" color={Colors.primary} />
				</View>
			) : (
				<>
					<Text style={styles.reviewCountText}>Total Reviews: {reviews.length}</Text>
					<FlatList
						data={reviews}
						renderItem={renderItem}
						keyExtractor={(_, index) => index.toString()}
						ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No reviews available.</Text>}
					/>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
		backgroundColor: Colors.background,
	},
	reviewCountText: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 10,
		color: Colors.text,
		textAlign: 'right',
	},
	reviewContainer: {
		backgroundColor: Colors.white,
		padding: 10,
		marginBottom: 10,
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: {width: 0, height: 2},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	commnetText: {
		fontSize: 16,
		color: '#333',
		marginBottom: 10,
	},
	dateText: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#333',
	},
	ratingsContainer: {
		marginTop: 10,
	},
	ratingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	ratingLabel: {
		fontSize: 14,
		color: '#333',
		flex: 1,
	},
	starsContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	skeletonBox: {
		width: '50%',
		height: 16,
		backgroundColor: '#e0e0e0',
		borderRadius: 4,
		marginBottom: 10,
	},
	skeletonLine: {
		height: 12,
		backgroundColor: '#e0e0e0',
		borderRadius: 4,
		marginBottom: 8,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: Colors.text,
		marginBottom: 10,
	},
});

export default RestaurantReviewScreen;
