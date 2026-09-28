// El componente <brain-mascot> es un custom element (public/mascota/brain-mascot.js),
// no un componente de React. Se declara en el namespace JSX global para poder usarlo
// con tipos. @types/react 18 declara JSX en el namespace global; React 19 lo mueve a
// React.JSX, así que se declaran los dos para no depender de cuál resuelva.
import type React from "react"

export type MascotState =
  | "idle"
  | "hello"
  | "review"
  | "thinking"
  | "loading"
  | "chat"
  | "success"
  | "error"
  | "listening"
  | "alert"
  | "confused"
  | "sleep"

interface BrainMascotAttributes extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>
  state?: MascotState
  speed?: string | number
  assets?: string
  "data-paused"?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "brain-mascot": BrainMascotAttributes
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "brain-mascot": BrainMascotAttributes
    }
  }
}
