import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3000';

// This is a custom React hook.
// A "hook" is just a function that starts with "use" and contains
// React logic (like state or effects) that you want to reuse.
// Instead of writing socket connection code in every component,
// we write it once here and call useSocket() anywhere we need it.

export function useSocket(hotelId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Create the socket connection
    socketRef.current = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      if (hotelId) {
        socketRef.current.emit('join_hotel', hotelId);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    // Cleanup: disconnect when component unmounts
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Returns the socket instance and connection status
  return { socket: socketRef.current, connected };
}

// Separate constant for backend URL — used in fetch() calls
export const API = BACKEND_URL;
