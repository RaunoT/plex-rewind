'use client'

import usePrefersReducedMotion from '@/hooks/usePrefersReducedMotion'
import { useEffect, useRef } from 'react'

type Flake = {
  x: number
  y: number
  radius: number
  // Pixels per second
  speed: number
  sway: number
  phase: number
  opacity: number
}

// One flake per this many square pixels, up to the most
const AREA_PER_FLAKE = 9000
const MAX_FLAKES = 150

function createFlake(width: number, height: number): Flake {
  const radius = 1 + Math.random() * 2.5

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius,
    // Bigger flakes are nearer, so they fall faster
    speed: 15 + radius * 12 + Math.random() * 10,
    sway: 8 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.25 + Math.random() * 0.5,
  }
}

// Falls behind the stories, over the card's background
export default function Snow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context || prefersReducedMotion) {
      return
    }

    let width = 0
    let height = 0
    let flakes: Flake[] = []
    let frame = 0
    let last = performance.now()

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      const count = Math.min(
        Math.round((width * height) / AREA_PER_FLAKE),
        MAX_FLAKES,
      )

      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      // Keeps the flakes already falling, so a resize doesn't restart them
      flakes = [
        ...flakes.slice(0, count),
        ...Array.from({ length: Math.max(count - flakes.length, 0) }, () =>
          createFlake(width, height),
        ),
      ]
    }
    const draw = (now: number) => {
      // A hidden tab stops the frames, so a long gap is treated as one frame
      const seconds = Math.min((now - last) / 1000, 0.1)

      last = now
      context.clearRect(0, 0, width, height)
      context.fillStyle = '#fff'

      for (const flake of flakes) {
        flake.y += flake.speed * seconds
        flake.phase += seconds

        if (flake.y - flake.radius > height) {
          flake.y = -flake.radius
          flake.x = Math.random() * width
        }

        const x = flake.x + Math.sin(flake.phase) * flake.sway

        context.globalAlpha = flake.opacity
        context.beginPath()
        context.arc(x, flake.y, flake.radius, 0, Math.PI * 2)
        context.fill()
      }

      frame = requestAnimationFrame(draw)
    }
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
      resize()
    })

    observer.observe(canvas)
    frame = requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className='pointer-events-none absolute inset-0 size-full rounded-3xl'
      aria-hidden='true'
    />
  )
}
