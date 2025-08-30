"use client"

import { IconChevronBackward, IconChevronForward } from "@/components/icons"
import { cn } from "@/lib/utils/common"
import Image from "next/image"
import type { ComponentPropsWithoutRef } from "react"
import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useState } from "react"

export type CarouselHandle = {
  next: () => void
  prev: () => void
}

type CarouselProps = {
  autoPlay?: boolean
  height?: string
  images: string[]
  interval?: number
  width?: string
} & ComponentPropsWithoutRef<"div">

const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ autoPlay = true, className, images, interval = 3000, ...props }, ref) => {
    const [index, setIndex] = useState(0)
    const length = images.length

    const next = useCallback(() => {
      setIndex((prev) => (prev + 1) % length)
    }, [length])

    const prev = useCallback(() => {
      setIndex((prev) => (prev - 1 + length) % length)
    }, [length])

    const goTo = useCallback((i: number) => {
      setIndex(i)
    }, [])

    useImperativeHandle(ref as Ref<CarouselHandle>, () => ({
      next,
      prev,
    }))

    useEffect(() => {
      if (!autoPlay) return
      const timer = setInterval(next, interval)
      return () => clearInterval(timer)
    }, [autoPlay, interval, next])

    return (
      <div
        ref={ref}
        className={cn("relative aspect-video h-[400px] w-full overflow-hidden", className)}
        {...props}
      >
        <div className="relative h-full w-full">
          <Image
            src={images[index]}
            alt={`Slide ${index + 1}`}
            className="object-cover"
            fill
            sizes="100vw"
          />
        </div>

        <CarouselArrow direction="left" onClick={prev} />
        <CarouselArrow direction="right" onClick={next} />

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              className={cn(
                "size-2 rounded-full bg-white/60 hover:bg-white",
                i === index && "bg-white"
              )}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    )
  }
)

Carousel.displayName = "Carousel"

type ArrowProps = {
  direction: "left" | "right"
} & ComponentPropsWithoutRef<"button">

const CarouselArrow = forwardRef<HTMLButtonElement, ArrowProps>(
  ({ className, direction, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 p-2 text-xl text-white transition hover:cursor-pointer hover:text-slate-800",
        direction === "left" ? "left-4" : "right-4",
        className
      )}
      {...props}
    >
      {direction === "left" ? (
        <IconChevronBackward className="size-12" />
      ) : (
        <IconChevronForward className="size-12" />
      )}
    </button>
  )
)
CarouselArrow.displayName = "CarouselArrow"

export { Carousel }
