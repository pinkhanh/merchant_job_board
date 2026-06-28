export function WorkerFooter() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="px-4 py-6">
        {/* Company info */}
        <div className="flex items-start gap-3 mb-6">
          <img src="/logo-momo.png" alt="MoMo" className="w-10 h-10 rounded shrink-0" />
          <div>
            <p className="font-bold text-sm leading-snug">CÔNG TY CỔ PHẦN DỊCH VỤ DI ĐỘNG TRỰC TUYẾN</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Lầu 6, Toà nhà Phú Mỹ Hưng, số 8 Hoàng Văn Thái, khu phố 1, P. Tân Phú, Q. 7, Thành phố Hồ Chí Minh
            </p>
          </div>
        </div>

        {/* MoMo links */}
        <div className="mb-5">
          <p className="font-bold text-sm mb-2">MoMo</p>
          <ul className="space-y-2">
            {['Giới thiệu', 'Điều khoản điều kiện', 'Blog', 'Liên hệ', 'Hỏi đáp'].map((link) => (
              <li key={link}>
                <span className="text-gray-400 text-sm">{link}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CSKH */}
        <div className="mb-5">
          <p className="font-bold text-sm mb-2">CHĂM SÓC KHÁCH HÀNG</p>
          <div className="text-gray-400 text-sm space-y-1">
            <p>Địa chỉ: Tầng M, Toà nhà Victory Tower, số 12 Tân Trào, P. Tân Phú, Q. 7, Thành phố Hồ Chí Minh</p>
            <p>Hotline: <span className="text-white">1900 5454 41</span> (1.000đ/phút)</p>
            <p>Email: <span className="text-white">hotro@momo.vn</span></p>
            <p>Tổng đài gọi ra: 028.7306.5555 - 028.9999.5555</p>
          </div>
          <button className="mt-3 flex items-center gap-2 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-left">
              <span className="block text-gray-400 text-[10px]">Hướng dẫn trợ giúp trên</span>
              <span className="font-bold">ỨNG DỤNG MOMO</span>
            </span>
          </button>
        </div>

        {/* Hợp tác doanh nghiệp */}
        <div className="mb-6">
          <p className="font-bold text-sm mb-2">HỢP TÁC DOANH NGHIỆP</p>
          <div className="text-gray-400 text-sm space-y-1">
            <p>Hotline: <span className="text-white">1900 636 652</span></p>
            <p>Email: <span className="text-white">merchant.care@momo.vn</span></p>
            <p>Website: <span className="text-white">business.momo.vn</span></p>
          </div>
          <button className="mt-3 flex items-center gap-2 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-left">
              <span className="block text-gray-400 text-[10px]">Hợp tác doanh nghiệp</span>
              <span className="font-bold">ĐĂNG KÝ HỢP TÁC</span>
            </span>
          </button>
        </div>

        {/* App download */}
        <div className="flex gap-3 mb-5">
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-black border border-gray-600 rounded-lg py-2.5 px-3">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-left">
              <span className="block text-gray-400 text-[9px]">Tải về trên</span>
              <span className="text-white text-xs font-semibold">App Store</span>
            </span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 bg-black border border-gray-600 rounded-lg py-2.5 px-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.3.17.64.22.99.15l12.6-7.27-2.83-2.83-10.76 9.95zM.5 1.53C.19 1.86 0 2.38 0 3.06v17.89c0 .68.19 1.2.5 1.53l.08.08 10.02-10.02v-.24L.58 1.45.5 1.53zm16.62 11.28-3.35-1.94-.08-.08-2.55 2.55 2.64 2.64 3.34-1.93c.95-.55.95-1.45 0-2zM3.18.24c-.35-.07-.69-.02-.99.15l10.85 10.85 2.83-2.83L3.18.24z" />
            </svg>
            <span className="text-left">
              <span className="block text-gray-400 text-[9px]">Tải nội dung trên</span>
              <span className="text-white text-xs font-semibold">Google Play</span>
            </span>
          </button>
        </div>

        {/* Social media */}
        <div className="flex gap-4 justify-center mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
            </svg>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <p className="text-gray-500 text-[11px]">©Copyright M_Service 2023</p>
          <div className="flex items-center gap-1">
            <div className="border border-red-600 rounded px-1.5 py-0.5">
              <p className="text-red-600 text-[9px] font-bold leading-tight">ĐÃ ĐĂNG KÝ</p>
              <p className="text-red-600 text-[9px] leading-tight">BỘ CÔNG THƯƠNG</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
