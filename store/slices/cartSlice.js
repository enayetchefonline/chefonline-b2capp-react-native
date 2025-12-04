// slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
	name: 'cart',
	initialState: {
		items: {},
		restaurantId: null,
		restaurantName: null,
		discount: {},
		offer: {},
		order_policy: {},
		note: '',
		voucher: {},
		postCodeCharge: {},
		carryBag: {},
		order_mode: null, // Collection or Delivery
		address: '',
		city: '',
		postcode: '',
		selected_discount_id: '',
		selected_offer_id: '',
		pre_order_delivery_time: '',
		searchText: '', // 🔧 add this
		selectedCuisine: 'all', // 🔧 add this
		orderType: 'takeaway', // 🔧 add this
	},
	reducers: {
		addItemToCart: (state, action) => {
			const item = action.payload;
			if (!item) return;

			const id = item.dish_id;
			if (!id) return;

			// ⭐ SPECIAL CASE: CARRY BAG
			if (id === 'carry_bag') {
				// If carry_bag DOES NOT exist -> add it with quantity 1
				if (!state.items[id]) {
					state.items[id] = {
						item,
						quantity: 1,
					};
				} else {
					// If it already exists -> DO NOT increment quantity
					// (optional) keep latest price/name from API
					state.items[id].item = item;
				}
				return;
			}

			// 🔁 NORMAL ITEMS
			const existingItem = state.items[id];
			if (existingItem) {
				existingItem.quantity += 1;
			} else {
				state.items[id] = {
					item,
					quantity: 1,
				};
			}
		},

		updateItemQuantity: (state, action) => {
			const { itemId, quantity } = action.payload;
			if (quantity < 1) {
				delete state.items[itemId];
			} else if (state.items[itemId]) {
				state.items[itemId].quantity = quantity;
			}
		},
		setRestaurantId: (state, action) => {
			state.restaurantId = action.payload;
		},
		setRestaurantName: (state, action) => {
			state.restaurantName = action.payload;
		},
		setDiscount: (state, action) => {
			state.discount = action.payload;
		},
		setOffer: (state, action) => {
			state.offer = action.payload;
		},
		setOrderPolicy: (state, action) => {
			state.order_policy = action.payload;
		},
		setCart: (state, action) => {
			state.items = action.payload.items;
			state.restaurantId = action.payload.restaurantId;
			state.restaurantName = action.payload.restaurantName ?? null;
			state.discount = action.payload.discount ?? {};
			state.offer = action.payload.offer ?? {};
			state.order_policy = action.payload.order_policy ?? {};
		},
		setCarryBag: (state, action) => {
			state.carryBag = action.payload;
		},
		clearCart: (state) => {
			state.items = {};
			state.restaurantId = null;
			state.restaurantName = null;
			state.discount = {};
			state.offer = {};
			state.order_policy = {};
			state.note = '';
			state.voucher = {};
			state.postCodeCharge = {};
			state.order_mode = null;
			state.address = '';
			state.city = '';
			state.postcode = '';
			state.selected_discount_id = '';
			state.selected_offer_id = '';
			state.pre_order_delivery_time = '';
			state.carryBag = {};
		},
		setPostCodeCharge: (state, action) => {
			state.postCodeCharge = action.payload;
		},
		setOrderMode: (state, action) => {
			state.order_mode = action.payload;
		},
		setDeliveryInfo: (state, action) => {
			const { address, city, postcode } = action.payload;
			state.address = address;
			state.city = city;
			state.postcode = postcode;
		},
		setSpecialNote: (state, action) => {
			state.note = action.payload;
		},
		setVoucher: (state, action) => {
			state.voucher = action.payload;
		},
		removeVoucher: (state) => {
			state.voucher = {};
		},
		setSelectedRestaurantDiscountId: (state, action) => {
			state.selected_discount_id = action.payload;
		},
		setSelectedRestaurantOfferId: (state, action) => {
			state.selected_offer_id = action.payload;
		},
		setPreOrderDeliveryTime: (state, action) => {
			state.pre_order_delivery_time = action.payload;
		},
		setUserAddress: (state, action) => {
			state.address = action.payload;
		},
		setUserPostcode: (state, action) => {
			state.postcode = action.payload;
		},
		setUserCity: (state, action) => {
			state.city = action.payload;
		},
		setSearchText: (state, action) => {
			state.searchText = action.payload;
		},
		setCuisine: (state, action) => {
			state.selectedCuisine = action.payload;
		},
		setOrderType: (state, action) => {
			state.orderType = action.payload;
		},
	},
});

export const {
	addItemToCart,
	updateItemQuantity,
	setRestaurantId,
	setRestaurantName,
	setDiscount,
	setOffer,
	setOrderPolicy,
	setCart,
	setCarryBag,
	clearCart,
	setPostCodeCharge,
	setOrderMode,
	setDeliveryInfo,
	setSpecialNote,
	setVoucher,
	removeVoucher,
	setSelectedRestaurantDiscountId,
	setSelectedRestaurantOfferId,
	setPreOrderDeliveryTime,
	setUserAddress,
	setUserPostcode,
	setUserCity,
	setSearchText,
	setCuisine,
	setOrderType,
} = cartSlice.actions;

export default cartSlice.reducer;
