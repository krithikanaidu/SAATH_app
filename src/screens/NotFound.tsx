import { useNavigate } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'

/** Fallback route for unknown URLs (direct navigation / stale links). */
export function NotFound() {
  const navigate = useNavigate()
  return (
    <DeviceFrame nav={false}>
      <Content className="flex flex-col items-center justify-center text-center">
        <p className="text-[48px] leading-none font-semibold">404</p>
        <h1 className="mt-4 text-[18px] font-semibold">This screen doesn’t exist</h1>
        <p className="mt-2 max-w-[260px] text-[14px] leading-[20px] text-[#616161]">
          The link may be out of date. Head back to your journey.
        </p>
        <div className="mt-6 w-full max-w-[260px] space-y-2">
          <Button onClick={() => navigate('/home')}>Go to home</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Start over
          </Button>
        </div>
      </Content>
    </DeviceFrame>
  )
}
