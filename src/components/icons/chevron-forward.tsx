import type { FC, SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const IconChevronForward: FC<Props> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M504-480 320-664l56-56 240 240-240 240-56-56z"></path>
    </svg>
  )
}
