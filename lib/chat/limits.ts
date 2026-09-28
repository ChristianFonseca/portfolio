// Límites del chat que comparten el servidor y el widget. Módulo puro, sin
// dependencias de servidor, para que el cliente lo pueda importar: si cambian
// aquí cambian en los dos lados, en vez de repetir el número a mano.

export const CHAT_MESSAGE_MAX = 500
// El widget manda como mucho 9 turnos; el servidor acepta 10.
export const CHAT_HISTORY_TURNS = 10
// Cada turno del historial se recorta a esto antes de llegar al modelo.
export const CHAT_HISTORY_TURN_CHARS = 1200
