import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { authService } from '../services/authService'
import { bookingService } from '../services/bookingService'

export default function PaymentPage() {
  const router = useRouter()
  const { bookingId } = router.query
  const [message, setMessage] = useState('Memuat data pembayaran...')
  const displayMessage = !bookingId ? 'Booking belum dipilih.' : message

  useEffect(() => {
    if (!router.isReady) return

    if (!authService.isAuthenticated()) {
      router.replace('/login')
      return
    }

    if (!bookingId) return

    let mounted = true
    const loadPayment = async () => {
      try {
        setMessage('Menyiapkan Midtrans Sandbox...')
        const booking = await bookingService.getBookingByIdNormalized(parseInt(bookingId, 10))
        const paymentId = booking?.paymentId || booking?.paymentDetail?.id
        const checkoutUrl = booking?.paymentDetail?.checkout_url || booking?.paymentDetail?.checkoutUrl || booking?.checkoutUrl

        if (!mounted) return

        if (checkoutUrl) {
          window.location.replace(checkoutUrl)
          return
        }

        if (paymentId) {
          router.replace(`/payment/${paymentId}`)
          return
        }

        setMessage('Pembayaran belum siap. Silakan coba lagi dari booking yang sama.')
      } catch (error) {
        console.error('Failed to load booking payment', error)
        if (mounted) setMessage('Gagal memuat data pembayaran.')
      }
    }

    loadPayment()

    return () => {
      mounted = false
    }
  }, [bookingId, router])

  return (
    <>
      <Navbar />
      <main style={{ padding: '120px 20px 40px', textAlign: 'center', minHeight: '70vh' }}>
        <p>{displayMessage}</p>
      </main>
      <Footer />
    </>
  )
}
