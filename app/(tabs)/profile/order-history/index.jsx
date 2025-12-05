import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CustomButton from '../../../../components/ui/CustomButton';
import CustomPopUp from '../../../../components/ui/CustomPopUp';
import Colors from '../../../../constants/color';
import { getOrderList, reviewSubmit } from '../../../../lib/api';

// ⭐ For read-only star display
const STARS = [1, 2, 3, 4, 5];

export default function OrderHistoryScreen() {
    const router = useRouter();
    const authUser = useSelector((state) => state.auth.user);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐ Rating popup state
    const [ratingVisible, setRatingVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null); // { orderId, restaurantId }

    const [foodRating, setFoodRating] = useState(0);
    const [serviceRating, setServiceRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);
    const [comment, setComment] = useState('');

    const [submittingRating, setSubmittingRating] = useState(false);

    // ⭐ Success popup
    const [successVisible, setSuccessVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchOrders = async () => {
        if (!authUser?.userid) return;

        try {
            setLoading(true);
            const response = await getOrderList({ userid: authUser?.userid });

            console.log('getOrderList', JSON.stringify(response));

            if (Array.isArray(response?.orders)) {
                setOrders(response.orders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error('Failed to fetch order list:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

	useEffect(() => {
		fetchOrders();
	}, [!authUser?.userid]);

    // ⭐ Shared star renderer (for popup)
    const stars = [1, 2, 3, 4, 5];
    const renderStars = (rating, setRating) => (
        <View style={styles.starRow}>
            {stars.map((i) => (
                <TouchableOpacity
                    key={i}
                    onPress={() => setRating(i)}
                    disabled={submittingRating}
                >
                    <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={22}
                        color={Colors.primary}
                        style={styles.starIcon}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    // ⭐ Open rating popup
    const handleOpenRating = (order) => {
        setSelectedOrder({
            orderId: order.order_no,
            restaurantId: order.rest_id,
        });

        // reset form
        setFoodRating(0);
        setServiceRating(0);
        setValueRating(0);
        setComment('');

        setRatingVisible(true);
    };

    // ⭐ Submit rating from popup
    const handleSubmitRating = async () => {
        if (!selectedOrder || !authUser?.userid) return;

        setSubmittingRating(true);

        try {
            const response = await reviewSubmit({
                orderId: selectedOrder.orderId,
                restId: selectedOrder.restaurantId,
                qualityOfFood: foodRating,
                qualityOfService: serviceRating,
                valueOfMoney: valueRating,
                reviewComment: comment,
            });

			console.log('reviewSubmit', JSON.stringify(response));

            if (response?.msg?.toLowerCase().includes('success')) {
                setRatingVisible(false);
                setSuccessMessage(response.msg || 'Review submitted successfully.');
                setSuccessVisible(true);

                // 🔁 Refresh order list
                await fetchOrders();
            } else {
                alert(response?.msg || 'Something went wrong!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const renderItem = ({ item }) => {
        const reviewStatus = item?.review_status || {};

        const isReviewed =
            reviewStatus?.rating_comment_status === true ||
            reviewStatus?.rating_status === true;

        const food = Number(reviewStatus?.quality_of_food) || 0;
        const service = Number(reviewStatus?.quality_of_service) || 0;
        const value = Number(reviewStatus?.value_of_money) || 0;

        const hasDetailedRating = food > 0 || service > 0 || value > 0;
        const avgRating = hasDetailedRating ? (food + service + value) / 3 : 0;
        const roundedRating = Math.round(avgRating);

        return (
            <Pressable
                onPress={() =>
                    router.push({
                        pathname: '/profile/order-detail',
                        params: { orderId: item.order_no },
                    })
                }
                style={styles.card}
            >
                <View style={styles.row}>
                    <Text style={styles.restaurant}>{item.restaurant_name}</Text>
                    <Text style={styles.orderId}>ORDER ID - {item.order_no}</Text>
                </View>

                <View style={styles.divider} />

                <View style={[styles.row, styles.justifyBetween]}>
                    <View style={styles.row}>
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color={Colors.primary}
                            style={styles.iconSmall}
                        />
                        <Text style={styles.address}>{item.postcode}</Text>
                    </View>
                    <Text style={styles.date}>{item.order_date}</Text>
                </View>

                <View style={[styles.row, styles.justifyBetween, styles.mt4]}>
                    <Text style={styles.times}>
                        IN: {item.order_time} | OUT: {item.delivery_time}
                    </Text>
                </View>

                <View style={[styles.row, styles.mt4]}>
                    <View style={styles.row}>
                        <Ionicons
                            name="bag-check-outline"
                            size={16}
                            color={Colors.primary}
                            style={styles.iconSmall}
                        />
                        <Text style={styles.type}>{item.order_type}</Text>
                    </View>
                    <Text style={styles.cash}>
                        Paid: £{parseFloat(item.grand_total || 0).toFixed(2)}
                    </Text>
                </View>

                <View style={[styles.row, styles.buttonRow]}>
                    {isReviewed ? (
                        <View style={styles.reviewPill}>
                            <View style={styles.starRow}>
                                {STARS.map((i) => (
                                    <Ionicons
                                        key={i}
                                        name={i <= roundedRating ? 'star' : 'star-outline'}
                                        size={18}
                                        color={Colors.primary}
                                        style={styles.starIcon}
                                    />
                                ))}
                            </View>
                            <Text style={styles.reviewText}>
                                {hasDetailedRating
                                    ? `${avgRating.toFixed(1)} / 5`
                                    : 'Reviewed'}
                            </Text>
                        </View>
                    ) : (
                        <CustomButton
                            title="REVIEW & RATING"
                            iconName="star-outline"
                            onPress={() => handleOpenRating(item)}
                            containerStyle={styles.btnHalf}
                        />
                    )}
                </View>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10, color: Colors.text }}>
                    Loading Order History...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* <Text style={styles.title}>Total Orders: {orders.length}</Text> */}

            <FlatList
                data={orders}
                keyExtractor={(item) =>
                    item.id?.toString() ||
                    item.orderId?.toString() ||
                    item.order_no?.toString()
                }
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ color: Colors.text }}>No orders found.</Text>
                    </View>
                }
            />

            {/* ⭐ Rating Modal */}
            <Modal
                visible={ratingVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (!submittingRating) setRatingVisible(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Rate your order</Text>

                        <View style={styles.modalRow}>
                            <View style={styles.ratingItem}>
                                <Text style={styles.label}>QUALITY OF FOOD</Text>
                                {renderStars(foodRating, setFoodRating)}
                            </View>

                            <View style={styles.ratingItem}>
                                <Text style={styles.label}>QUALITY OF SERVICE</Text>
                                {renderStars(serviceRating, setServiceRating)}
                            </View>

                            <View style={styles.ratingItem}>
                                <Text style={styles.label}>VALUE OF MONEY</Text>
                                {renderStars(valueRating, setValueRating)}
                            </View>
                        </View>

                        <TextInput
                            style={styles.commentInput}
                            placeholder="Write From Here..."
                            placeholderTextColor={Colors.placeholder}
                            multiline
                            value={comment}
                            onChangeText={setComment}
                            editable={!submittingRating}
                        />

                        <View style={styles.modalButtons}>
                            <CustomButton
                                title="CANCEL"
                                onPress={() => !submittingRating && setRatingVisible(false)}
                                containerStyle={[styles.btnHalf, { marginRight: 8 }]}
                            />
                            <CustomButton
                                title="SUBMIT"
                                iconName="send-outline"
                                loading={submittingRating}
                                loadingText="Submitting…"
                                onPress={handleSubmitRating}
                                disabled={submittingRating || !comment.trim()}
                                containerStyle={styles.btnHalf}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ⭐ Success popup */}
            <CustomPopUp
                visible={successVisible}
                title="Thank you!"
                message={successMessage}
                confirmText="OK"
                showCancel={false}
                maskClosable={false}
                onConfirm={() => setSuccessVisible(false)}
                onCancel={() => setSuccessVisible(false)}
            />
        </View>
    );
}
const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	title: {
		fontWeight: 'bold',
		color: Colors.text,
		marginTop: 20,
		marginBottom: 10,
		textAlign: 'right',
		paddingRight: 20,
	},
	list: {
		padding: 16,
	},
	card: {
		backgroundColor: Colors.white,
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 10,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	justifyBetween: {
		justifyContent: 'space-between',
	},
	restaurant: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
	},
	orderId: {
		fontSize: 12,
		color: Colors.text,
	},
	iconSmall: {
		marginRight: 6,
	},
	address: {
		fontSize: 14,
		color: Colors.text,
	},
	date: {
		fontSize: 12,
		color: Colors.text,
	},
	times: {
		fontSize: 12,
		color: Colors.text,
	},
	cash: {
		fontSize: 12,
		color: Colors.text,
	},
	type: {
		fontSize: 14,
		color: Colors.primary,
		marginLeft: 4,
	},
	mt4: {
		marginTop: 8,
	},
	buttonRow: {
		justifyContent: 'flex-end',
		marginTop: 12,
	},
	btnHalf: {
		width: '48%',
	},
	divider: {
		width: '100%',
		height: 1,
		backgroundColor: Colors.border || '#ccc',
		marginVertical: 12,
	},
	empty: {
		marginTop: 80,
		alignItems: 'center',
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},

	// ⭐ rating pill
	reviewPill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		backgroundColor: Colors.background || '#f5f5f5',
		flexDirection: 'row',
		alignItems: 'center',
	},
	starRow: {
		flexDirection: 'row',
		marginRight: 6,
	},
	starIcon: {
		marginRight: 2,
	},
	reviewText: {
		fontSize: 12,
		color: Colors.text,
	},

	// ⭐ modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalCard: {
		width: '100%',
		backgroundColor: Colors.white,
		borderRadius: 10,
		padding: 16,
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 12,
		textAlign: 'center',
	},
	modalRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		flexWrap: 'wrap',
		alignItems: 'center',
		// backgroundColor: Colors.dangerLight,
		padding: 12,
		borderRadius: 6,
		marginBottom: 12,
		textAlign: 'center',
		gap: 12,
	},
	ratingItem: {
		// flex: 0.48,
		marginBottom: 12,
	},
	label: {
		fontSize: 12,
		color: Colors.text,
		marginBottom: 6,
	},
	center: {
		alignItems: 'center',
	},
	commentInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 4,
		padding: 10,
		minHeight: 80,
		textAlignVertical: 'top',
		color: Colors.text,
		marginTop: 8,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 16,
	},
});
