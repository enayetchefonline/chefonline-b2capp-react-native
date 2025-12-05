import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../../constants/color';
import { getOrderDetail } from '../../../../lib/api';

export default function OrderDetailScreen() {
	const { orderId } = useLocalSearchParams();
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchOrderDetail = async () => {
			try {
				const response = await getOrderDetail({ orderid: orderId });
				// console.log("getOrderDetail reponse", JSON.stringify(response))
				if (Array.isArray(response?.order) && response.order.length > 0) {
					setOrder(response.order[0]);
				}
			} catch (error) {
				console.error('Error loading order details:', error);
			} finally {
				setLoading(false);
			}
		};

		if (orderId) fetchOrderDetail();
	}, [orderId]);

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={{ marginTop: 10, color: Colors.text }}>Loading Order Details...</Text>
			</View>
		);
	}

	if (!order) {
		return (
			<View style={styles.loader}>
				<Text style={{ color: Colors.text }}>No order details found.</Text>
			</View>
		);
	}
	const dishes = order.ordered_dish?.dish_choose || [];	const discount = order.discount?.off?.[0];
	const offer = order.offer?.offer_list?.[0];

	// If discount_amount > 0 → it's a discount
	const isDiscount = Number(order.discount_amount) > 0;

	// If no discount but offer_text exists → it's an offer
	const isOffer = !isDiscount && !!order.offer_text?.trim();


	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.card}>
				{order.logo && <Image source={{ uri: order.logo }} style={styles.logo} />}
				<Text style={styles.orderNo}>ORDER NO - {order.order_no}</Text>
				<Text style={styles.restaurant}>{order.restaurant_name}</Text>

				<View style={styles.rowBetween}>
					<Text style={styles.inOut}>IN: {order.order_time}</Text>
					<Text style={styles.inOut}>OUT: {order.delivery_time}</Text>
				</View>

				<Text style={styles.address}>{order.address1}</Text>
				<Text style={styles.date}>{order.order_date}</Text>

				<View style={styles.tableHeader}>
					<Text style={styles.qty}>QTY</Text>
					<Text style={styles.dish}>DISH</Text>
					<Text style={styles.price}>PRICE</Text>
				</View>

				{dishes.map((item, index) => (
					<View key={index} style={styles.tableRow}>
						<Text style={styles.qty}>{item.quantity} X</Text>
						<Text style={styles.dish}>{item.dish_name}</Text>
						<Text style={styles.price}>£{parseFloat(item.dish_ordered_price).toFixed(2)}</Text>
					</View>
				))}

				<View style={styles.totalRow}>
					<Text style={styles.label}>SUB-TOTAL</Text>
					<Text style={styles.total}>£{parseFloat(order.sub_total).toFixed(2)}</Text>
				</View>

				{!!order.discount_amount && (
					<View style={styles.totalRow}>
						<Text style={styles.label}>DISCOUNT</Text>
						<Text style={styles.total}>-£{parseFloat(order.discount_amount).toFixed(2)}</Text>
					</View>
				)}

				{!!order.voucher_discount_amount && (
					<View style={styles.totalRow}>
						<Text style={styles.label}>VOUCHER</Text>
						<Text style={styles.total}>-£{parseFloat(order.voucher_discount_amount).toFixed(2)}</Text>
					</View>
				)}

				{!!order.delivery_charge && (
					<View style={styles.totalRow}>
						<Text style={styles.label}>DELIVERY CHARGE</Text>
						<Text style={styles.total}>£{parseFloat(order.delivery_charge).toFixed(2)}</Text>
					</View>
				)}

				<View style={[styles.totalRow, { backgroundColor: 'red' }]}>
					<Text style={[styles.label, { color: 'white' }]}>TOTAL</Text>
					<Text style={[styles.total, { color: 'white' }]}>£{parseFloat(order.grand_total).toFixed(2)}</Text>
				</View>

				<View style={styles.footerRow}>
					<Text style={styles.label}>PAYMENT METHOD</Text>
					<Text style={styles.value}>{order.payment_method}</Text>
				</View>
				<View style={styles.footerRow}>
					<Text style={styles.label}>ORDER TYPE</Text>
					<Text style={styles.value}>{order.order_type}</Text>
				</View>

				{isDiscount && !!discount && (
					<View style={styles.footerRow}>
						<Text style={styles.label}>DISCOUNT</Text>
						<Text style={styles.value}>
							{discount.discount_title}
						</Text>
					</View>
				)}

				{isOffer && !!offer && (
					<View style={styles.footerRow}>
						<Text style={styles.label}>OFFER</Text>
						<Text style={styles.value}>
							{/* {offer.offer_title} - {offer.description} */}
							{offer.offer_title}
						</Text>
					</View>
				)}

			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: Colors.background,
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
	logo: {
		width: 100,
		height: 60,
		resizeMode: 'contain',
		alignSelf: 'center',
		marginBottom: 12,
	},
	orderNo: {
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 16,
		marginBottom: 6,
		color: Colors.text,
	},
	restaurant: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	rowBetween: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	inOut: {
		fontSize: 12,
		color: Colors.text,
	},
	address: {
		textAlign: 'center',
		fontSize: 13,
		color: Colors.text,
	},
	date: {
		textAlign: 'center',
		fontSize: 12,
		marginBottom: 12,
		color: Colors.text,
	},
	tableHeader: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderTopWidth: 1,
		paddingVertical: 6,
		marginBottom: 4,
	},
	tableRow: {
		flexDirection: 'row',
		paddingVertical: 4,
	},
	qty: {
		flex: 1,
		fontSize: 13,
		color: Colors.text,
	},
	dish: {
		flex: 4,
		fontSize: 13,
		color: Colors.text,
	},
	price: {
		flex: 2,
		fontSize: 13,
		color: Colors.text,
		textAlign: 'right',
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
		borderTopWidth: 1,
		marginTop: 4,
	},
	label: {
		fontWeight: 'bold',
		fontSize: 13,
	},
	total: {
		fontWeight: 'bold',
		fontSize: 13,
	},
	footerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 6,
	},
	value: {
		fontSize: 13,
		color: Colors.text,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
