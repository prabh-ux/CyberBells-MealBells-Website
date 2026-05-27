import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import bellIcon from '../../assets/bellIcon.png'
import { fetchMe } from '../../slices/authSlice'
import type { AppDispatch, RootState } from '../../app/store'

const UserHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((s: RootState) => s.auth)

  const isProfile      = location.pathname === '/user/profile'
  const isNotification = location.pathname === '/user/notification'

  React.useEffect(() => {
    if (!user) dispatch(fetchMe())
  }, [])

  const avatarSrc = user?.avatar || null
  const initials  = user?.name?.[0]?.toUpperCase() ?? "U"

  const Avatar = () => avatarSrc
    ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
    : <div className="w-full h-full bg-[#FFF4EC] flex items-center justify-center text-sm font-bold text-[#FA7000]">{initials}</div>

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
      <button onClick={() => navigate('/user/today-menu')} className="text-[#EA580C] font-bold text-lg tracking-tight shrink-0">
        MealBells
      </button>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/user/notification')}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            isNotification
              ? 'bg-orange-100 ring-2 ring-orange-400'
              : 'hover:bg-gray-100'
          }`}
        >
          <img
            src={bellIcon}
            alt="notifications"
            className={`w-5 h-5 object-contain ${isNotification ? 'opacity-100' : 'opacity-70'}`}
          />
        </button>

        {/* Avatar / Profile */}
        <button
          type="button"
          onClick={() => navigate('/user/profile')}
          className={`w-9 h-9 rounded-full overflow-hidden border transition-all shrink-0 ${
            isProfile
              ? 'border-orange-400 ring-2 ring-orange-400'
              : 'border-gray-200 hover:ring-2 hover:ring-orange-400'
          }`}
        >
          <Avatar />
        </button>
      </div>
    </header>
  )
}

export default UserHeader