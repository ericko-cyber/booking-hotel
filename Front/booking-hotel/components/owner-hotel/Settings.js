import { useState, useEffect } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, Card, Btn, Field, Input } from './OwnerUI'
import styles from '../Settings.module.css'
import api from '../../lib/api'

const normalizeProfileValue = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (typeof value === 'object') {
    if (typeof value.String === 'string') {
      return value.Valid === false ? '' : value.String
    }

    if (typeof value.value === 'string') {
      return value.value
    }
  }

  return ''
}

const normalizeProfileData = (data = {}) => ({
  name: normalizeProfileValue(data.name),
  email: normalizeProfileValue(data.email),
  phone: normalizeProfileValue(data.phone),
  address: normalizeProfileValue(data.address),
  city: normalizeProfileValue(data.city),
  province: normalizeProfileValue(data.province),
  postal_code: normalizeProfileValue(data.postal_code),
  bio: normalizeProfileValue(data.bio),
  profile_image: normalizeProfileValue(data.profile_image),
})

export default function OwnerSettings() {
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', bio: '', profile_image: '',
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [passSaved, setPassSaved] = useState(false)
  const [passErr, setPassErr] = useState('')

  const setP = k => e => setProfile(p => ({ ...p, [k]: e.target.value }))
  const setPw = k => e => setPasswords(p => ({ ...p, [k]: e.target.value }))

  const saveProfile = async () => {
    try {
      const payload = normalizeProfileData(profile)
      await api.put('/auth/profile', payload)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save profile', err)
      alert(err?.message || 'Failed to save profile')
    }
  }

  const savePassword = () => {
    setPassErr('')
    if (!passwords.current) { setPassErr('Enter your current password.'); return }
    if (passwords.newPass.length < 8) { setPassErr('New password must be at least 8 characters.'); return }
    if (passwords.newPass !== passwords.confirm) { setPassErr('Passwords do not match.'); return }
    // call backend password change endpoint
    ;(async () => {
      try {
        await api.put('/auth/password', { current_password: passwords.current, new_password: passwords.newPass })
        setPassSaved(true)
        setPasswords({ current: '', newPass: '', confirm: '' })
        setTimeout(() => setPassSaved(false), 2500)
      } catch (err) {
        console.error('Password change failed', err)
        setPassErr(err?.message || 'Failed to update password')
      }
    })()
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/auth/profile')
        if (!mounted) return
        const data = res.data || res
        setProfile(normalizeProfileData(data))
      } catch (err) {
        console.error('Failed to load profile', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <OwnerLayout active="settings">
      <PageHeader title="Profile & Settings" subtitle="Manage your account details and security" />

      <div className={styles.layout}>
        <div className={styles.left}>
          {/* ── Profile card ── */}
          <Card>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>Personal Information</h3>
                <p className={styles.sectionSub}>Update your name, email, and contact details.</p>
              </div>
              <div className={styles.avatarBig}>JR</div>
            </div>

            <div className={styles.twoField}>
            <Field label="Full Name">
              <Input value={profile.name} onChange={setP('name')} />
            </Field>
            <Field label="Email Address">
              <Input type="email" value={profile.email} disabled />
            </Field>
            <div className={styles.twoField}>
              <Field label="Phone Number">
                <Input value={profile.phone} onChange={setP('phone')} />
              </Field>
              <Field label="City">
                <Input value={profile.city} onChange={setP('city')} />
              </Field>
            </div>
            <div className={styles.twoField}>
              <Field label="Province">
                <Input value={profile.province} onChange={setP('province')} />
              </Field>
              <Field label="Postal Code">
                <Input value={profile.postal_code} onChange={setP('postal_code')} />
              </Field>
            </div>
            <Field label="Address">
              <Input value={profile.address} onChange={setP('address')} />
            </Field>
            <Field label="Short Bio" hint="Visible to platform administrators only.">
              <textarea
                className={styles.textarea}
                rows={3}
                value={profile.bio}
                onChange={setP('bio')}
              />
            </Field>
            </div>

            <div className={styles.saveRow}>
              {profileSaved && <span className={styles.savedMsg}>✓ Changes saved</span>}
              <Btn onClick={saveProfile}>Save Profile</Btn>
            </div>
          </Card>

          {/* ── Password card ── */}
          <Card>
            <h3 className={styles.sectionTitle}>Change Password</h3>
            <p className={styles.sectionSub}>We recommend a strong, unique password of at least 12 characters.</p>

            <div className={styles.spacer} />
            <Field label="Current Password">
              <Input type="password" placeholder="••••••••" value={passwords.current} onChange={setPw('current')} />
            </Field>
            <div className={styles.twoField}>
              <Field label="New Password">
                <Input type="password" placeholder="••••••••" value={passwords.newPass} onChange={setPw('newPass')} />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" placeholder="••••••••" value={passwords.confirm} onChange={setPw('confirm')} />
              </Field>
            </div>

            {passErr && <p className={styles.errMsg}>{passErr}</p>}
            <div className={styles.saveRow}>
              {passSaved && <span className={styles.savedMsg}>✓ Password updated</span>}
              <Btn onClick={savePassword}>Update Password</Btn>
            </div>
          </Card>
        </div>

        {/* ── Right info panels ── */}
        <div className={styles.right}>
          <Card>
            <h3 className={styles.sectionTitle}>Account Summary</h3>
            <div className={styles.metaList}>
              {[
                ['Role', 'Hotel Owner'],
                ['Member Since', 'August 2023'],
                ['Properties', '4 hotels'],
                ['Status', 'Active'],
              ].map(([label, val]) => (
                <div key={label} className={styles.metaRow}>
                  <span>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className={styles.sectionTitle}>Platform Rules</h3>
            <ul className={styles.ruleList}>
              <li>You can only manage hotels that you own.</li>
              <li>Hotels require admin approval before appearing to guests.</li>
              <li>You cannot change your hotel's approval status.</li>
              <li>Bookings are read-only — contact support for disputes.</li>
              <li>Voucher requests are subject to platform policy.</li>
            </ul>
          </Card>

          <Card>
            <h3 className={styles.sectionTitle}>Need Help?</h3>
            <p className={styles.helpText}>Contact our owner support team for platform issues, billing questions, or property disputes.</p>
            <a href="mailto:owners@sanctuaryluxe.com" className={styles.supportLink}>
              owners@sanctuaryluxe.com
            </a>
            <Btn variant="outline" onClick={() => {}} style={{ marginTop: 12, width: '100%' }}>Open Support Ticket</Btn>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  )
}