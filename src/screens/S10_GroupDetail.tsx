import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { BUDDY_GROUPS, GROUP_CHAT, GROUP_MEMBERS } from '../lib/mockData'

/** S10 — group detail: meeting point, members, chat preview. */

export function GroupDetail() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const { state, update } = useStore()

  const group =
    [...BUDDY_GROUPS, ...(state.customGroups ?? [])].find(g => g.id === groupId) ??
    BUDDY_GROUPS[0]
  const joined = state.joinedGroupIds.includes(group.id)

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(GROUP_CHAT)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const send = () => {
    const text = draft.trim()
    if (!text) {
      setError('Write a message first.')
      return
    }
    setError(null)
    setSending(true)
    // mock send — a real backend would persist this to the group thread
    setTimeout(() => {
      setMessages(m => [
        ...m,
        { id: `c${Date.now()}`, author: 'Asha', time: '08:21', body: text },
      ])
      setDraft('')
      setSending(false)
    }, 500)
  }

  const leave = () =>
    update({ joinedGroupIds: state.joinedGroupIds.filter(id => id !== group.id) })

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/groups')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">{group.name}</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          {group.line} · {group.window} · {group.members} members
        </p>

        <p className="mt-4 text-[14px]">
          {group.verifiedOrganiser ? '✓ Phone-verified organiser' : 'Organiser not verified'}
          {joined ? ' · You joined' : ''}
        </p>

        {/* meeting point */}
        <div className="mt-3 rounded-[8px] bg-[#F2F2F2] px-4 py-4">
          <h2 className="text-[18px] leading-[23px] font-semibold">Meeting point</h2>
          <p className="mt-2 text-[16px] leading-[24px]">
            {group.from} · Platform 3, near the stairs
            <br />
            08:22 AM · Stay away from the edge
          </p>
          <p className="mt-2 text-[12px] text-[#616161]">
            Public meeting point · Not live location
          </p>
        </div>

        {/* members */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Members</h2>
        <ul className="mt-3 flex gap-5">
          {GROUP_MEMBERS.map(m => (
            <li key={m.id} className="flex w-14 flex-col items-center text-center">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border text-[16px] ${
                  m.role === 'You' ? 'border-[#202020] bg-[#F2F2F2]' : 'border-[#DDDDDD] bg-[#F7F7F7]'
                }`}
                aria-hidden
              >
                {m.initial}
              </span>
              <span className="mt-1.5 text-[13px] leading-[16px]">{m.name}</span>
              <span className="text-[11px] leading-[13px] text-[#616161]">{m.role}</span>
            </li>
          ))}
        </ul>

        {/* chat preview */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Chat preview</h2>
        <div className="mt-3 space-y-3">
          {messages.map(m => (
            <div key={m.id} className="rounded-[8px] border border-[#DDDDDD] px-4 py-3">
              <p className="text-[13px] font-semibold">
                {m.author} · {m.time}
              </p>
              <p className="mt-1.5 text-[16px] leading-[22px]">{m.body}</p>
            </div>
          ))}
        </div>

        {/* message input */}
        <div className="mt-4 space-y-1.5">
          <label htmlFor="msg" className="block text-[14px] font-semibold">
            Message
          </label>
          <textarea
            id="msg"
            rows={2}
            value={draft}
            onChange={e => {
              setDraft(e.target.value)
              setError(null)
            }}
            placeholder="I’ll meet you near the stairs."
            aria-invalid={error ? true : undefined}
            className={`w-full resize-none rounded-[8px] border bg-white px-4 py-3 text-[16px] ${
              error ? 'border-[#D92D20]' : 'border-[#DDDDDD]'
            }`}
          />
          {error ? (
            <p role="alert" className="text-[12px] text-[#D92D20]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-4 pb-2">
          <Button onClick={send} disabled={sending}>
            {sending ? 'Sending…' : 'Send message'}
          </Button>
          {joined ? (
            <button
              type="button"
              onClick={leave}
              className="mx-auto mt-3 block text-[13px] text-[#616161] underline underline-offset-2"
            >
              Leave group
            </button>
          ) : null}
        </div>
      </Content>
    </DeviceFrame>
  )
}
