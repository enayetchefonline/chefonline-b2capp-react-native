// lib/utils/restaurantSchedule.js

// ✅ Use UTC as UK time so it matches isRestaurantOpenNow
export const getCurrentApiDateTimeObj = () => {
	const now = new Date();

	// JS UTC day: 0 (Sun) - 6 (Sat) → API: 1-7 (Mon-Sun)
	const jsDay = now.getUTCDay();
	const dayNo = jsDay === 0 ? 7 : jsDay;

	const hours = now.getUTCHours();
	const minutes = now.getUTCMinutes();

	const ampm = hours >= 12 ? 'PM' : 'AM';
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;

	return { dayNo: dayNo.toString(), time: formattedTime };
};

export const convertToMinutes = (timeStr) => {
	const [time, modifier] = timeStr.split(' ');
	let [hours, minutes] = time.split(':').map(Number);
	if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
	if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
	return hours * 60 + minutes;
};

export const getRestaurantScheduleStatus = (scheduleList, currentApiDateTimeObj) => {
	let status = 'CLOSED';
	const todaySchedule = scheduleList.find((day) => day.weekday_id === parseInt(currentApiDateTimeObj.dayNo));

	if (!todaySchedule || !todaySchedule.list?.length) return status;

	const currentMinutes = convertToMinutes(currentApiDateTimeObj.time);
	const shifts = todaySchedule.list.filter((shift) => shift.type === '3');
	if (!shifts.length) return status;

	let pastShifts = 0;
	for (let shift of shifts) {
		const openMinutes = convertToMinutes(shift.opening_time);
		const closeMinutes = convertToMinutes(shift.closing_time);
		if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
			return 'OPEN';
		} else if (currentMinutes > closeMinutes) {
			pastShifts++;
		}
	}

	return pastShifts >= shifts.length ? 'CLOSED' : 'PRE-ORDER';
};

// ✅ Updated to align with UK time + only Collection/Delivery shift (type 3)
//    and to use Collection/Delivery minutes from schedule as lead time.
export const getAvailableTimeSlots = (scheduleList, orderMode, policyTime) => {
	// Current day & time (now in *UK* via UTC)
	const { dayNo, time } = getCurrentApiDateTimeObj();
	const todaySchedule = scheduleList?.find((d) => d.weekday_id === parseInt(dayNo, 10));
	if (!todaySchedule || !Array.isArray(todaySchedule.list)) return [];

	// Normalize mode -> decide which cutoff field to use
	const mode = String(orderMode || '').toLowerCase(); // 'collection' | 'delivery' | others
	const cutoffField =
		mode === 'delivery' ? 'last_time_for_delivery_submit' : 'last_time_for_collection_submit';

	// Minutes "now"
	const nowMins = convertToMinutes(time);
	const policyLead = parseInt(policyTime || 0, 10);
	const safePolicyLead = Number.isFinite(policyLead) ? policyLead : 0;

	// ✅ Only use Collection/Delivery order shifts:
	//    type === '3' and timing_for includes "collection"
	const shifts = todaySchedule.list.filter((s) => {
		if (String(s?.type) !== '3') return false;
		const tf = String(s?.timing_for || '').toLowerCase();
		return tf.includes('collection'); // matches "Collection/Delivery"
	});
	if (shifts.length === 0) return [];

	// Helpers
	const formatMinutesToTime = (mins) => {
		const h24 = Math.floor(mins / 60);
		const m = mins % 60;
		const ampm = h24 >= 12 ? 'PM' : 'AM';
		const h12 = h24 % 12 || 12;
		return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
	};

	const step = 15; // 15-min slots
	const slotSet = new Set();

	for (const shift of shifts) {
		let open = convertToMinutes(shift.opening_time);
		let close = convertToMinutes(shift.closing_time);

		if (Number.isNaN(open) || Number.isNaN(close)) continue;

		// 🔥 Lead time from schedule:
		// For Collection: use shift.Collection (minutes, e.g. "40")
		// For Delivery:   use shift.Delivery
		// Fallback:       policyTime (safePolicyLead)
		const collectionLead = parseInt(shift?.Collection || 0, 10);
		const deliveryLead = parseInt(shift?.Delivery || 0, 10);

		let effectiveLead = safePolicyLead;
		if (mode === 'delivery') {
			if (Number.isFinite(deliveryLead) && deliveryLead > 0) {
				effectiveLead = deliveryLead;
			}
		} else {
			// default: collection
			if (Number.isFinite(collectionLead) && collectionLead > 0) {
				effectiveLead = collectionLead;
			}
		}

		// 👉 Base grid start: opening_time + leadTime
		const baseStart = open + effectiveLead;

		// 👉 Don't offer times before "now + leadTime"
		const earliestFromNow = nowMins + effectiveLead;

		// Earliest start candidate for this shift
		let cursor = Math.max(baseStart, earliestFromNow);

		// Apply per-mode "last time to submit" buffer to closing time
		const cutoff = parseInt(shift?.[cutoffField] || 0, 10);
		if (Number.isFinite(cutoff) && cutoff > 0) {
			close = Math.max(open, close - cutoff);
		}

		// If after adjustment, there is no window, skip this shift
		if (cursor > close) continue;

		// ✅ Align to 15-min grid based on *baseStart*,
		//    so first slot is exactly baseStart (e.g. 12:40)
		const diffFromBase = cursor - baseStart;
		if (diffFromBase > 0) {
			const remainder = diffFromBase % step;
			if (remainder !== 0) {
				cursor += step - remainder;
			}
		}

		// Generate slots up to the (adjusted) close
		while (cursor <= close) {
			slotSet.add(formatMinutesToTime(cursor));
			cursor += step;
		}
	}

	// Return sorted unique slots
	const slots = Array.from(slotSet);
	slots.sort((a, b) => convertToMinutes(a) - convertToMinutes(b));
	return slots;
};

