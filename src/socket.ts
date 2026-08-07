import { io, Socket } from 'socket.io-client';

// Single shared socket connection for the whole app (same-origin, so no URL needed).
// Server emits: order:new, order:updated, waiterCall:new, waiterCall:updated
export const socket: Socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});
