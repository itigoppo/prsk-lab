import type { FC, SVGProps } from "react"

type Props = SVGProps<SVGSVGElement>

export const IconMenu: FC<Props> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 -960 960 960"
      {...props}
    >
      <path d="M120-240v-80h720v80zm0-200v-80h720v80zm0-200v-80h720v80z"></path>
    </svg>
  )
}
