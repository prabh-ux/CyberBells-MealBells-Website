import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import searchIcon from '../../assets/searchIcon.png'
import bellIcon from '../../assets/bellIcon.png'
import helpIcon from '../../assets/helpIcon.png'
import adminAvatar from '../../assets/adminAvatar.png'

const AdminHeader = () => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white font-[var(--font-inter)]">

      {/* Left — Brand */}
      <button  onClick={() => navigate('/')} className="font-[var(--font-manrope)] text-[#EA580C] font-bold text-lg tracking-tight shrink-0">
        <span className="sm:hidden">MB Admin</span>
        <span className="hidden sm:inline">MealBells Admin</span>
      </button>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute left-0 top-0 w-full h-14 bg-white px-4 flex items-center gap-3 z-10 border-b border-gray-200 sm:hidden">
          <img src={searchIcon} alt="search" className="w-4 h-4 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search resources..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[#6B7280] outline-none"
          />
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="text-[#6B7280] text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Right — controls */}
      <div className="flex items-center gap-3">

        {/* Search bar — visible on sm+ */}
        <div className="hidden sm:flex items-center gap-2 bg-[#EEEEEE] rounded-xl px-3 py-1.5">
          <img src={searchIcon} alt="search" className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Search resources..."
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[#6B7280] outline-none w-48"
          />
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src={searchIcon} alt="search" className="w-5 h-5 object-contain" />
        </button>

        {/* Bell */}
        <button
          type="button"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src={bellIcon} alt="notifications" className="w-5 h-5 object-contain" />
        </button>

        {/* Help */}
        <button
          type="button"
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src={helpIcon} alt="help" className="w-5 h-5 object-contain" />
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate('/admin/profile')}
          className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0 hover:ring-2 hover:ring-orange-400 transition-all"
        >
          <img src={adminAvatar} alt="admin avatar" className="w-full h-full object-cover" />
        </button>

      </div>
    </header>
  )
}

export default AdminHeader