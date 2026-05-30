import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import styles from '../ApprovedList.module.css'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

const resolveImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return value
}

const normalizeHotel = (hotel, index = 0) => ({
  id: hotel.id,
  name: hotel.name,
  location: hotel.location,
  price: hotel.price,
  rating: hotel.rating,
  tags: hotel.tags || [],
  image: resolveImageUrl(hotel.image || hotel.bgImageUrl || ''),
  bg: hotel.bg || ['linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)', 'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)', 'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)'][index % 3],
})

export default function ApprovedList({ initialHotels = [] }) {
  const [saved, setSaved] = useState([])
  const [activeIndex, setActiveIndex] = useState(() => 0)
  const [pauseAuto, setPauseAuto] = useState(false)
  const [slideStep, setSlideStep] = useState(384)
  // translateX will be computed to precisely center the active card
  const [translateX, setTranslateX] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const groupRef = useRef(null)

  const properties = useMemo(() => {
    return initialHotels.length > 0
      ? initialHotels.map(normalizeHotel)
      : []
  }, [initialHotels])

  const carouselItems = useMemo(() => [...properties, ...properties, ...properties], [properties])
  const baseIndex = properties.length

  const toggleSave = (id) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handlePrev = () => {
    setActiveIndex((current) => current - 1)
  }

  const handleNext = () => {
    setActiveIndex((current) => current + 1)
  }

  // Handle wrap-around with smooth transition: when we land beyond the duplicated window,
  // jump back to the middle copy while temporarily disabling transition so user doesn't see the reset.
  const handleTransitionEnd = () => {
    if (activeIndex >= baseIndex + properties.length) {
      setIsJumping(true)
      setActiveIndex(baseIndex)
      return
    }

    if (activeIndex < baseIndex) {
      setIsJumping(true)
      setActiveIndex(baseIndex + properties.length - 1)
    }
  }

  useEffect(() => {
    if (!isJumping) return undefined

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsJumping(false)
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [isJumping])

  useEffect(() => {
    if (pauseAuto || properties.length < 2) return undefined

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => current + 1)
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [pauseAuto, properties.length])

  useLayoutEffect(() => {
    const measure = () => {
      const group = groupRef.current
      if (!group) return

      const firstCard = group.querySelector(`.${styles.card}`)
      if (!firstCard) return

      const cardWidth = firstCard.getBoundingClientRect().width
      const gap = Number.parseFloat(window.getComputedStyle(group).columnGap || window.getComputedStyle(group).gap || '0') || 0
      setSlideStep(cardWidth + gap)
      // nothing else here; translateX will be computed based on active card
    }

    measure()

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [properties.length])

  useLayoutEffect(() => {
    if (properties.length) {
      setActiveIndex(properties.length)
    }
  }, [properties.length])

  // compute precise translateX so the active card is centered in the viewport
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group || !properties.length) return

    const children = group.children
    const activeEl = children[activeIndex]
    const viewport = group.parentElement
    if (!activeEl || !viewport) return

    const groupRect = group.getBoundingClientRect()
    const cardRect = activeEl.getBoundingClientRect()
    const offsetWithinGroup = cardRect.left - groupRect.left
    const vpWidth = viewport.getBoundingClientRect().width
    const desired = -offsetWithinGroup + (vpWidth - cardRect.width) / 2
    setTranslateX(desired)
  }, [activeIndex, slideStep, properties.length, isJumping])


  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Pilihan Terbaik</p>
        <h2 className={styles.title}>Daftar Rekomendasi</h2>
        <p className={styles.subtitle}>
          Tim kami meninjau setiap properti. Hanya hotel terbaik yang masuk daftar ini.
        </p>
      </div>

      <div className={styles.carouselWrap}>
        <button className={styles.arrowBtn} onClick={handlePrev} aria-label="Properti sebelumnya">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.carouselViewport}>
            <div
              className={styles.carouselTrack}
              onMouseEnter={() => setPauseAuto(true)}
              onMouseLeave={() => setPauseAuto(false)}
              onTransitionEnd={handleTransitionEnd}
            >
            <div
              className={`${styles.carouselGroup} ${isJumping ? styles.carouselGroupJumping : ''}`}
              ref={groupRef}
              style={{ transform: `translateX(${translateX}px)` }}
            >
              {carouselItems.map((prop, index) => {
                const classes = [
                  styles.card,
                  index === activeIndex ? styles.cardActive : '',
                  Math.abs(index - activeIndex) === 1 ? styles.cardSide : '',
                  Math.abs(index - activeIndex) > 1 ? styles.cardDim : '',
                ].filter(Boolean).join(' ')

                const articleNode = (
                  <article key={`${prop.id}-${index}`} className={classes}>
                    <div
                      className={styles.cardImg}
                      style={prop.image
                        ? {
                            background: prop.bg,
                            backgroundImage: `url("${prop.image}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                          }
                        : { background: prop.bg }}
                    >
                      <div className={styles.ratingBadge}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#c49a3c" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {prop.rating}
                      </div>

                      <button
                        className={`${styles.saveBtn} ${saved.includes(prop.id) ? styles.saved : ''}`}
                        onClick={() => toggleSave(prop.id)}
                        title="Simpan properti"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved.includes(prop.id) ? '#e05a5a' : 'none'} stroke={saved.includes(prop.id) ? '#e05a5a' : 'white'} strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardTop}>
                        <div>
                          <h3 className={styles.propName}>{prop.name}</h3>
                          <p className={styles.propLocation}>{prop.location}</p>
                        </div>
                        <div className={styles.priceBlock}>
                          <span className={styles.currency}>Rp</span>
                          <strong className={styles.price}>{Number(prop.price || 0).toLocaleString('id-ID')}</strong>
                          <span className={styles.perNight}>/ malam</span>
                        </div>
                      </div>

                      <div className={styles.tags}>
                        {prop.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </article>
                )

                if (index === activeIndex) {
                  return (
                    <Link key={`link-${prop.id}-${index}`} href={`/hotels/${prop.id}`}>
                      {articleNode}
                    </Link>
                  )
                }

                return articleNode
              })}
            </div>
          </div>
        </div>

        <button className={styles.arrowBtn} onClick={handleNext} aria-label="Properti berikutnya">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </section>
  )
}