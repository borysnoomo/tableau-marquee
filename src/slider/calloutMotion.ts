import gsap from "gsap"

export const DESIGN_WIDTH = 1440
export const SLIDE_WIDTH = 862
export const SLIDES_PER_VIEW = DESIGN_WIDTH / SLIDE_WIDTH
export const DESIGN_WIDTH_2K = 2560
export const SLIDE_WIDTH_2K = 1075
export const SLIDES_PER_VIEW_2K = DESIGN_WIDTH_2K / SLIDE_WIDTH_2K
export const MIN_LOOP_SLIDES = 8
export const SPEED_MS = 800
export const MOBILE_CALLOUT_ENTER_DELAY_MS = 400
export const MOBILE_MQ = "(max-width: 1023px)"
export const TABLET_MQ = "(min-width: 768px) and (max-width: 1023px)"

const CARD_INFLUENCE_MIN = 0.2
const CARD_INFLUENCE_MAX = 2
const CARD_RADIUS_SCALE = 1
const USE_CARD_INFLUENCE = true
const CARD_IDLE_DELAY_MS = 1000
const PARALLAX_RANGE = 16
const ROTATE_RANGE = 6
const MOCKUP_PERSPECTIVE = 1800
const MOCKUP_Z = 0

// 2D pan only. rotationY/X or z on the still's wrapper composites <img> as a
// texture (videos keep a decoder layer). Whole pixels, force3D: false.
const LEFT_FLOAT_A = { x: 4, y: -6 }
const LEFT_FLOAT_B = { x: -4, y: 5 }
const RIGHT_FLOAT_A = { x: -5, y: 4 }
const RIGHT_FLOAT_B = { x: 5, y: -6 }

const CALLOUT_PERSPECTIVE_DESKTOP = 1400
const CALLOUT_PERSPECTIVE_TABLET = 620
const CALLOUT_PERSPECTIVE_MOBILE = 400
const CALLOUT_SCALE_TABLET = 0.72

export const isMobileLayout = () =>
  window.matchMedia(MOBILE_MQ).matches || window.innerWidth <= 1023

export const isTabletLayout = () => {
  const w = window.innerWidth
  return window.matchMedia(TABLET_MQ).matches || (w >= 768 && w <= 1023)
}

const calloutScale = () => (isTabletLayout() ? CALLOUT_SCALE_TABLET : 1)

const calloutPerspective = () => {
  const transformPerspective = isTabletLayout()
    ? CALLOUT_PERSPECTIVE_TABLET
    : isMobileLayout()
      ? CALLOUT_PERSPECTIVE_MOBILE
      : CALLOUT_PERSPECTIVE_DESKTOP
  return { transformPerspective, transformOrigin: "50% 50%" }
}

const calcValue = (position: number, size: number, range: number) =>
  (position / size) * range - range / 2

export type CalloutEls = {
  left: HTMLElement | null
  right: HTMLElement | null
}

function cardRadius(card: HTMLElement) {
  const rect = card.getBoundingClientRect()
  return Math.max(rect.width, rect.height) * CARD_RADIUS_SCALE
}

function cardInfluence(card: HTMLElement, clientX: number, clientY: number) {
  const rect = card.getBoundingClientRect()
  const dx = clientX - (rect.left + rect.width / 2)
  const dy = clientY - (rect.top + rect.height / 2)
  const radius = Math.max(cardRadius(card), 1)
  const t = gsap.utils.clamp(0, 1, Math.hypot(dx, dy) / radius)
  const proximity = 1 - t * t
  return gsap.utils.interpolate(CARD_INFLUENCE_MIN, CARD_INFLUENCE_MAX, proximity)
}

function tiltCard(
  tilt: HTMLElement | null,
  card: HTMLElement | null,
  clientX: number,
  clientY: number,
  panX: number,
  panY: number,
) {
  if (!tilt || !card) return
  const influence = USE_CARD_INFLUENCE ? cardInfluence(card, clientX, clientY) : 1
  gsap.to(tilt, {
    x: -panX * influence,
    y: panY * influence,
    duration: 0.5,
    ease: "power3.out",
    overwrite: "auto",
    force3D: false,
  })
}

export function queryCallouts(slide: Element | null): CalloutEls {
  if (!slide) return { left: null, right: null }
  return {
    left: slide.querySelector<HTMLElement>(".slide-card--left"),
    right: slide.querySelector<HTMLElement>(".slide-card--right"),
  }
}

function calloutList(cards: CalloutEls) {
  return [cards.left, cards.right].filter((el): el is HTMLElement => Boolean(el))
}

export function activeSlideParts(root: HTMLElement) {
  const slide = root.querySelector<HTMLElement>(".swiper-slide-active .slide")
  if (!slide) return null
  const cards = queryCallouts(slide)
  return {
    stage: slide.querySelector<HTMLElement>(".slide-stage"),
    mockup: slide.querySelector<HTMLElement>(".slide-mockup"),
    leftCard: cards.left,
    rightCard: cards.right,
    leftTilt: cards.left?.querySelector<HTMLElement>(".slide-card-tilt") ?? null,
    rightTilt: cards.right?.querySelector<HTMLElement>(".slide-card-tilt") ?? null,
  }
}

export function resetSlideTilt(slide: Element) {
  if (isMobileLayout()) return
  const mockup = slide.querySelector<HTMLElement>(".slide-mockup")
  const tilts = slide.querySelectorAll<HTMLElement>(".slide-card-tilt")
  if (mockup) {
    gsap.to(mockup, {
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: SPEED_MS / 1000,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => gsap.set(mockup, { clearProps: "transform" }),
    })
  }
  if (tilts.length) gsap.set(tilts, { clearProps: "transform" })
}

export function applySlideSides(swiper: { slides: ArrayLike<HTMLElement> }) {
  for (const slideEl of Array.from(swiper.slides)) {
    const progress = (slideEl as HTMLElement & { progress?: number }).progress ?? 0
    const item = slideEl.querySelector<HTMLElement>(".carousel-item")
    if (!item) continue
    if (progress > 0.02) item.style.transformOrigin = "right center"
    else if (progress < -0.02) item.style.transformOrigin = "left center"
  }
}

export function hideCallouts(cards: CalloutEls) {
  const els = calloutList(cards)
  if (!els.length) return
  gsap.set(els, { autoAlpha: 0, opacity: 0, clearProps: "transform" })
}

function restCalloutTransform(el: HTMLElement) {
  const scale = calloutScale()
  if (scale !== 1) gsap.set(el, { scale, force3D: false })
  else gsap.set(el, { clearProps: "transform" })
}

export function playCalloutEnter(cards: CalloutEls) {
  if (!cards.left && !cards.right) return

  const scale = calloutScale()
  const perspective = calloutPerspective()
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

  const flipIn = (el: HTMLElement, fromY: number) => {
    gsap.set(el, { visibility: "visible" })
    tl.fromTo(
      el,
      {
        opacity: 0,
        rotationY: fromY,
        scale,
        transformPerspective: perspective.transformPerspective,
      },
      {
        opacity: 1,
        rotationY: 0,
        scale,
        transformPerspective: perspective.transformPerspective,
        duration: 0.9,
        immediateRender: true,
        onComplete: () => restCalloutTransform(el),
      },
      0,
    )
  }

  if (cards.left) flipIn(cards.left, 120)
  if (cards.right) flipIn(cards.right, -120)
  return tl
}

export function playCalloutLeave(cards: CalloutEls) {
  const els = calloutList(cards)
  if (!els.length) return
  const scale = calloutScale()
  const perspective = calloutPerspective()
  const tl = gsap.timeline({ defaults: { ease: "power2.in" } })
  const flipOut = (el: HTMLElement, toY: number) => {
    tl.fromTo(
      el,
      {
        rotationY: 0,
        scale,
        opacity: 1,
        transformPerspective: perspective.transformPerspective,
      },
      {
        rotationY: toY,
        scale,
        autoAlpha: 0,
        opacity: 0,
        transformPerspective: perspective.transformPerspective,
        duration: 0.45,
        immediateRender: true,
      },
      0,
    )
  }
  if (cards.left) flipOut(cards.left, 120)
  if (cards.right) flipOut(cards.right, -120)
  return tl
}

function resetCalloutTilt(cards: CalloutEls) {
  const tilts = [
    cards.left?.querySelector<HTMLElement>(".slide-card-tilt"),
    cards.right?.querySelector<HTMLElement>(".slide-card-tilt"),
  ].filter((el): el is HTMLElement => Boolean(el))
  if (!tilts.length) return
  gsap.killTweensOf(tilts)
  gsap.set(tilts, { clearProps: "transform" })
}

export function playSlideCallouts(slide: Element | null, mode: "enter" | "leave" | "hide") {
  const cards = queryCallouts(slide)
  const els = calloutList(cards)
  if (!els.length) return
  gsap.killTweensOf(els)
  resetCalloutTilt(cards)
  if (mode === "hide") hideCallouts(cards)
  else if (mode === "enter") playCalloutEnter(cards)
  else playCalloutLeave(cards)
}

export function bindPointerTilt(root: HTMLElement) {
  const noop = Object.assign(() => {}, { onSlideTransition() {} })
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return noop

  let frame = 0
  let idleTimer = 0
  let floating = false
  let lastX = window.innerWidth / 2
  let lastY = window.innerHeight / 2

  const floatCard = (
    target: HTMLElement,
    from: typeof LEFT_FLOAT_A,
    to: typeof LEFT_FLOAT_B,
    duration: number,
  ) => {
    gsap.to(target, {
      ...from,
      duration: 1.4,
      ease: "sine.inOut",
      overwrite: "auto",
      force3D: false,
      onComplete: () => {
        if (!floating) return
        gsap.to(target, {
          ...to,
          duration,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          force3D: false,
        })
      },
    })
  }

  const stopIdleFloat = () => {
    if (idleTimer) {
      window.clearTimeout(idleTimer)
      idleTimer = 0
    }
    if (!floating) return
    floating = false
    gsap.killTweensOf(root.querySelectorAll(".slide-card-tilt"))
  }

  const settleMockup = () => {
    const mockup = activeSlideParts(root)?.mockup
    if (!mockup) return
    gsap.to(mockup, {
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => gsap.set(mockup, { clearProps: "transform" }),
    })
  }

  const startIdleFloat = () => {
    idleTimer = 0
    if (isMobileLayout() || calloutsBusy()) return
    settleMockup()
    const parts = activeSlideParts(root)
    if (!parts?.leftTilt && !parts?.rightTilt) {
      scheduleIdleFloat()
      return
    }
    floating = true
    if (parts?.leftTilt) floatCard(parts.leftTilt, LEFT_FLOAT_A, LEFT_FLOAT_B, 3.8)
    if (parts?.rightTilt) floatCard(parts.rightTilt, RIGHT_FLOAT_A, RIGHT_FLOAT_B, 4.6)
  }

  const scheduleIdleFloat = () => {
    if (idleTimer) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(startIdleFloat, CARD_IDLE_DELAY_MS)
  }

  const calloutsBusy = () => {
    const parts = activeSlideParts(root)
    return Boolean(
      (parts?.leftCard && gsap.isTweening(parts.leftCard)) ||
        (parts?.rightCard && gsap.isTweening(parts.rightCard)),
    )
  }

  const paint = (clientX: number, clientY: number, duration = 0.45) => {
    if (isMobileLayout()) return
    const parts = activeSlideParts(root)
    if (!parts?.mockup) return

    const { innerWidth, innerHeight } = window
    const yValue = calcValue(clientY, innerHeight, ROTATE_RANGE)
    const xValue = calcValue(clientX, innerWidth, ROTATE_RANGE)
    const panY = calcValue(clientY, innerHeight, PARALLAX_RANGE)
    const panX = calcValue(clientX, innerWidth, PARALLAX_RANGE)

    gsap.to(parts.mockup, {
      rotationX: yValue,
      rotationY: xValue,
      z: MOCKUP_Z,
      transformPerspective: MOCKUP_PERSPECTIVE,
      duration,
      ease: "power3.out",
      overwrite: "auto",
      force3D: "auto",
    })
    if (calloutsBusy()) return
    tiltCard(parts.leftTilt, parts.leftCard, clientX, clientY, panX, panY)
    tiltCard(parts.rightTilt, parts.rightCard, clientX, clientY, panX, panY)
  }

  const onMove = (event: MouseEvent) => {
    // Safari re-dispatches a mousemove at the last known pointer position after a
    // layout, to refresh :hover ("fake mouse move"). The looping slide videos make
    // that fire over and over, and each one killed the idle float and re-tilted the
    // stage while the pointer sat still — the twitch is Safari-only for that reason.
    // A move that does not move the pointer is not a move.
    if (event.clientX === lastX && event.clientY === lastY) return
    lastX = event.clientX
    lastY = event.clientY
    stopIdleFloat()
    scheduleIdleFloat()
    if (frame) window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(() => paint(lastX, lastY))
  }

  const onResize = () => {
    if (floating) return
    if (frame) window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(() => paint(lastX, lastY))
  }

  window.addEventListener("mousemove", onMove)
  window.addEventListener("resize", onResize)
  scheduleIdleFloat()

  const destroy = Object.assign(
    () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", onResize)
      stopIdleFloat()
      window.cancelAnimationFrame(frame)
    },
    {
      onSlideTransition() {
        stopIdleFloat()
        scheduleIdleFloat()
        paint(lastX, lastY, SPEED_MS / 1000)
      },
    },
  )

  return destroy
}
