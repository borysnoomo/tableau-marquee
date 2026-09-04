import { useId, useRef, type ReactNode } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import "./Slide.css"
import { hideCallouts, playCalloutEnter, playCalloutLeave } from "../slider/calloutMotion"

gsap.registerPlugin(useGSAP)

export type SlideData = {
  title: string
  image: string
  leftCardImg?: string
  rightCardImg?: string
}

type SlideProps = {
  data: SlideData
  active?: boolean
  children?: ReactNode
}

export const Slide = ({ data, active = false, children }: SlideProps) => {
  const slideRef = useRef<HTMLDivElement>(null)
  const leftCardRef = useRef<HTMLDivElement>(null)
  const rightCardRef = useRef<HTMLDivElement>(null)
  const wasActiveRef = useRef(active)
  const id = useId()

  useGSAP(
    () => {
      const cards = {
        left: leftCardRef.current,
        right: rightCardRef.current,
      }
      if (!cards.left && !cards.right) return

      const wasActive = wasActiveRef.current
      wasActiveRef.current = active

      if (active) playCalloutEnter(cards)
      else if (wasActive) playCalloutLeave(cards)
      else hideCallouts(cards)
    },
    { dependencies: [active, data.leftCardImg, data.rightCardImg], scope: slideRef },
  )

  return (
    <div className="slide" ref={slideRef}>
      <div className="slide-stage">
        <div className="slide-header">
          <h2 className="slide-title">{data.title}</h2>
        </div>
        <div className="slide-image-container">
          <img className="slide-image" src={data.image} alt={data.title} />
        </div>

        <svg
          className="slide-frame"
          viewBox="0 0 954 674"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter={`url(#filter0_d_75_12521-${id})`}>
            <path
              d="M20 40C20 22.3269 34.3269 8 52 8H902C919.673 8 934 22.3269 934 40V610C934 627.673 919.673 642 902 642H52C34.3269 642 20 627.673 20 610V40Z"
              fill="white"
              fillOpacity="0.15"
              shapeRendering="crispEdges"
            />
            <path
              d="M20 40C20 22.3269 34.3269 8 52 8H902C919.673 8 934 22.3269 934 40V610C934 627.673 919.673 642 902 642H52C34.3269 642 20 627.673 20 610V40Z"
              fill={`url(#paint0_linear_75_12521-${id})`}
              fillOpacity="0.1"
              shapeRendering="crispEdges"
            />
            <path
              d="M52 8.75H902C919.259 8.75 933.25 22.7411 933.25 40V610C933.25 627.259 919.259 641.25 902 641.25H52C34.7411 641.25 20.75 627.259 20.75 610V40C20.75 22.7411 34.7411 8.75 52 8.75Z"
              stroke={`url(#paint1_linear_75_12521-${id})`}
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>
          <defs>
            <filter
              id={`filter0_d_75_12521-${id}`}
              x="0"
              y="0"
              width="954"
              height="674"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="12" />
              <feGaussianBlur stdDeviation="10" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0.117647 0 0 0 0 0.356863 0 0 0 0.05 0"
              />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_75_12521" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_75_12521" result="shape" />
            </filter>
            <linearGradient
              id={`paint0_linear_75_12521-${id}`}
              x1="477"
              y1="8"
              x2="477"
              y2="642"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FF5D2C" stopOpacity="0.6" />
              <stop offset="1" stopColor="#FF5D2C" />
            </linearGradient>
            <linearGradient
              id={`paint1_linear_75_12521-${id}`}
              x1="934"
              y1="325"
              x2="167"
              y2="-187"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" stopOpacity="0.1" />
              <stop offset="0.8" stopColor="white" stopOpacity="0.2" />
              <stop offset="1" stopColor="white" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {data.leftCardImg ? (
          <div className="slide-card slide-card--left" ref={leftCardRef}>
            <div className="slide-card-tilt">
              <div className="slide-card-glass">
                <img className="slide-card-photo" src={data.leftCardImg} alt="" />
              </div>
            </div>
          </div>
        ) : null}

        {data.rightCardImg ? (
          <div className="slide-card slide-card--right" ref={rightCardRef}>
            <div className="slide-card-tilt">
              <div className="slide-card-glass">
                <img className="slide-card-photo" src={data.rightCardImg} alt="" />
              </div>
            </div>
          </div>
        ) : null}

        {children ? <div className="slide-content">{children}</div> : null}
      </div>
    </div>
  )
}
