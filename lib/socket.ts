import { io } from 'socket.io-client'

const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
  autoConnect: false
})

export default socket