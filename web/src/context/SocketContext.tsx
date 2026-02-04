import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToMenuItem: (menuItemId: string) => void;
  unsubscribeFromMenuItem: (menuItemId: string) => void;
  subscribeToRestaurant: (restaurantId: string) => void;
  unsubscribeFromRestaurant: (restaurantId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const newSocket = io('/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToMenuItem = (menuItemId: string) => {
    socket?.emit('subscribeMenuItem', menuItemId);
  };

  const unsubscribeFromMenuItem = (menuItemId: string) => {
    socket?.emit('unsubscribeMenuItem', menuItemId);
  };

  const subscribeToRestaurant = (restaurantId: string) => {
    socket?.emit('subscribeRestaurant', restaurantId);
  };

  const unsubscribeFromRestaurant = (restaurantId: string) => {
    socket?.emit('unsubscribeRestaurant', restaurantId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        subscribeToMenuItem,
        unsubscribeFromMenuItem,
        subscribeToRestaurant,
        unsubscribeFromRestaurant,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
}
