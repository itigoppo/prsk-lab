import type { FC, SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const IconWandStars: FC<Props> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="m176-120-56-56 301-302-181-45 198-123-17-234 179 151 216-88-87 217 151 178-234-16-124 198-45-181zm24-520-80-80 80-80 80 80zm355 197 48-79 93 7-60-71 35-86-86 35-71-59 7 92-79 49 90 22zm165 323-80-80 80-80 80 80zM569-570"></path>
    </svg>
  )
}
