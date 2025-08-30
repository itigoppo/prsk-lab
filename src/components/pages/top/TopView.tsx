"use client"

import { Carousel } from "@/components/ui/Carousel"

export function TopView() {
  return (
    <div className="h-screen">
      <Carousel
        className="h-fit w-full md:mx-auto md:w-xl lg:w-4xl"
        images={[
          "https://pbs.twimg.com/media/FA48dZ_VkAESI99?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FA5FX--VkAEfPsh?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FA2vRS6VkAU6U2n?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FA2vRS-UUAMCbaU?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FA2vRTQUUAAkDCL?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FA2vRT2UYAIm8k-?format=jpg&name=medium",
          "https://pbs.twimg.com/media/E_Z-w0zUUAEtP8V?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FPO-qAiUcAEjpJA?format=jpg&name=medium",
          "https://pbs.twimg.com/media/FPO03xEVgAQabcy?format=jpg&name=medium",
        ]}
      />
    </div>
  )
}
