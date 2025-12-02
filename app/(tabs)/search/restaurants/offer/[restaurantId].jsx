import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSelector } from 'react-redux';
import Colors from '../../../../../constants/color';

export default function OfferScreen() {
	const { width: screenWidth } = useWindowDimensions();

	const offerData = useSelector((state) => state.cart.offer);
	const discountData = useSelector((state) => state.cart.discount);

	console.log('offerData', offerData);
	console.log('discountData', discountData);

	const offers = offerData?.offer_list || [];
	const discounts = discountData?.off || [];

	const hasOffers = offers.length > 0;
	const hasDiscounts = discounts.length > 0;

	// 🔹 Helper to render any HTML string
	const renderHtml = (htmlString, baseStyle) => {
		if (!htmlString) return null;
		return (
			<RenderHTML
				contentWidth={screenWidth - 32} // padding 16 on each side
				source={{ html: htmlString }}
				baseStyle={baseStyle}
				// tagsStyles={{
				// 	b: { fontWeight: 'bold' },
				// 	strong: { fontWeight: 'bold' },
				// 	i: { fontStyle: 'italic' },
				// 	u: { textDecorationLine: 'underline' },
				// 	br: { marginBottom: 4 },
				// }}
			/>
		);
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			{hasOffers && (
				<>
					<Text style={styles.sectionTitle}>Available Offers</Text>
					{offers.map((offer) => (
						<View key={offer.id} style={styles.card}>
							{/* HTML title */}
							{renderHtml(offer.offer_title, styles.title)}
							{/* HTML description */}
							{renderHtml(offer.offer_description, styles.description)}

							<Text style={styles.meta}>Min Amount: £{offer.eligible_amount}</Text>
						</View>
					))}
				</>
			)}

			{hasDiscounts && (
				<>
					<Text style={[styles.sectionTitle, { marginTop: hasOffers ? 24 : 0 }]}>
						Available Discounts
					</Text>
					{discounts.map((discount) => (
						<View key={discount.discount_id} style={styles.card}>
							{/* HTML title */}
							{renderHtml(discount.discount_title, styles.title)}
							{/* HTML description */}
							{renderHtml(discount.discount_description, styles.description)}

							<Text style={styles.meta}>
								{discount.discount_type === 'Percentage'
									? `Discount: ${discount.discount_amount}%`
									: `Discount: £${discount.discount_amount}`}
							</Text>
							<Text style={styles.meta}>Min Amount: £{discount.eligible_amount}</Text>
						</View>
					))}
				</>
			)}

			{!hasOffers && !hasDiscounts && (
				<Text style={styles.empty}>No offers or discounts available.</Text>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: Colors.background,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 12,
		color: Colors.text,
	},
	card: {
		backgroundColor: Colors.white,
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	// used as baseStyle for HTML title
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
		color: Colors.primary,
	},
	// used as baseStyle for HTML description
	description: {
		fontSize: 14,
		color: Colors.text,
		marginBottom: 4,
	},
	meta: {
		fontSize: 12,
		color: Colors.text,
	},
	empty: {
		color: Colors.text,
		fontSize: 14,
		opacity: 0.6,
		textAlign: 'center',
		marginTop: 40,
	},
});
