// hooks/useIpAddress.js
import { useEffect, useState } from 'react';
import { fetchIpAddressOnce } from '../lib/utils/ipAddress';

export function useIpAddress() {
  const [ipAddress, setIpAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const ip = await fetchIpAddressOnce();
      if (isMounted) {
        setIpAddress(ip);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return { ipAddress, loading };
}
