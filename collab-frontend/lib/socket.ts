import { io } from "socket.io-client";

// Single connection for the lifetime of the app.
// autoConnect: true means it connects once when the module is first imported.
export const socket = io("http://localhost:5000", { autoConnect: false });