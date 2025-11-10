import type { FC, SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const IconChevronBackward: FC<Props> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M560-240 320-480l240-240 56 56-184 184 184 184z"></path>
    </svg>
  )
}
