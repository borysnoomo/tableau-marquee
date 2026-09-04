import Swiper from "swiper"
import "swiper/css"
import "../Carousel/Carousel.css"
import "../Slide/Slide.css"
import "./tableauMarquee.css"
import {
  applySlideSides,
  bindPointerTilt,
  isMobileLayout,
  MIN_LOOP_SLIDES,
  playSlideCallouts,
  resetSlideTilt,
  SLIDES_PER_VIEW,
  SLIDES_PER_VIEW_2K,
  SPEED_MS,
  TILT_RELEASE_S,
  MOBILE_CALLOUT_ENTER_DELAY_MS,
} from "../slider/calloutMotion"
import { applyBackgroundTokens } from "../slider/backgrounds"
import {
  createArrowIcon,
  createFrameSvg,
  createLeftCard,
  createPlayIcon,
  createRightCard,
  createSlideMediaEl,
  readMediaBlade,
  type CardMedia,
} from "./slideChrome"

const ROOT_ID = "tableau-marquee-2026"
const CALLOUTS_ID = "tableau-marquee-callouts-2026"

let chromeUid = 0
const nextUid = () => `blade-${++chromeUid}`

function parseSliderIndex(id: string) {
  const match = /^media-slider-(\d+)$/.exec(id)
  return match ? Number(match[1]) : null
}

function parseCalloutId(id: string) {
  const match = /^media-callout-(\d+)-(\d+)$/.exec(id)
  if (!match) return null
  return { slide: Number(match[1]), index: Number(match[2]) }
}

function slideModifierClass(title: string) {
  const t = title.toLowerCase()
  if (t.includes("claude")) return "slide--claude"
  if (t.includes("slack")) return "slide--slack"
  return ""
}

function styleMarquee(root: HTMLElement) {
  const marquee = root.querySelector<HTMLElement>(".marquee--blade")
  if (!marquee) return

  marquee.classList.add("hero")
  marquee.querySelector(".content__wrapper")?.classList.add("hero-inner")

  const headline = marquee.querySelector<HTMLElement>("h1.headline")
  if (headline) {
    headline.classList.add("hero-headline")
    headline.style.fontWeight = "600"
    headline.style.fontFamily = "Avant Garde for Salesforce"
  }

  const ctas = marquee.querySelector(".cta_container")
  ctas?.classList.add("hero-actions")

  const primary = marquee.querySelector<HTMLElement>('.cta_button[data-variant="primary"]')
  primary?.classList.add("hero-btn", "hero-btn--primary")

  const secondary = marquee.querySelector<HTMLElement>('.cta_button[data-variant="secondary"]')
  if (secondary) {
    secondary.classList.add("hero-btn", "hero-btn--secondary")
    if (!secondary.querySelector("svg")) secondary.append(createPlayIcon())
  }
}

type SlideSource = {
  title: string
  media: CardMedia
  leftMedia: CardMedia | null
  rightMedia: CardMedia | null
}

function readCalloutsBySlide() {
  const host = document.getElementById(CALLOUTS_ID)
  const bySlide = new Map<number, { left: CardMedia | null; right: CardMedia | null }>()
  if (!host) return bySlide

  host.classList.add("is-callout-source")
  for (const section of host.querySelectorAll<HTMLElement>(".media--blade")) {
    const parsed = parseCalloutId(section.id)
    if (!parsed) continue
    const media = readMediaBlade(section)?.media ?? null
    const entry = bySlide.get(parsed.slide) ?? { left: null, right: null }
    if (parsed.index === 1) entry.left = media
    else if (parsed.index === 2) entry.right = media
    bySlide.set(parsed.slide, entry)
  }
  return bySlide
}

function readSlideSources(root: HTMLElement): SlideSource[] {
  const callouts = readCalloutsBySlide()
  const blades = [...root.querySelectorAll<HTMLElement>(".media--blade")]
  const slides: SlideSource[] = []

  blades.forEach((blade, i) => {
    const data = readMediaBlade(blade)
    if (!data) return
    blade.classList.add("is-slide-source")

    const slideNum = parseSliderIndex(blade.id) ?? i + 1
    const pair = callouts.get(slideNum)
    slides.push({
      title: data.title,
      media: data.media,
      leftMedia: pair?.left ?? null,
      rightMedia: pair?.right ?? null,
    })
  })

  return slides
}

function buildSlide(source: SlideSource) {
  const item = document.createElement("div")
  item.className = "swiper-slide"

  const carouselItem = document.createElement("div")
  carouselItem.className = "carousel-item"

  const slide = document.createElement("div")
  slide.className = ["slide", slideModifierClass(source.title)].filter(Boolean).join(" ")

  const stage = document.createElement("div")
  stage.className = "slide-stage"

  const header = document.createElement("div")
  header.className = "slide-header"
  const headline = document.createElement("h3")
  headline.className = "slide-title"
  headline.textContent = source.title
  header.append(headline)

  const imageContainer = document.createElement("div")
  imageContainer.className = "slide-image-container"
  imageContainer.append(createSlideMediaEl(source.media, source.title))

  // The frame sits behind the screen. .slide-stage is a preserve-3d context, where
  // z-index does not sort — coplanar layers fall back to tree order — so the frame
  // must come first in the DOM, not rely on its lower z-index.
  stage.append(createFrameSvg(nextUid()), header, imageContainer)
  if (source.leftMedia) stage.append(createLeftCard(source.leftMedia))
  if (source.rightMedia) stage.append(createRightCard(source.rightMedia))
  slide.append(stage)
  carouselItem.append(slide)
  item.append(carouselItem)
  return item
}

function syncSlideVideos(swiper: Swiper) {
  for (const slideEl of swiper.slides) {
    const active = slideEl.classList.contains("swiper-slide-active")
    for (const video of slideEl.querySelectorAll<HTMLVideoElement>("video")) {
      if (active) void video.play().catch(() => {})
      else video.pause()
    }
  }
}

function createNav() {
  const nav = document.createElement("div")
  nav.className = "carousel-nav"

  const prev = document.createElement("button")
  prev.type = "button"
  prev.className = "carousel-btn carousel-btn--prev"
  prev.setAttribute("aria-label", "Previous slide")
  prev.append(createArrowIcon())

  const next = document.createElement("button")
  next.type = "button"
  next.className = "carousel-btn carousel-btn--next"
  next.setAttribute("aria-label", "Next slide")
  next.append(createArrowIcon())

  nav.append(prev, next)
  return { nav, prev, next }
}

function initCarousel(root: HTMLElement) {
  const slideData = readSlideSources(root)
  if (!slideData.length) return

  const copies = Math.max(2, Math.ceil(MIN_LOOP_SLIDES / slideData.length))
  const wrapper = document.createElement("div")
  wrapper.className = "swiper-wrapper"
  for (let i = 0; i < copies; i++) {
    for (const data of slideData) wrapper.append(buildSlide(data))
  }

  const swiperHost = document.createElement("div")
  swiperHost.className = "swiper carousel-swiper"

  const carousel = document.createElement("div")
  carousel.className = "carousel"
  const host = document.createElement("div")
  host.className = "app-carousel"

  const { nav, prev, next } = createNav()
  swiperHost.append(wrapper)
  carousel.append(swiperHost, nav)
  host.append(carousel)

  const marquee = root.querySelector(".marquee--blade")
  if (marquee?.parentElement) marquee.after(host)
  else root.append(host)

  let pendingDir: -1 | 0 | 1 = 0
  let calloutsReady = false
  let lastActiveSlide: Element | null = null
  let enterTimer = 0

  // `releasing` is the slide that still carries the pointer tilt — it eases back to
  // neutral over the swap instead of snapping. Everything else is already neutral.
  const resetLeavingSlide = (swiper: Swiper, releasing: Element | null = null) => {
    for (const slideEl of swiper.slides) {
      if (slideEl.classList.contains("swiper-slide-active")) continue
      resetSlideTilt(slideEl, slideEl === releasing ? TILT_RELEASE_S : 0)
    }
  }

  const visualActiveSlide = (instance: Swiper) =>
    (Array.from(instance.slides) as HTMLElement[]).find((slide) =>
      slide.classList.contains("swiper-slide-active"),
    ) ?? null

  const hideInactiveCallouts = (swiper: Swiper) => {
    const active = visualActiveSlide(swiper)
    for (const slideEl of swiper.slides) {
      if (slideEl !== active) playSlideCallouts(slideEl, "hide")
    }
  }

  const playOutgoingLeave = (instance: Swiper) => {
    const active = visualActiveSlide(instance)
    if (!lastActiveSlide || lastActiveSlide === active) return
    playSlideCallouts(lastActiveSlide, "leave")
  }

  const playIncomingEnter = (instance: Swiper) => {
    const active = visualActiveSlide(instance)
    if (!active || active === lastActiveSlide) return
    playSlideCallouts(active, "enter")
    lastActiveSlide = active
  }

  const flushIncomingEnter = (instance: Swiper) => {
    if (enterTimer) {
      window.clearTimeout(enterTimer)
      enterTimer = 0
    }
    playIncomingEnter(instance)
  }

  const scheduleIncomingEnter = (instance: Swiper) => {
    if (enterTimer) window.clearTimeout(enterTimer)
    enterTimer = window.setTimeout(() => {
      enterTimer = 0
      playIncomingEnter(instance)
    }, MOBILE_CALLOUT_ENTER_DELAY_MS)
  }

  const syncSlideCallouts = (instance: Swiper, mode: "enter" | "swap") => {
    const active = visualActiveSlide(instance)
    if (!active) return
    if (mode === "enter") {
      hideInactiveCallouts(instance)
      playSlideCallouts(active, "enter")
      lastActiveSlide = active
      return
    }
    playOutgoingLeave(instance)
    playIncomingEnter(instance)
  }

  const allowDesktopDrag = () => !window.matchMedia("(hover: none)").matches

  const swiper = new Swiper(swiperHost, {
    slidesPerView: 1,
    spaceBetween: 12,
    centeredSlides: true,
    loop: true,
    speed: SPEED_MS,
    watchSlidesProgress: true,
    initialSlide: 0,
    allowTouchMove: isMobileLayout() || allowDesktopDrag(),
    breakpoints: {
      1024: {
        slidesPerView: SLIDES_PER_VIEW,
        spaceBetween: 0,
      },
      1440: {
        slidesPerView: "auto",
        spaceBetween: 0,
      },
      2560: {
        slidesPerView: SLIDES_PER_VIEW_2K,
        spaceBetween: 0,
      },
    },
    on: {
      init(instance) {
        applySlideSides(instance)
        syncSlideVideos(instance)
      },
      afterInit(instance) {
        applySlideSides(instance)
        syncSlideCallouts(instance, "enter")
        calloutsReady = true
        syncSlideVideos(instance)
      },
      setTranslate: applySlideSides,
      progress: applySlideSides,
      slideChangeTransitionStart(instance) {
        resetLeavingSlide(instance, lastActiveSlide)
        if (calloutsReady) {
          if (isMobileLayout()) {
            playOutgoingLeave(instance)
            scheduleIncomingEnter(instance)
          } else {
            syncSlideCallouts(instance, "swap")
          }
        }
        syncSlideVideos(instance)
      },
      slideChangeTransitionEnd(instance) {
        resetLeavingSlide(instance)
        if (calloutsReady && isMobileLayout()) flushIncomingEnter(instance)
        syncSlideVideos(instance)
        const pending = pendingDir
        pendingDir = 0
        if (pending === 1) instance.slideNext()
        if (pending === -1) instance.slidePrev()
      },
      slideResetTransitionEnd(instance) {
        if (calloutsReady && isMobileLayout()) flushIncomingEnter(instance)
      },
    },
  })

  const requestNavigation = (direction: -1 | 1) => {
    if (swiper.animating) {
      pendingDir = direction
      return
    }
    if (direction === 1) swiper.slideNext()
    else swiper.slidePrev()
  }

  prev.addEventListener("click", () => requestNavigation(-1))
  next.addEventListener("click", () => requestNavigation(1))

  const tilt = bindPointerTilt(carousel)
  swiper.on("slideChangeTransitionStart", () => tilt.onSlideTransition())
}

export function enhanceTableauMarquee() {
  applyBackgroundTokens()

  const root = document.getElementById(ROOT_ID)
  if (!root || root.dataset.bladeCarousel === "ready") return

  styleMarquee(root)
  initCarousel(root)

  root.dataset.bladeCarousel = "ready"
}
