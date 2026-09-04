export type CardMediaKind = "image" | "video"

export type CardMedia = {
  kind: CardMediaKind
  src: string
  poster?: string
}

function svg(html: string) {
  const wrap = document.createElement("div")
  wrap.innerHTML = html.trim()
  return wrap.firstElementChild as SVGSVGElement
}

function authoredSrc(el: HTMLElement | null, attr = "src") {
  if (!el) return ""
  return el.getAttribute(attr)?.trim() || ""
}

function videoSrc(video: HTMLVideoElement | null) {
  if (!video) return ""
  return (
    authoredSrc(video.querySelector("source")) ||
    authoredSrc(video) ||
    video.currentSrc ||
    ""
  )
}

function imageSrc(img: HTMLImageElement | null) {
  if (!img) return ""
  return authoredSrc(img) || img.currentSrc || img.src || ""
}

function readMediaFrom(host: ParentNode | null): CardMedia | null {
  if (!host) return null
  const video = host.querySelector<HTMLVideoElement>("video")
  const src = videoSrc(video)
  if (src) return { kind: "video", src, poster: authoredSrc(video, "poster") || undefined }
  const img = host.querySelector<HTMLImageElement>("img")
  const imgSrc = imageSrc(img)
  if (imgSrc) return { kind: "image", src: imgSrc }
  return null
}

export function readNupCardMedia(card: HTMLElement | undefined): CardMedia | null {
  if (!card) return null
  return readMediaFrom(card.querySelector(".card__image__wrapper") ?? card)
}

export function readMediaBlade(section: HTMLElement): { title: string; media: CardMedia } | null {
  const title =
    section.querySelector(".display_caption")?.textContent?.replace(/\s+/g, " ").trim() ?? ""
  const host =
    section.querySelector(".video__wrapper, .image__wrapper") ?? section
  const media = readMediaFrom(host)
  if (!media) return null
  return { title, media }
}

function createGlassCover() {
  const glass = document.createElement("div")
  glass.className = "slide-card-glass"
  glass.setAttribute("aria-hidden", "true")
  return glass
}

function createCardMediaEl(media: CardMedia) {
  if (media.kind === "video") {
    const video = document.createElement("video")
    video.className = "slide-card-photo"
    video.src = media.src
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.autoplay = true
    video.preload = "auto"
    video.disablePictureInPicture = true
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    video.setAttribute("disablepictureinpicture", "")
    if (media.poster) video.poster = media.poster
    return video
  }

  const img = document.createElement("img")
  img.className = "slide-card-photo"
  img.src = media.src
  img.alt = ""
  return img
}

function bindCardAspect(card: HTMLElement, media: HTMLImageElement | HTMLVideoElement) {
  const apply = (width: number, height: number) => {
    if (!width || !height) return
    card.style.setProperty("--media-aspect", `${width} / ${height}`)
  }

  if (media instanceof HTMLVideoElement) {
    const onMeta = () => apply(media.videoWidth, media.videoHeight)
    if (media.readyState >= 1) onMeta()
    else media.addEventListener("loadedmetadata", onMeta, { once: true })
    return
  }

  const onLoad = () => apply(media.naturalWidth, media.naturalHeight)
  if (media.complete && media.naturalWidth) onLoad()
  else media.addEventListener("load", onLoad, { once: true })
}

export function createSlideCard(side: "left" | "right", media: CardMedia) {
  const card = document.createElement("div")
  card.className = `slide-card slide-card--${side}`
  card.dataset.cardMedia = media.kind

  const tilt = document.createElement("div")
  tilt.className = "slide-card-tilt"
  const glass = createGlassCover()
  const frame = document.createElement("div")
  frame.className = "slide-card-media"
  const mediaEl = createCardMediaEl(media)
  frame.append(mediaEl)
  if (media.kind === "video") {
    const cover = document.createElement("div")
    cover.className = "slide-card-media-cover"
    cover.setAttribute("aria-hidden", "true")
    frame.append(cover)
  }
  glass.append(frame)
  tilt.append(glass)
  card.append(tilt)
  bindCardAspect(card, mediaEl)
  return card
}

export function createLeftCard(media: CardMedia) {
  return createSlideCard("left", media)
}

export function createRightCard(media: CardMedia) {
  return createSlideCard("right", media)
}

export function createSlideMediaEl(media: CardMedia, title: string) {
  if (media.kind === "video") {
    const video = document.createElement("video")
    video.className = "slide-image"
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = "metadata"
    video.setAttribute("playsinline", "")
    video.setAttribute("webkit-playsinline", "")
    if (media.poster) video.poster = media.poster
    const source = document.createElement("source")
    source.src = media.src
    source.type = "video/mp4"
    video.append(source)
    return video
  }

  const img = document.createElement("img")
  img.className = "slide-image"
  img.src = media.src
  img.alt = title
  return img
}

export function createFrameSvg(uid: string) {
  return svg(`
    <svg class="slide-frame" viewBox="0 0 954 674" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M20 40C20 22.3269 34.3269 8 52 8H902C919.673 8 934 22.3269 934 40V610C934 627.673 919.673 642 902 642H52C34.3269 642 20 627.673 20 610V40Z" fill="white" fill-opacity="0.15" shape-rendering="crispEdges"/>
        <path d="M20 40C20 22.3269 34.3269 8 52 8H902C919.673 8 934 22.3269 934 40V610C934 627.673 919.673 642 902 642H52C34.3269 642 20 627.673 20 610V40Z" fill="url(#paint0_linear_75_12521-${uid})" fill-opacity="0.1" shape-rendering="crispEdges"/>
        <path d="M52 8.75H902C919.259 8.75 933.25 22.7411 933.25 40V610C933.25 627.259 919.259 641.25 902 641.25H52C34.7411 641.25 20.75 627.259 20.75 610V40C20.75 22.7411 34.7411 8.75 52 8.75Z" stroke="url(#paint1_linear_75_12521-${uid})" stroke-width="1.5" shape-rendering="crispEdges"/>
      </g>
      <defs>
        <linearGradient id="paint0_linear_75_12521-${uid}" x1="477" y1="8" x2="477" y2="642" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF5D2C" stop-opacity="0.6"/>
          <stop offset="1" stop-color="#FF5D2C"/>
        </linearGradient>
        <linearGradient id="paint1_linear_75_12521-${uid}" x1="934" y1="325" x2="167" y2="-187" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.1"/>
          <stop offset="0.8" stop-color="white" stop-opacity="0.2"/>
          <stop offset="1" stop-color="white" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
    </svg>
  `)
}

export function createArrowIcon() {
  return svg(`
    <svg style="width: 48px" width="48" height="48" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M32 64C49.6731 64 64 49.6731 64 32C64 14.3269 49.6731 0 32 0C14.3269 0 0 14.3269 0 32C0 49.6731 14.3269 64 32 64Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M20.2973 29.2163H40.9781L40.9781 33.8101H20.2973L20.2973 29.2163Z" fill="#001E5B"/>
      <path d="M33.4771 43.1345L42.464 34.1476C43.8992 32.7124 43.8992 30.3855 42.464 28.9504L33.5312 20.0176L30.283 23.2659L38.5661 31.549L30.2288 39.8862L33.4771 43.1345Z" fill="#001E5B"/>
    </svg>
  `)
}

export function createPlayIcon() {
  return svg(`
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M2.76904 15.1271V2.87321C2.76904 2.52706 3.21904 2.28475 3.53058 2.56167L15.0229 8.55014C15.2998 8.75783 15.2998 9.20783 15.0229 9.41552L3.53058 15.4732C3.21904 15.7155 2.76904 15.5078 2.76904 15.1271Z" fill="currentColor"/>
    </svg>
  `)
}
