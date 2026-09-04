import { useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Swiper, SwiperSlide, type SwiperClass } from "swiper/react"
import { Slide, type SlideData } from "../Slide/Slide"
import { INITIAL_INDEX } from "./carouselData"
import "swiper/css"
import "./Carousel.css"
import {
  applySlideSides,
  bindPointerTilt,
  MIN_LOOP_SLIDES,
  resetSlideTilt,
  SLIDES_PER_VIEW,
  SLIDES_PER_VIEW_2K,
  SPEED_MS,
} from "../slider/calloutMotion"

gsap.registerPlugin(useGSAP)

const ArrowIcon = () => (
  <svg
    style={{ width: "48px" }}
    width="48"
    height="48"
    viewBox="0 0 65 65"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M32 64C49.6731 64 64 49.6731 64 32C64 14.3269 49.6731 0 32 0C14.3269 0 0 14.3269 0 32C0 49.6731 14.3269 64 32 64Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20.2973 29.2163H40.9781L40.9781 33.8101H20.2973L20.2973 29.2163Z"
      fill="#001E5B"
    />
    <path
      d="M33.4771 43.1345L42.464 34.1476C43.8992 32.7124 43.8992 30.3855 42.464 28.9504L33.5312 20.0176L30.283 23.2659L38.5661 31.549L30.2288 39.8862L33.4771 43.1345Z"
      fill="#001E5B"
    />
  </svg>
)

function slidesForLoop(data: SlideData[]) {
  const copies = Math.max(2, Math.ceil(MIN_LOOP_SLIDES / data.length))
  return Array.from({ length: copies }, () => data).flat()
}

export const Carousel = ({ data }: { data: SlideData[] }) => {
  const slides = useMemo(() => slidesForLoop(data), [data])
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)
  const pendingDirRef = useRef<-1 | 0 | 1>(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = carouselRef.current
      if (!root) return
      return bindPointerTilt(root)
    },
    { scope: carouselRef },
  )

  const requestNavigation = (direction: -1 | 1) => {
    if (!swiper) return
    if (swiper.animating) {
      pendingDirRef.current = direction
      return
    }
    if (direction === 1) swiper.slideNext()
    else swiper.slidePrev()
  }

  const flushPending = (instance: SwiperClass) => {
    const pending = pendingDirRef.current
    pendingDirRef.current = 0
    if (pending === 1) instance.slideNext()
    if (pending === -1) instance.slidePrev()
  }

  const resetLeavingSlide = (instance: SwiperClass) => {
    for (const slideEl of instance.slides) {
      if (!slideEl.classList.contains("swiper-slide-active")) resetSlideTilt(slideEl)
    }
  }

  return (
    <div className="carousel" ref={carouselRef}>
      <div className="carousel-nav">
        <button
          type="button"
          className="carousel-btn carousel-btn--prev"
          aria-label="Previous slide"
          onClick={() => requestNavigation(-1)}
        >
          <ArrowIcon />
        </button>
        <button
          type="button"
          className="carousel-btn carousel-btn--next"
          aria-label="Next slide"
          onClick={() => requestNavigation(1)}
        >
          <ArrowIcon />
        </button>
      </div>

      <Swiper
        className="carousel-swiper"
        slidesPerView={1}
        spaceBetween={12}
        centeredSlides
        loop
        speed={SPEED_MS}
        allowTouchMove
        watchSlidesProgress
        initialSlide={INITIAL_INDEX}
        breakpoints={{
          1024: { slidesPerView: SLIDES_PER_VIEW, spaceBetween: 0 },
          2560: { slidesPerView: SLIDES_PER_VIEW_2K, spaceBetween: 0 },
        }}
        onSwiper={(instance) => {
          setSwiper(instance)
          applySlideSides(instance)
        }}
        onSetTranslate={applySlideSides}
        onProgress={applySlideSides}
        onSlideChangeTransitionStart={resetLeavingSlide}
        onSlideChangeTransitionEnd={(instance) => {
          resetLeavingSlide(instance)
          flushPending(instance)
        }}
      >
        {slides.map((item, index) => (
          <SwiperSlide key={`${item.title}-${index}`}>
            {({ isActive }) => (
              <div className="carousel-item">
                <Slide data={item} active={isActive} />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
