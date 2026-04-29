import Navbar from '../components/layout/Navbar'
import Hero from '../components/sections/Hero'
import MembershipSection from '../components/sections/MembershipSection'
import DiscoverAtmosphere from '../components/sections/DiscoverAtmosphere'
import ApprovedList from '../components/sections/ApprovedList'
import Newsletter from '../components/sections/Newsletter'
import Footer from '../components/layout/Footer'
import MembershipModal from '../components/modals/MembershipModal'
import { useState } from 'react'

export default function Home() {
  const [showMembership, setShowMembership] = useState(false)

  return (
    <>
      <Navbar />
      <Hero />
      <MembershipSection onApply={() => setShowMembership(true)} />
      <DiscoverAtmosphere />
      <ApprovedList />
      <Newsletter />
      <Footer />
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}
    </>
  )
}
