// lib/utils/restaurantSchedule.js
export const getCurrentApiDateTimeObj = () => {
	const now = new Date();
	const dayNo = now.getDay() === 0 ? 7 : now.getDay();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
	return {dayNo: dayNo.toString(), time: formattedTime};
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

export const getAvailableTimeSlots = (scheduleList, orderMode, policyTime) => {
	// Current day & time (use your helper so it matches the rest of your app)
	const now = new Date();
	const {dayNo, time} = getCurrentApiDateTimeObj();
	const todaySchedule = scheduleList?.find((d) => d.weekday_id === parseInt(dayNo, 10));
	if (!todaySchedule || !Array.isArray(todaySchedule.list)) return [];

	// Normalize mode -> decide which cutoff field to use
	const mode = String(orderMode || '').toLowerCase(); // 'collection' | 'delivery' | others
	const cutoffField = mode === 'delivery' ? 'last_time_for_delivery_submit' : 'last_time_for_collection_submit';

	// Earliest minute we can offer: now + policy lead time (in minutes)
	const nowMins = convertToMinutes(time); // uses your exported helper
	const leadTime = parseInt(policyTime || 0, 10);
	const earliestAllowed = nowMins + (isFinite(leadTime) ? leadTime : 0);

	// Take ALL shifts for today that (a) are order shifts (type === '3') and (b) have this mode configured
	const shifts = todaySchedule.list.filter(
		(s) => String(s?.type) === '3' && s?.[orderMode] !== undefined && s?.[`${orderMode}_policy_id`] !== undefined
	);
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

		// Apply per-mode "last time to submit" buffer to closing time
		const cutoff = parseInt(shift?.[cutoffField] || 0, 10);
		if (isFinite(cutoff) && cutoff > 0) {
			close = Math.max(open, close - cutoff);
		}

		// Earliest start in this shift is max(open, earliestAllowed)
		let cursor = Math.max(open, earliestAllowed);

		// Round up to next step
		const rem = cursor % step;
		if (rem !== 0) cursor += step - rem;

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


