import type { SVGProps } from 'react'

function Svg(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...props} />
}

export function IconGear() {
  return (
    <Svg>
      <path
        fill="currentColor"
        d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm9.1 3.1-1.7-.6a7.2 7.2 0 0 0-.6-1.4l.9-1.6a.9.9 0 0 0-.2-1.1l-1.4-1.4a.9.9 0 0 0-1.1-.2l-1.6.9a7.2 7.2 0 0 0-1.4-.6L13.4 3.9a.9.9 0 0 0-.9-.9h-2a.9.9 0 0 0-.9.9l-.6 1.7a7.2 7.2 0 0 0-1.4.6l-1.6-.9a.9.9 0 0 0-1.1.2L3.5 6.9a.9.9 0 0 0-.2 1.1l.9 1.6a7.2 7.2 0 0 0-.6 1.4l-1.7.6a.9.9 0 0 0-.6.9v2c0 .4.3.8.6.9l1.7.6c.1.5.3 1 .6 1.4l-.9 1.6a.9.9 0 0 0 .2 1.1l1.4 1.4a.9.9 0 0 0 1.1.2l1.6-.9c.4.3.9.5 1.4.6l.6 1.7c.1.4.5.7.9.7h2c.4 0 .8-.3.9-.7l.6-1.7c.5-.1 1-.3 1.4-.6l1.6.9a.9.9 0 0 0 1.1-.2l1.4-1.4a.9.9 0 0 0 .2-1.1l-.9-1.6c.3-.4.5-.9.6-1.4l1.7-.6a.9.9 0 0 0 .6-.9v-2a.9.9 0 0 0-.6-.9Z"
      />
    </Svg>
  )
}

export function IconChevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <Svg style={{ transform: direction === 'right' ? 'scaleX(-1)' : undefined }}>
      <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function IconSend() {
  return (
    <Svg>
      <path fill="currentColor" d="M21.5 3.5 2.8 10.4c-.9.3-.8 1.6.1 1.8l5.2 1.6 1.9 5.6c.3.9 1.5.9 1.9.1l2.3-4.3 5.1 3.8c.7.5 1.7.1 1.8-.8l2.2-13.2c.2-1-.8-1.8-1.8-1.5Zm-2.2 2.1-8.7 8.1-.4 3.2-1.4-4.1 10.5-7.2Z" />
    </Svg>
  )
}
