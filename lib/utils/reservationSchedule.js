// lib/utils/reservationSchedule.js

// "12:00 PM" -> minutes since midnight
const parseTimeToMinutes = (timeStr) => {
	if (!timeStr) return null;
	const [timePart, period] = timeStr.split(' ');
	if (!timePart || !period) return null;

	let [hours, minutes] = timePart.split(':').map(Number);
	const up = period.toUpperCase();

	if (up === 'PM' && hours !== 12) hours += 12;
	if (up === 'AM' && hours === 12) hours = 0;

	return hours * 60 + minutes;
};

// minutes -> "12:00 PM"
const formatMinutesToTime = (mins) => {
	const h24 = Math.floor(mins / 60);
	const m = mins % 60;
	const ampm = h24 >= 12 ? 'PM' : 'AM';
	const h12 = h24 % 12 || 12;
	return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Generate reservation time slots for a given date (DD-MM-YYYY or DD/MM/YYYY)
 */
export const getReservationTimeSlots = (scheduleList, dateStr) => {
	if (!dateStr || !Array.isArray(scheduleList) || !scheduleList.length) return [];

	// ✅ Parse DD-MM-YYYY or DD/MM/YYYY
	const [dd, mm, yyyy] = dateStr.split(/[-/]/).map(Number);
	if (!dd || !mm || !yyyy) return [];

	const selectedDate = new Date(yyyy, mm - 1, dd);
	const jsDay = selectedDate.getDay(); // 0–6 (Sun=0)
	const weekdayId = jsDay === 0 ? 7 : jsDay; // 1–7 (Mon–Sun)

	const daySchedule = scheduleList.find((d) => d.weekday_id === weekdayId);
	if (!daySchedule || !Array.isArray(daySchedule.list)) return [];

	// Pick only reservation-type shifts
	const reservationShifts = daySchedule.list.filter((s) => {
		if (String(s?.type) === '4') return true;
		return String(s?.timing_for || '').toLowerCase().includes('reservation');
	});
	if (!reservationShifts.length) return [];

	// 🔥 UK "today" & "now" using UTC
	const now = new Date();
	const ukYear = now.getUTCFullYear();
	const ukMonth = now.getUTCMonth();
	const ukDay = now.getUTCDate();

	const isToday =
		ukYear === yyyy &&
		ukMonth === (mm - 1) &&
		ukDay === dd;

	const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

	const step = 15;
	const slots = [];

	for (const shift of reservationShifts) {
		let open = parseTimeToMinutes(shift.opening_time);
		let close = parseTimeToMinutes(shift.closing_time);
		if (open == null || close == null) continue;

		// handle cross-midnight like 6PM–2AM
		if (close < open) close += 24 * 60;

		for (let mins = open; mins <= close; mins += step) {
			let cmpMins = mins;
			if (cmpMins >= 24 * 60) cmpMins -= 24 * 60;

			// ❌ Never show past time for today (in UK)
			if (isToday && cmpMins <= nowMinutes) continue;

			slots.push(formatMinutesToTime(cmpMins));
		}
	}

	const unique = Array.from(new Set(slots));
	unique.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));

	return unique;
};
