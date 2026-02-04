import { Server, Socket } from 'socket.io';

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join room for menu item updates
    socket.on('subscribeMenuItem', (menuItemId: string) => {
      socket.join(`menuItem:${menuItemId}`);
      console.log(`Socket ${socket.id} subscribed to menuItem:${menuItemId}`);
    });

    // Leave room
    socket.on('unsubscribeMenuItem', (menuItemId: string) => {
      socket.leave(`menuItem:${menuItemId}`);
    });

    // Join room for restaurant updates
    socket.on('subscribeRestaurant', (restaurantId: string) => {
      socket.join(`restaurant:${restaurantId}`);
      console.log(`Socket ${socket.id} subscribed to restaurant:${restaurantId}`);
    });

    // Leave restaurant room
    socket.on('unsubscribeRestaurant', (restaurantId: string) => {
      socket.leave(`restaurant:${restaurantId}`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper function to emit events (can be imported in routes)
export function emitNewReview(
  io: Server, 
  menuItemId: string, 
  restaurantId: string, 
  review: any
) {
  io.to(`menuItem:${menuItemId}`).emit('newReview', { review });
  io.to(`restaurant:${restaurantId}`).emit('newReview', { review, menuItemId });
}

export function emitRatingUpdate(
  io: Server,
  menuItemId: string,
  restaurantId: string,
  ratings: {
    avgRating: number | null;
    totalReviews: number;
  }
) {
  io.to(`menuItem:${menuItemId}`).emit('ratingUpdate', { menuItemId, ...ratings });
  io.to(`restaurant:${restaurantId}`).emit('menuItemRatingUpdate', { menuItemId, ...ratings });
}
