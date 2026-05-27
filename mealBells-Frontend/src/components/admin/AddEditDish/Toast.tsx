import React from 'react'
import type { ToastState } from '../../../types/admin';

const Toast = ({ toast, onClose }: { toast: ToastState; onClose: () => void }) => {
if (!toast.visible) return null
  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:min-w-[220px] sm:max-w-[360px] z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-[14px] font-medium shadow-xl animate-[toastIn_0.22s_ease] ${
      toast.type === 'success' ? 'bg-[#1a1a1a]' : 'bg-red-900'
    }`}>
      <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
        toast.type === 'success' ? 'bg-[#FF7A00]' : 'bg-red-500'
      }`}>
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="text-white/60 hover:text-white text-base leading-none px-0.5">×</button>
    </div>
  )
}

export default Toast

