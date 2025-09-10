import { Prisma, PrismaClient } from "@prisma/client"

export const seedUnits = async (prisma: PrismaClient) => {
  console.log("start seeding unit...")

  const units: Prisma.UnitCreateManyInput[] = [
    {
      code: "vs",
      name: "VIRTUAL SINGER",
      short: "VS",
      color: "#ffffff",
      bgColor: "#86cecb",
    },
    {
      code: "leoneed",
      name: "Leo/need",
      short: "L/n",
      color: "#ffffff",
      bgColor: "#4455dd",
    },
    {
      code: "mmj",
      name: "MORE MORE JUMP！",
      short: "MMJ",
      color: "#000000",
      bgColor: "#88dd44",
    },
    {
      code: "vbs",
      name: "Vivid BAD SQUAD",
      short: "VBS",
      color: "#ffffff",
      bgColor: "#ee1166",
    },
    {
      code: "ws",
      name: "ワンダーランズ×ショウタイム",
      short: "W×S",
      color: "#ffffff",
      bgColor: "#ff9900",
    },
    {
      code: "oclock",
      name: "25時、ナイトコードで。",
      short: "25",
      color: "#ffffff",
      bgColor: "#884499",
    },
  ]

  await prisma.unit.deleteMany()
  await prisma.unit.createMany({
    data: units.map((item, index) => ({
      ...item,
      priority: index + 1,
    })),
  })
  console.log("success")
}
