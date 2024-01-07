declare module 'vanta/dist/vanta.fog.min'

declare module 'three'

type VantaEffect = {
  destroy: () => void
  resize: () => void
} | null
