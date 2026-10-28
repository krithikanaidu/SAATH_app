import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { AuthProvider } from './lib/auth'
import { Analytics } from "@vercel/analytics/react"
import { SplashLanguage } from './screens/S01_SplashLanguage'
import { Onboarding } from './screens/S02_Onboarding'
import { SignUp } from './screens/S03_SignUp'
import { ProfileSetup } from './screens/S04_ProfileSetup'
import { Home } from './screens/S05_Home'
import { TrainDetail } from './screens/S06_TrainDetail'
import { SmartWindow } from './screens/S07_SmartWindow'
import { VirtualQueue } from './screens/S08_VirtualQueue'
import { Groups } from './screens/S09_Groups'
import { GroupDetail } from './screens/S10_GroupDetail'
import { QuickSOS } from './screens/S11_QuickSOS'
import { Rewards } from './screens/S12_Rewards'
import { NotFound } from './screens/NotFound'

/** Scroll each new route back to the top. */
function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('.screen')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Gate: onboarding runs until it completes; signed-in users skip it. */
function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  if (!state.onboarded) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <>
      <ScrollReset />
      <Routes>
        {/* --- onboarding (always reachable, resets the gate) --- */}
        <Route path="/" element={<SplashLanguage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/setup" element={<ProfileSetup />} />

        {/* --- signed-in app --- */}
        <Route
          path="/home"
          element={
            <RequireOnboarded>
              <Home />
            </RequireOnboarded>
          }
        />
        <Route
          path="/train/:trainId"
          element={
            <RequireOnboarded>
              <TrainDetail />
            </RequireOnboarded>
          }
        />
        <Route
          path="/smart-window"
          element={
            <RequireOnboarded>
              <SmartWindow />
            </RequireOnboarded>
          }
        />
        <Route
          path="/queue"
          element={
            <RequireOnboarded>
              <VirtualQueue />
            </RequireOnboarded>
          }
        />
        <Route
          path="/groups"
          element={
            <RequireOnboarded>
              <Groups />
            </RequireOnboarded>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <RequireOnboarded>
              <GroupDetail />
            </RequireOnboarded>
          }
        />
        <Route
          path="/sos"
          element={
            <RequireOnboarded>
              <QuickSOS />
            </RequireOnboarded>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireOnboarded>
              <Rewards />
            </RequireOnboarded>
          }
        />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  )
}
