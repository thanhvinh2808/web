"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from '@lib/shared/constants'; // ✅ Dùng hằng số chuẩn

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Khởi tạo socket connection trỏ về server backend
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    setSocket(socketInstance);

    // Cleanup khi component unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// --- Custom Hooks for Real-time Updates ---

export const useOrderUpdates = (userId?: string) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (socket && userId) {
      // Tham gia phòng của người dùng cụ thể
      socket.emit("joinUserRoom", userId);
      console.log(`👤 Joined user room: user:${userId}`);
    }
  }, [socket, userId]);
};

export const useAdminUpdates = (isAdmin: boolean) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (socket && isAdmin) {
      // Tham gia phòng dành cho admin
      socket.emit("joinAdminRoom");
      console.log("👑 Joined admin room");
    }
  }, [socket, isAdmin]);
};