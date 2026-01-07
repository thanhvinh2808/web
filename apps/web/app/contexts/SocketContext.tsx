// context/SocketContext.tsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // ✅ Chỉ kết nối khi đang ở client-side
    if (typeof window === 'undefined') return;

    console.log('🔌 Connecting to Socket.io server:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      // ✅ Thêm autoConnect
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
      
      // ✅ Không hiển thị error nếu backend chưa chạy
      if (error.message.includes('xhr poll error')) {
        console.warn('⚠️ Backend chưa chạy hoặc không thể kết nối');
      }
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    return () => {
      console.log('🔌 Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook for listening to order updates
export function useOrderUpdates(userId?: string, onUpdate?: (order: any) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderUpdate = (data: any) => {
      console.log('📦 Order updated:', data);
      if (onUpdate) {
        onUpdate(data.order);
      }
    };

    socket.on('orderStatusUpdated', handleOrderUpdate);

    if (userId) {
      socket.emit('joinUserRoom', userId);
    }

    return () => {
      socket.off('orderStatusUpdated', handleOrderUpdate);
    };
  }, [socket, isConnected, userId, onUpdate]);

  return { socket, isConnected };
}