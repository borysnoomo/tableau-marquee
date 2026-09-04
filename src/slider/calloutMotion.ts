import gsap from "gsap"

export const DESIGN_WIDTH = 1440
export const SLIDE_WIDTH = 862
export const SLIDES_PER_VIEW = DESIGN_WIDTH / SLIDE_WIDTH
export const DESIGN_WIDTH_2K = 2560
export const SLIDE_WIDTH_2K = 1075
export const SLIDES_PER_VIEW_2K = DESIGN_WIDTH_2K / SLIDE_WIDTH_2K
export const MIN_LOOP_SLIDES = 8
export const SPEED_MS = 800
export const TILT_RELEASE_S = 0.45
export const MOBILE_CALLOUT_ENTER_DELAY_MS = 400
export const MOBILE_MQ = "(max-width: 1023px)"
export const TABLET_MQ = "(min-width: 768px) and (max-width: 1023px)"

const ROTATE_RANGE = 10
const CARD_ROTATE_RANGE = 10
const PARALLAX_RANGE = 28
const CARD_INFLUENCE_MIN = 0.2
const CARD_INFLUENCE_MAX = 2
const CARD_RADIUS_SCALE = 1
const USE_CARD_INFLUENCE = true
const CARD_IDLE_DELAY_MS = 1000

const LEFT_FLOAT_A = { rotationX: 0, rotationY: 1.1, x: 2, y: -3 }
const LEFT_FLOAT_B = { rotationX: 0, rotationY: -0.85, x: -1.8, y: 2.4 }
const RIGHT_FLOAT_A = { rotationX: 0, rotationY: -1.2, x: -2.4, y: 2.2 }
const RIGHT_FLOAT_B = { rotationX: 0, rotationY: 0.95, x: 2.1, y: -2.8 }

const CALLOUT_Z_DESKTOP = 100
const CALLOUT_Z_TABLET = -48
const CALLOUT_Z_MOBILE = 10
const CALLOUT_PERSPECTIVE_TABLET = 620
const CALLOUT_PERSPECTIVE_MOBILE = 400
const CALLOUT_SCALE_TABLET = 0.72
/* Desktop no longer gives each card a perspective() of its own (see
   calloutProjection), which also took away the ~8.9% magnification that projection
   contributed about the card's own centre. Fold it back in as a plain scale — affine,
   so it stays on the compositor's fast path where a second perspective did not — and
   the resting card keeps the size it has always had. Measured against the previous
   rendering rather than derived from 1400/(1400-100): it reproduces both cards to
   within 2px, and holds across viewport widths. */
const CALLOUT_LIFT_DESKTOP = 1.0885
const CALLOUT_REST_Y_DESKTOP = 14
const CALLOUT_REST_Y_TABLET = 22
const CALLOUT_REST_Y_MOBILE = 9

export const isMobileLayout = () =>
  window.matchMedia(MOBILE_MQ).matches || window.innerWidth <= 1023

export const isTabletLayout = () => {
  const w = window.innerWidth
  return window.matchMedia(TABLET_MQ).matches || (w >= 768 && w <= 1023)
}

const calloutZ = () => {
  if (isTabletLayout()) return CALLOUT_Z_TABLET
  if (isMobileLayout()) return CALLOUT_Z_MOBILE
  return CALLOUT_Z_DESKTOP
}

const calloutScale = () => {
  if (isTabletLayout()) return CALLOUT_SCALE_TABLET
  if (isMobileLayout()) return 1
  return CALLOUT_LIFT_DESKTOP
}

const calloutRestY = () => {
  if (isTabletLayout()) return CALLOUT_REST_Y_TABLET
  if (isMobileLayout()) return CALLOUT_REST_Y_MOBILE
  return CALLOUT_REST_Y_DESKTOP
}

/* Desktop is the only breakpoint that rotates .slide-stage under the pointer, and it
   is the one that shimmered. The callouts sit inside that stage (preserve-3d) beneath
   the `perspective` on .slide, so the scene already projects both their z offset and
   their flip; giving each card a perspective() of its own stacked a second projection
   into its own matrix, and that product is not something WebKit will re-project on the
   compositor. It re-rasterised the card on every frame of the tilt, and the sign either
   side of the 90° crossing strobed backface-visibility through the flip. So desktop
   uses the single scene perspective the stylesheet already declares (1800px), and
   CALLOUT_LIFT_DESKTOP restores the size the second projection was contributing.

   Below 1024px .slide-stage is `transform: none` — nothing rotates, the stacked
   projection is static and cannot shimmer, and the tuned tablet/mobile geometry is
   built on it. It stays there, unchanged.

   transformPerspective: 0 makes GSAP drop perspective() from the transform outright
   rather than carry a cached value forward. */
const calloutProjection = () => {
  const transformPerspective = isTabletLayout()
    ? CALLOUT_PERSPECTIVE_TABLET
    : isMobileLayout()
      ? CALLOUT_PERSPECTIVE_MOBILE
      : 0
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
  rotationY: number,
  panX: number,
  panY: number,
) {
  if (!tilt || !card) return
  const influence = USE_CARD_INFLUENCE ? cardInfluence(card, clientX, clientY) : 1
  gsap.to(tilt, {
    rotationX: 0,
    rotationY: rotationY * influence,
    x: -panX * influence,
    y: panY * influence,
    duration: 0.5,
    ease: "power3.out",
    overwrite: "auto",
    force3D: true,
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
    image: slide.querySelector<HTMLElement>(".slide-image"),
    leftCard: cards.left,
    rightCard: cards.right,
    leftTilt: cards.left?.querySelector<HTMLElement>(".slide-card-tilt") ?? null,
    rightTilt: cards.right?.querySelector<HTMLElement>(".slide-card-tilt") ?? null,
  }
}

/* Pass a duration for the slide that is losing the pointer tilt, i.e. the one the
   user is still looking at. Snapping it to neutral moved its callouts 10-25px in a
   single frame: they ride at translateZ inside the stage, so unwinding a few
   degrees of stage rotation displaces them several times further than the slide
   face. Slides that are already parked at neutral can stay on the instant path. */
export function resetSlideTilt(slide: Element, duration = 0) {
  if (isMobileLayout()) return
  const stage = slide.querySelector<HTMLElement>(".slide-stage")
  const image = slide.querySelector<HTMLElement>(".slide-image")
  const tilts = slide.querySelectorAll<HTMLElement>(".slide-card-tilt")

  if (duration > 0) {
    const release = { duration, ease: "power2.out", overwrite: "auto" as const }
    if (stage) gsap.to(stage, { rotationX: 0, rotationY: 0, ...release })
    if (image) gsap.to(image, { x: 0, y: 0, ...release })
    if (tilts.length) gsap.to(tilts, { rotationX: 0, rotationY: 0, x: 0, y: 0, ...release })
    return
  }

  // overwrite kills any release still in flight, so it cannot resume past the set.
  const settle = { overwrite: "auto" as const }
  if (stage) gsap.set(stage, { rotationX: 0, rotationY: 0, transformPerspective: 0, ...settle })
  if (image) gsap.set(image, { x: 0, y: 0, ...settle })
  if (tilts.length) gsap.set(tilts, { rotationX: 0, rotationY: 0, x: 0, y: 0, ...settle })
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
  gsap.set(els, {
    ...calloutProjection(),
    autoAlpha: 0,
    rotationY: 0,
    rotationX: 0,
    z: 0,
    scale: calloutScale(),
    opacity: 0,
    // force3D: true,
  })
}

export function playCalloutEnter(cards: CalloutEls) {
  if (!cards.left && !cards.right) return

  const restY = calloutRestY()
  const z = calloutZ()
  const scale = calloutScale()
  const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

  const flipIn = (el: HTMLElement, fromY: number, toY: number) => {
    gsap.set(el, {
      ...calloutProjection(),
      visibility: "visible",
      rotationX: 0,
      x: 0,
      y: 0,
      z,
      scale,
    })
    tl.fromTo(
      el,
      { opacity: 0, rotationY: fromY, z, scale },
      { opacity: 1, rotationY: toY, z, scale, duration: 0.9, immediateRender: true },
      0,
    )
  }

  if (cards.left) flipIn(cards.left, 120, restY)
  if (cards.right) flipIn(cards.right, -120, -restY)
  return tl
}

export function playCalloutLeave(cards: CalloutEls) {
  const els = calloutList(cards)
  if (!els.length) return
  const z = isMobileLayout() ? calloutZ() : 0
  const scale = calloutScale()
  const tl = gsap.timeline({ defaults: { ease: "power2.in" } })
  if (cards.left) {
    tl.to(cards.left, { rotationY: 120, rotationX: 0, z, scale, ...calloutProjection(), autoAlpha: 0, opacity: 0, duration: 0.45 }, 0)
  }
  if (cards.right) {
    tl.to(cards.right, { rotationY: -120, rotationX: 0, z, scale, ...calloutProjection(), autoAlpha: 0, opacity: 0, duration: 0.45 }, 0)
  }
  return tl
}

function resetCalloutTilt(cards: CalloutEls) {
  const tilts = [
    cards.left?.querySelector<HTMLElement>(".slide-card-tilt"),
    cards.right?.querySelector<HTMLElement>(".slide-card-tilt"),
  ].filter((el): el is HTMLElement => Boolean(el))
  if (!tilts.length) return
  gsap.killTweensOf(tilts)
  gsap.set(tilts, { rotationX: 0, rotationY: 0, x: 0, y: 0 })
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

  if (!isMobileLayout()) {
    gsap.set(root.querySelectorAll(".slide-image"), { x: 0, y: 0 })
    gsap.set(root.querySelectorAll(".slide-stage"), { transformPerspective: 0 })
  }

  let frame = 0
  let idleTimer = 0
  let floating = false
  let floatTargets: HTMLElement[] = []
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
      onComplete: () => {
        if (!floating) return
        gsap.to(target, {
          ...to,
          duration,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
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
    // Kill what is actually floating. Re-reading .swiper-slide-active here caught
    // the wrong elements: the only caller during a swap is slideChangeTransitionStart,
    // by which point Swiper has already moved that class onto the incoming slide, so
    // the outgoing slide kept its infinite yoyo running underneath every later reset.
    if (floatTargets.length) gsap.killTweensOf(floatTargets)
    floatTargets = []
  }

  const startIdleFloat = () => {
    if (isMobileLayout()) return
    const parts = activeSlideParts(root)
    if (!parts?.leftTilt && !parts?.rightTilt) {
      scheduleIdleFloat()
      return
    }
    floating = true
    floatTargets = [parts?.leftTilt, parts?.rightTilt].filter((el): el is HTMLElement => Boolean(el))
    if (parts?.leftTilt) floatCard(parts.leftTilt, LEFT_FLOAT_A, LEFT_FLOAT_B, 3.8)
    if (parts?.rightTilt) floatCard(parts.rightTilt, RIGHT_FLOAT_A, RIGHT_FLOAT_B, 4.6)
  }

  const scheduleIdleFloat = () => {
    if (idleTimer) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(startIdleFloat, CARD_IDLE_DELAY_MS)
  }

  const paint = (clientX: number, clientY: number) => {
    if (isMobileLayout()) return
    const parts = activeSlideParts(root)
    if (!parts?.stage) return

    const { innerWidth, innerHeight } = window
    const yValue = calcValue(clientY, innerHeight, ROTATE_RANGE)
    const xValue = calcValue(clientX, innerWidth, ROTATE_RANGE)
    const cardX = calcValue(clientX, innerWidth, CARD_ROTATE_RANGE)
    const panY = calcValue(clientY, innerHeight, PARALLAX_RANGE)
    const panX = calcValue(clientX, innerWidth, PARALLAX_RANGE)

    gsap.to(parts.stage, {
      rotationX: yValue,
      rotationY: xValue,
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
      force3D: true,
    })
    tiltCard(parts.leftTilt, parts.leftCard, clientX, clientY, cardX, panX, panY)
    tiltCard(parts.rightTilt, parts.rightCard, clientX, clientY, cardX, panX, panY)
  }

  const onMove = (event: MouseEvent) => {
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
  paint(lastX, lastY)
  scheduleIdleFloat()
  const later = window.setTimeout(() => {
    if (!floating) paint(lastX, lastY)
  }, 1200)

  const destroy = Object.assign(
    () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", onResize)
      window.clearTimeout(later)
      stopIdleFloat()
      window.cancelAnimationFrame(frame)
    },
    {
      onSlideTransition() {
        stopIdleFloat()
        scheduleIdleFloat()
      },
    },
  )

  return destroy
}
