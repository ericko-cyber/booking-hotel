import { useMemo } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, Card, StatusBadge, Empty } from './OwnerUI'
import { OWNER_VOUCHERS } from './OwnerData'
import styles from '../Vouchers.module.css'

export default function OwnerVouchers() {
  const vouchers = useMemo(() => OWNER_VOUCHERS || [], [])

  return (
    <OwnerLayout active="vouchers">
      <PageHeader
        title="Owner Vouchers"
        subtitle={`${vouchers.length} voucher tersedia untuk properti Anda`}
      />

      {vouchers.length === 0 ? (
        <Empty
          icon="M20 12V8H4v10a2 2 0 0 0 2 2h6"
          title="Belum ada voucher"
          desc="Tambahkan voucher promo untuk meningkatkan booking hotel Anda."
        />
      ) : (
        <div className={styles.grid}>
          {vouchers.map((voucher) => (
            <Card key={voucher.code} className={styles.card}>
              <div className={styles.code}>{voucher.code}</div>
              <div className={styles.detailRow}>
                <span>Type</span>
                <strong>{voucher.type}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Discount</span>
                <strong>{voucher.discount}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Min Spend</span>
                <strong>{voucher.minSpend}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Usage</span>
                <strong>{voucher.uses}/{voucher.maxUses}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Expiry</span>
                <strong>{voucher.expiry}</strong>
              </div>
              <StatusBadge status={voucher.status} />
            </Card>
          ))}
        </div>
      )}
    </OwnerLayout>
  )
}
