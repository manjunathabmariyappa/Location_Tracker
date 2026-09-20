import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
export const useNetworkStatus = () => { const [online, setOnline] = useState(true); useEffect(() => NetInfo.addEventListener(state => setOnline(Boolean(state.isConnected))), []); return online; };
