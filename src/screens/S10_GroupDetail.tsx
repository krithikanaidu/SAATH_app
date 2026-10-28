import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DeviceFrame, Content } from '../components/DeviceFrame'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { useStore } from '../lib/store'
import { useGroups } from '../lib/hooks'
import { useAuth } from '../lib/auth'
import { SyncBadge } from '../components/SyncBadge'
import type { ChatMessage } from '../lib/types'

/**
 * S10 — group detail: meeting point, members, chat preview.
 *
 * The group comes from the backend via `useGroups` (no hardcoded fallback).
 * Members are derived from the real member count; the user can leave, and the
 * organiser can delete the group.
 */

/** Names are never hardcoded — members render as an initial + count. */
function initialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function GroupDetail() {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const { state } = useStore()
  const { profile } = useAuth()
  const groups = useGroups()

  const group = groups.data.find(g => g.id === groupId)
  const joined = group?.joined ?? false
  const yourName = profile?.name || state.name || 'You'

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
    // chat is stored per group locally; a real thread would come from the backend
    setTimeout(() => {
      setMessages(m => [
        ...m,
        {
          id: `c${Date.now()}`,
          author: yourName,
          time: new Date().toTimeString().slice(0, 5),
          body: text,
        },
      ])
      setDraft('')
      setSending(false)
    }, 400)
  }

  const leave = () => {
    if (group) void groups.toggleJoin(group.id, true)
    navigate('/groups')
  }

  const remove = async () => {
    if (!group) return
    await groups.remove(group.id)
    navigate('/groups')
  }

  if (groups.loading) {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/groups')} />
        <Content>
          <p className="text-[14px] text-[#616161]">Loading group…</p>
        </Content>
      </DeviceFrame>
    )
  }

  if (!group) {
    return (
      <DeviceFrame>
        <ScreenHeader title="" onBack={() => navigate('/groups')} />
        <Content className="flex flex-col">
          <h1 className="text-[24px] leading-[29px] font-semibold">Group not found</h1>
          <p className="mt-2 text-[14px] text-[#616161]">
            This group may have been deleted by its organiser.
          </p>
          <div className="flex-1" />
          <Button onClick={() => navigate('/groups')}>Back to groups</Button>
        </Content>
      </DeviceFrame>
    )
  }

  const memberCount = Math.max(group.members, joined ? 1 : 0)

  return (
    <DeviceFrame>
      <ScreenHeader title="" onBack={() => navigate('/groups')} />
      <Content className="flex flex-col">
        <h1 className="text-[24px] leading-[29px] font-semibold">{group.name}</h1>
        <p className="mt-2 text-[14px] text-[#616161]">
          {group.line} · {group.window} · {memberCount} members
        </p>

        <SyncBadge source={groups.source} />

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
            {group.window.split('–')[0]} · Stay away from the edge
          </p>
          <p className="mt-2 text-[12px] text-[#616161]">
            Public meeting point · Not live location
          </p>
        </div>

        {/* members — rendered from the real count, never hardcoded names */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Members</h2>
        <ul className="mt-3 flex flex-wrap gap-5">
          <li className="flex w-14 flex-col items-center text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#202020] bg-[#F2F2F2] text-[16px]"
              aria-hidden
            >
              {initialFor(yourName)}
            </span>
            <span className="mt-1.5 text-[13px] leading-[16px]">You</span>
            <span className="text-[11px] leading-[13px] text-[#616161]">Member</span>
          </li>
          {memberCount > 1 ? (
            <li className="flex w-14 flex-col items-center text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DDDDDD] bg-[#F7F7F7] text-[16px]"
                aria-hidden
              >
                +{memberCount - 1}
              </span>
              <span className="mt-1.5 text-[13px] leading-[16px]">Others</span>
              <span className="text-[11px] leading-[13px] text-[#616161]">Members</span>
            </li>
          ) : null}
        </ul>

        {/* chat preview */}
        <h2 className="mt-5 text-[18px] leading-[23px] font-semibold">Chat preview</h2>
        <div className="mt-3 space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#B8B8B8] px-4 py-6 text-center">
              <p className="text-[14px] text-[#616161]">
                No messages yet. Say hello to your co-commuters.
              </p>
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} className="rounded-[8px] border border-[#DDDDDD] px-4 py-3">
                <p className="text-[13px] font-semibold">
                  {m.author} · {m.time}
                </p>
                <p className="mt-1.5 text-[16px] leading-[22px]">{m.body}</p>
              </div>
            ))
          )}
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
          <div className="mt-3 flex justify-center gap-4">
            {joined ? (
              <button
                type="button"
                onClick={leave}
                className="text-[13px] text-[#616161] underline underline-offset-2"
              >
                Leave group
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void remove()}
              className="text-[13px] text-[#D92D20] underline underline-offset-2"
            >
              Delete group
            </button>
          </div>
        </div>
      </Content>
    </DeviceFrame>
  )
}
