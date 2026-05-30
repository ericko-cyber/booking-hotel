import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { authService } from '../../services/authService'
import styles from '../../components/Payment.module.css'

const checkoutSessionKey = (paymentId) => `midtrans-checkout-${paymentId}`

export default function PaymentPage() {
  const router = useRouter()
  const { id } = router.query
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openingCheckout, setOpeningCheckout] = useState(false)
  const [autoOpened, setAutoOpened] = useState(false)

  const loadPaymentById = async (paymentId) => {
    const res = await api.get(`/payments/${paymentId}`)
    const payload = res?.data || res
    return payload?.data || payload
  }

  const refreshUserProfile = async () => {
    try {
      const res = await authService.getCurrentUser()
      const payload = res?.data?.data || res?.data || res
      const user = payload?.user || payload
      if (user && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user))
      }
      return user
    } catch (err) {
      console.error('Failed to refresh user profile after payment', err)
      return authService.getUser()
    }
  }

  const redirectToDashboard = async (paymentData) => {
    const user = await refreshUserProfile()
    const membershipTier = (user?.membership_tier || paymentData?.membership_tier || paymentData?.membershipTier || 'none').toString()
    const membershipStatus = (user?.membership_status || paymentData?.membership_status || paymentData?.membershipStatus || 'active').toString()

    router.replace({
      pathname: '/',
      query: {
        membership_tier: membershipTier,
        membership_status: membershipStatus,
        payment: 'success',
      },
    })
  }

  const syncPaymentStatus = async (paymentId) => {
    const res = await api.post(`/payments/${paymentId}/sync`)
    const payload = res?.data || res
    const updatedPayment = payload?.data || payload
    setPayment(updatedPayment)
    return updatedPayment
  }

  useEffect(() => {
    if (!router.isReady || !id) return

    const hasMidtransReturnParams = Boolean(
      router.query?.order_id ||
      router.query?.transaction_status ||
      router.query?.status_code
    )

    const fetchPayment = async () => {
      try {
        setLoading(true)
        const data = await loadPaymentById(id)
        const resolvedPayment = data?.data || data
        setPayment(resolvedPayment)

        if (hasMidtransReturnParams) {
          await syncPaymentStatus(id)
          await redirectToDashboard(resolvedPayment)
          return
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPayment()
  }, [id, router, router.isReady, router.query?.order_id, router.query?.transaction_status, router.query?.status_code])

  const openMidtransCheckout = async () => {
    try {
      setOpeningCheckout(true)
      const res = await api.post(`/payments/${payment.id}/midtrans`)
      const data = res?.data || res
      const checkoutUrl = data?.checkout_url || data?.data?.checkout_url
      if (checkoutUrl) {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(checkoutSessionKey(payment.id), '1')
        }
        window.location.assign(checkoutUrl)
        return
      }
      alert('Checkout Midtrans tidak tersedia.')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat checkout Midtrans')
    } finally {
      setOpeningCheckout(false)
    }
  }

  useEffect(() => {
    if (!payment?.id || autoOpened) return

    const autoOpen = async () => {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage.getItem(checkoutSessionKey(payment.id)) === '1') {
          window.sessionStorage.removeItem(checkoutSessionKey(payment.id))
          await syncPaymentStatus(payment.id)
          return
        }

        setOpeningCheckout(true)
        const res = await api.post(`/payments/${payment.id}/midtrans`)
        const data = res?.data || res
        const checkoutUrl = data?.checkout_url || data?.data?.checkout_url
        if (checkoutUrl) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(checkoutSessionKey(payment.id), '1')
          }
          window.location.assign(checkoutUrl)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setOpeningCheckout(false)
        setAutoOpened(true)
      }
    }

    autoOpen()
  }, [payment?.id, autoOpened])

  if (loading) return <div style={{padding: 20}}>Memuat...</div>
  if (!payment) return <div style={{padding: 20}}>Pembayaran tidak ditemukan.</div>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Halaman Pembayaran</h1>
      <p className={styles.info}>ID Pembayaran: {payment.id}</p>
      <p className={styles.info}>Jumlah: Rp{Number(payment.amount).toLocaleString('id-ID')}</p>
      <p className={styles.info}>Status: {payment.status}</p>

      <p className={styles.info}>
        Untuk tujuan demo, klik tombol di bawah untuk membuka halaman checkout eksternal (sandbox).
      </p>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={openMidtransCheckout} disabled={openingCheckout}>
          {openingCheckout ? 'Membuka Midtrans...' : 'Bayar via Midtrans Sandbox'}
        </button>
        <button className={`${styles.btn} ${styles.secondary}`} style={{marginLeft:12}} onClick={async () => {
          try {
            const res = await api.post(`/payments/${payment.id}/confirm`)
            const payload = res?.data || res
            const data = payload?.data || payload
            if (data) {
              if (data?.payment) {
                setPayment(data.payment)
              } else {
                await syncPaymentStatus(payment.id)
              }
              await redirectToDashboard(data?.payment || payment)
              alert('Pembayaran berhasil dan status diperbarui.')
            }
          } catch (err) {
            console.error(err)
            alert('Gagal mengonfirmasi pembayaran')
          }
        }}>Simulasikan Bayar Sukses</button>
     </div>
    </div>
  )
}
