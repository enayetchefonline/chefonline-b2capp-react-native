// lib/utils/ipAddress.js
import * as Network from 'expo-network';

let cachedIp = null;

export async function fetchIpAddressOnce() {
  // ✅ return cached if we already resolved it
  if (cachedIp) return cachedIp;

  // 1) Try local IP
  try {
    const localIp = await Network.getIpAddressAsync();
    if (localIp && localIp !== '0.0.0.0') {
      cachedIp = localIp;
      return cachedIp;
    }
  } catch (e) {
    // ignore, we’ll try public IP
  }

  // 2) Fallback: public IP
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    if (data?.ip) {
      cachedIp = data.ip;
      return cachedIp;
    }
  } catch (e) {
    // ignore
  }

  // 3) Final fallback
  cachedIp = '';
  return cachedIp;
}
