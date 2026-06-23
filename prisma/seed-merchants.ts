import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MISSING = '—';

/** Returns '' for the MoMo "missing data" placeholder, otherwise the trimmed value. */
function clean(value: string): string {
  const trimmed = value.trim();
  return trimmed === MISSING ? '' : trimmed;
}

/** Combines house number + street into a single street address, skipping missing parts. */
function combineStreetAddress(houseNumber: string, street: string): string {
  const a = clean(houseNumber);
  const b = clean(street);
  if (a && b) return `${a} ${b}`;
  if (a) return a;
  if (b) return b;
  return '';
}

function makeOpeningHours(hours: string): Record<string, string> {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return Object.fromEntries(days.map((d) => [d, hours]));
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

type StoreRow = {
  name: string;
  houseNumber: string;
  street: string;
  ward: string;
  district: string;
  city: string;
};

// ---------------------------------------------------------------------------
// Jollibee Vietnam — 112 stores
// ---------------------------------------------------------------------------

const jollibeeStores: StoreRow[] = [
  { name: 'Jollibee - Lê Đức Thọ', houseNumber: '688', street: 'Lê Đức Thọ', ward: 'P.15', district: 'Gò Vấp', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Nguyễn Duy Trinh', houseNumber: '503A', street: 'Nguyễn Duy Trinh', ward: 'Bình Trưng Tây', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Nguyễn Văn Quá', houseNumber: '127', street: 'Nguyễn Văn Quá', ward: 'Tân Hưng Thuận', district: 'Quận 12', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Pasteur', houseNumber: '194D', street: 'Pasteur', ward: 'P.6', district: 'Quận 3', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Phạm Văn Chiêu', houseNumber: '81', street: 'Phạm Văn Chiêu', ward: 'P.14', district: 'Gò Vấp', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Trường Chinh', houseNumber: '360', street: 'Trường Chinh', ward: 'P.13', district: 'Tân Bình', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Tân Hương', houseNumber: '131', street: 'Tân Hương', ward: 'Tân Quý', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Vincom Phan Văn Trị', houseNumber: '12', street: 'Phan Văn Trị', ward: 'P.7', district: 'Gò Vấp', city: 'Hồ Chí Minh' },
  { name: 'Jollibee - Âu Cơ', houseNumber: '650', street: 'Âu Cơ', ward: 'P.10', district: 'Tân Bình', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Aeon Mall Bình Dương', houseNumber: '—', street: 'Đại lộ Bình Dương', ward: 'Thuận Giao', district: 'Thuận An', city: 'Bình Dương' },
  { name: 'Jollibee Aeon Mall Hải Phòng', houseNumber: '10', street: 'Võ Nguyên Giáp', ward: 'Kênh Dương', district: 'Lê Chân', city: 'Hải Phòng' },
  { name: 'Jollibee Big C An Lạc', houseNumber: '1231', street: 'Quốc Lộ 1A', ward: 'Bình Trị Đông B', district: 'Bình Tân', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Kiến An Hải Phòng', houseNumber: '04-06', street: 'Trần Thành Ngọ', ward: '—', district: 'Kiến An', city: 'Hải Phòng' },
  { name: 'Jollibee - Trần Hưng Đạo', houseNumber: '354-356', street: 'Trần Hưng Đạo', ward: 'P.2', district: 'Quận 5', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Big C Biên Hòa', houseNumber: '—', street: 'Quốc Lộ 51', ward: 'Long Bình Tân', district: 'Biên Hòa', city: 'Đồng Nai' },
  { name: 'Jollibee Big C Hạ Long', houseNumber: '—', street: '—', ward: 'Cột 5, Hồng Hải', district: 'Hạ Long', city: 'Quảng Ninh' },
  { name: 'Jollibee Big C Mỹ Tho', houseNumber: '545', street: 'Lê Văn Phẩm', ward: 'P.5', district: 'Mỹ Tho', city: 'Tiền Giang' },
  { name: 'Jollibee Big C Nha Trang', houseNumber: '—', street: 'Đường 19/5', ward: 'Vĩnh Hiệp', district: 'Nha Trang', city: 'Khánh Hòa' },
  { name: 'Jollibee Big C Trà Vinh', houseNumber: '—', street: 'Võ Nguyên Giáp', ward: 'P.7', district: 'Trà Vinh', city: 'Trà Vinh' },
  { name: 'Jollibee Biên Hòa - Phạm Văn Thuận', houseNumber: '529', street: 'Phạm Văn Thuận', ward: 'Tam Hiệp', district: 'Biên Hòa', city: 'Đồng Nai' },
  { name: 'Jollibee Buôn Ma Thuột - Quang Trung', houseNumber: '11', street: 'Quang Trung', ward: 'Thống Nhất', district: 'Buôn Ma Thuột', city: 'Đắk Lắk' },
  { name: 'Jollibee Bình Định - Big C Quy Nhơn', houseNumber: '—', street: '—', ward: 'Kim Cúc Plaza, Ghềnh Ráng', district: 'Quy Nhơn', city: 'Bình Định' },
  { name: 'Jollibee Bạc Liêu - Nguyễn Tất Thành', houseNumber: '128', street: 'Nguyễn Tất Thành', ward: 'P.7', district: 'Bạc Liêu', city: 'Bạc Liêu' },
  { name: 'Jollibee Bắc Ninh - Trần Hưng Đạo', houseNumber: '393', street: 'Trần Hưng Đạo', ward: 'Suối Hoa', district: 'Bắc Ninh', city: 'Bắc Ninh' },
  { name: 'Jollibee Châu Đốc - Sương Nguyệt Anh', houseNumber: '63', street: 'Sương Nguyệt Anh', ward: 'Châu Phú A', district: 'Châu Đốc', city: 'An Giang' },
  { name: 'Jollibee Co.opmart - Tô Ký', houseNumber: '10A', street: 'Tô Ký', ward: 'Trung Mỹ Tây', district: 'Quận 12', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Biên Hòa', houseNumber: '121', street: 'Quốc Lộ 15', ward: 'Tân Tiến', district: 'Biên Hòa', city: 'Đồng Nai' },
  { name: 'Jollibee Co.opmart Bình Triệu', houseNumber: '68/1', street: 'Quốc Lộ 13', ward: 'Hiệp Bình Chánh', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Bạc Liêu', houseNumber: '07', street: 'Trần Huỳnh', ward: 'P.7', district: 'Bạc Liêu', city: 'Bạc Liêu' },
  { name: 'Jollibee Co.opmart Bến Lức', houseNumber: '61', street: 'Quốc Lộ 1A', ward: '—', district: 'Bến Lức', city: 'Long An' },
  { name: 'Jollibee Co.opmart Cai Lậy', houseNumber: '—', street: '30 Tháng 4', ward: 'P.1', district: 'Cai Lậy', city: 'Tiền Giang' },
  { name: 'Jollibee Co.opmart Cao Lãnh', houseNumber: '—', street: '—', ward: 'P.1', district: 'Cao Lãnh', city: 'Đồng Tháp' },
  { name: 'Jollibee Co.opmart Châu Đốc', houseNumber: '63', street: 'Lê Lợi', ward: 'Châu Phú B', district: 'Châu Đốc', city: 'An Giang' },
  { name: 'Jollibee Co.opmart Cần Thơ', houseNumber: '01', street: 'Đại Lộ Hòa Bình', ward: 'Tân An', district: 'Ninh Kiều', city: 'Cần Thơ' },
  { name: 'Jollibee Co.opmart Duyên Hải', houseNumber: '—', street: 'Lý Thường Kiệt', ward: 'P.1', district: 'Duyên Hải', city: 'Trà Vinh' },
  { name: 'Jollibee Co.opmart Hà Tĩnh', houseNumber: '02', street: 'Phan Đình Phùng', ward: 'Nam Hà', district: 'Hà Tĩnh', city: 'Hà Tĩnh' },
  { name: 'Jollibee Co.opmart Hà Đông', houseNumber: 'KM10', street: 'Nguyễn Trãi', ward: 'Mộ Lao', district: 'Hà Đông', city: 'Hà Nội' },
  { name: 'Jollibee Co.opmart Hải Phòng', houseNumber: '—', street: 'Lê Hồng Phong', ward: 'Lạc Viên', district: 'Ngô Quyền', city: 'Hải Phòng' },
  { name: 'Jollibee Co.opmart Hồng Ngự', houseNumber: '—', street: 'Nguyễn Tất Thành', ward: 'An Thạnh', district: 'Hồng Ngự', city: 'Đồng Tháp' },
  { name: 'Jollibee Co.opmart Kiên Giang', houseNumber: '1332', street: 'Nguyễn Trung Trực', ward: '—', district: 'Rạch Giá', city: 'Kiên Giang' },
  { name: 'Jollibee Co.opmart Kon Tum', houseNumber: '205B', street: 'Lê Hồng Phong', ward: 'Quyết Thắng', district: 'Kon Tum', city: 'Kon Tum' },
  { name: 'Jollibee Co.opmart Long Xuyên', houseNumber: '12', street: 'Nguyễn Huệ', ward: 'Mỹ Long', district: 'Long Xuyên', city: 'An Giang' },
  { name: 'Jollibee Co.opmart Lý Thường Kiệt', houseNumber: '497', street: 'Hoà Hảo', ward: 'P.7', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Mỹ Tho', houseNumber: '35', street: 'Ấp Bắc', ward: 'P.5', district: 'Mỹ Tho', city: 'Tiền Giang' },
  { name: 'Jollibee Co.opmart Quảng Bình', houseNumber: '—', street: 'Lê Lợi', ward: 'Đồng Phú', district: 'Đồng Hới', city: 'Quảng Bình' },
  { name: 'Jollibee Co.opmart Quảng Ngãi', houseNumber: '242', street: 'Nguyễn Bá Loan', ward: '—', district: 'Quảng Ngãi', city: 'Quảng Ngãi' },
  { name: 'Jollibee Co.opmart Quảng Trị', houseNumber: '2', street: 'Trần Hưng Đạo', ward: 'P.1', district: 'Đông Hà', city: 'Quảng Trị' },
  { name: 'Jollibee Co.opmart Rạch Giá', houseNumber: '—', street: '—', ward: 'Vĩnh Thanh', district: 'Rạch Giá', city: 'Kiên Giang' },
  { name: 'Jollibee Co.opmart Sài Gòn Home', houseNumber: '819', street: 'Hương Lộ 2', ward: 'Bình Trị Đông A', district: 'Bình Tân', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Sóc Trăng', houseNumber: '06', street: 'Hùng Vương', ward: 'P.6', district: 'Sóc Trăng', city: 'Sóc Trăng' },
  { name: 'Jollibee Co.opmart Tam Kỳ', houseNumber: '07', street: 'Phan Chu Trinh', ward: 'Phước Hòa', district: 'Tam Kỳ', city: 'Quảng Nam' },
  { name: 'Jollibee Co.opmart Thắng Lợi', houseNumber: '2', street: 'Trường Chinh', ward: 'Tây Thạnh', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Tuy Hòa', houseNumber: '—', street: 'Duy Tân', ward: 'P.5', district: 'Tuy Hòa', city: 'Phú Yên' },
  { name: 'Jollibee Co.opmart Tân An', houseNumber: '01', street: 'Mai Thị Tốt', ward: 'P.2', district: 'Tân An', city: 'Long An' },
  { name: 'Jollibee Co.opmart Tân Biên', houseNumber: '—', street: 'Quốc Lộ 22B', ward: 'Tân Lập', district: 'Tân Biên', city: 'Tây Ninh' },
  { name: 'Jollibee Co.opmart Tây Ninh', houseNumber: '576', street: 'Cách Mạng Tháng Tám', ward: 'P.3', district: 'Tây Ninh', city: 'Tây Ninh' },
  { name: 'Jollibee Co.opmart Vĩnh Long', houseNumber: '26', street: 'Đường 3 Tháng 2', ward: 'P.1', district: 'Vĩnh Long', city: 'Vĩnh Long' },
  { name: 'Jollibee Co.opmart Xa Lộ Hà Nội', houseNumber: '191', street: 'Quang Trung', ward: 'Hiệp Phú', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Co.opmart Đông Hà', houseNumber: '2', street: 'Trần Hưng Đạo', ward: 'P.1', district: 'Đông Hà', city: 'Quảng Trị' },
  { name: 'Jollibee Cà Mau - Trần Hưng Đạo', houseNumber: '128', street: 'Trần Hưng Đạo', ward: 'P.5', district: 'Cà Mau', city: 'Cà Mau' },
  { name: 'Jollibee Cần Thơ - 30 Tháng 4', houseNumber: '376', street: 'Đường 30 Tháng 4', ward: 'Hưng Lợi', district: 'Ninh Kiều', city: 'Cần Thơ' },
  { name: 'Jollibee Giga Mall - Phạm Văn Đồng', houseNumber: '240-242', street: 'Phạm Văn Đồng', ward: 'Hiệp Bình Chánh', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Go! Buôn Ma Thuột', houseNumber: '—', street: 'Nguyễn Thị Định', ward: 'Thành Nhất', district: 'Buôn Ma Thuột', city: 'Đắk Lắk' },
  { name: 'Jollibee Go! Bà Rịa', houseNumber: '2A', street: 'Nguyễn Đình Chiểu', ward: 'Phước Hiệp', district: 'Bà Rịa', city: 'Bà Rịa - Vũng Tàu' },
  { name: 'Jollibee Go! Tam Kỳ', houseNumber: '01', street: 'Phan Châu Trinh', ward: 'Phước Hòa', district: 'Tam Kỳ', city: 'Quảng Nam' },
  { name: 'Jollibee Go! Thái Nguyên', houseNumber: '—', street: '—', ward: 'TTTM Go! Thái Nguyên, Tân Lập', district: 'Thái Nguyên', city: 'Thái Nguyên' },
  { name: 'Jollibee Hà Nội - Aeon Mall Long Biên', houseNumber: '—', street: 'Cổ Linh', ward: '—', district: 'Long Biên', city: 'Hà Nội' },
  { name: 'Jollibee Hà Nội - Tô Hiệu', houseNumber: '303-305', street: 'Tô Hiệu', ward: 'Dịch Vọng', district: 'Cầu Giấy', city: 'Hà Nội' },
  { name: 'Jollibee Kon Tum - Trần Hưng Đạo', houseNumber: '75', street: 'Trần Hưng Đạo', ward: 'Thống Nhất', district: 'Kon Tum', city: 'Kon Tum' },
  { name: 'Jollibee Long Xuyên - Nguyễn Thái Học', houseNumber: '58', street: 'Nguyễn Thái Học', ward: 'Mỹ Bình', district: 'Long Xuyên', city: 'An Giang' },
  { name: 'Jollibee Moonlight - Đặng Văn Bi', houseNumber: '106', street: 'Đặng Văn Bi', ward: 'Bình Thọ', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Mỹ Tho - Lê Lợi', houseNumber: '142', street: 'Lê Lợi', ward: 'P.7', district: 'Mỹ Tho', city: 'Tiền Giang' },
  { name: 'Jollibee Mỹ Tho - Đinh Bộ Lĩnh', houseNumber: '168', street: 'Đinh Bộ Lĩnh', ward: 'P.2', district: 'Mỹ Tho', city: 'Tiền Giang' },
  { name: 'Jollibee Phú Yên - Phan Đình Phùng', houseNumber: '93', street: 'Phan Đình Phùng', ward: 'P.1', district: 'Tuy Hòa', city: 'Phú Yên' },
  { name: 'Jollibee Rạch Dừa Vũng Tàu', houseNumber: '553', street: 'Đường 30 Tháng 4', ward: 'Rạch Dừa', district: 'Vũng Tàu', city: 'Bà Rịa - Vũng Tàu' },
  { name: 'Jollibee Rạch Giá - 3 Tháng 2', houseNumber: 'Lô E9', street: '3 Tháng 2', ward: 'Vĩnh Lạc', district: 'Rạch Giá', city: 'Kiên Giang' },
  { name: 'Jollibee Sa Đéc - Hùng Vương', houseNumber: '138A', street: 'Hùng Vương', ward: 'P.2', district: 'Sa Đéc', city: 'Đồng Tháp' },
  { name: 'Jollibee Satra Củ Chi', houseNumber: '1239', street: 'Tỉnh Lộ 8', ward: 'Trung An', district: 'Củ Chi', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Sense City Cà Mau', houseNumber: '9', street: 'Trần Hưng Đạo', ward: 'P.5', district: 'Cà Mau', city: 'Cà Mau' },
  { name: 'Jollibee Sài Gòn Star - Nguyễn Thị Minh Khai', houseNumber: '204', street: 'Nguyễn Thị Minh Khai', ward: 'P.6', district: 'Quận 3', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Sóc Trăng - Lý Thường Kiệt', houseNumber: '116', street: 'Lý Thường Kiệt', ward: 'P.1', district: 'Sóc Trăng', city: 'Sóc Trăng' },
  { name: 'Jollibee Tam Kỳ - Huỳnh Thúc Kháng', houseNumber: '187', street: 'Huỳnh Thúc Kháng', ward: 'An Xuân', district: 'Tam Kỳ', city: 'Quảng Nam' },
  { name: 'Jollibee Thái Nguyên - Lương Ngọc Quyến', houseNumber: '107', street: 'Lương Ngọc Quyến', ward: 'Hoàng Văn Thụ', district: 'Thái Nguyên', city: 'Thái Nguyên' },
  { name: 'Jollibee Thủy Nguyên - Bạch Đằng', houseNumber: '151', street: 'Bạch Đằng', ward: 'TT Núi Đèo', district: 'Thủy Nguyên', city: 'Hải Phòng' },
  { name: 'Jollibee Trà Vinh - Lê Lợi', houseNumber: '74-76', street: 'Lê Lợi', ward: 'P.2', district: 'Trà Vinh', city: 'Trà Vinh' },
  { name: 'Jollibee Trà Vinh - Nguyễn Đáng', houseNumber: '403', street: 'Nguyễn Đáng', ward: 'P.6', district: 'Trà Vinh', city: 'Trà Vinh' },
  { name: 'Jollibee Vincom Bảo Lộc', houseNumber: '83', street: 'Lê Hồng Phong', ward: 'P.1', district: 'Bảo Lộc', city: 'Lâm Đồng' },
  { name: 'Jollibee Vincom Bắc Ninh', houseNumber: '200', street: 'Trần Hưng Đạo', ward: 'Suối Hoa', district: 'Bắc Ninh', city: 'Bắc Ninh' },
  { name: 'Jollibee Vincom Huế', houseNumber: '50A', street: 'Hùng Vương', ward: 'Phú Nhuận', district: 'Huế', city: 'Thừa Thiên - Huế' },
  { name: 'Jollibee Vincom Imperia Hải Phòng', houseNumber: '01', street: 'Bạch Đằng', ward: 'Thượng Lý', district: 'Hồng Bàng', city: 'Hải Phòng' },
  { name: 'Jollibee Vincom Long Xuyên', houseNumber: '—', street: 'Trần Hưng Đạo', ward: 'Mỹ Bình', district: 'Long Xuyên', city: 'An Giang' },
  { name: 'Jollibee Vincom Lê Văn Việt', houseNumber: '50', street: 'Lê Văn Việt', ward: 'Hiệp Phú', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Vincom Maximark - Cộng Hòa', houseNumber: '15-17', street: 'Cộng Hòa', ward: 'P.4', district: 'Tân Bình', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Vincom Maximark Nha Trang', houseNumber: '60', street: 'Thái Nguyên', ward: 'Phương Sài', district: 'Nha Trang', city: 'Khánh Hòa' },
  { name: 'Jollibee Vincom Ninh Hòa', houseNumber: '—', street: 'Đường 2/4', ward: 'Ninh Hiệp', district: 'Ninh Hòa', city: 'Khánh Hòa' },
  { name: 'Jollibee Vincom Plaza Hà Huy Tập', houseNumber: '—', street: 'Hàm Nghi', ward: 'Hà Huy Tập', district: 'Hà Tĩnh', city: 'Hà Tĩnh' },
  { name: 'Jollibee Vincom Plaza Tuyên Quang', houseNumber: '260', street: 'Quang Trung', ward: 'Phan Thiết', district: 'Tuyên Quang', city: 'Tuyên Quang' },
  { name: 'Jollibee Vincom Plaza Việt Trì', houseNumber: '—', street: 'Hùng Vương', ward: 'Tiên Cát', district: 'Việt Trì', city: 'Phú Thọ' },
  { name: 'Jollibee Vincom Plaza Đồng Hới', houseNumber: '—', street: 'Quách Xuân Kỳ', ward: 'Hải Đình', district: 'Đồng Hới', city: 'Quảng Bình' },
  { name: 'Jollibee Vincom Quảng Ngãi', houseNumber: '26', street: 'Lê Thánh Tôn', ward: 'Nghĩa Chánh', district: 'Quảng Ngãi', city: 'Quảng Ngãi' },
  { name: 'Jollibee Vincom Sóc Trăng', houseNumber: '22', street: 'Trần Hưng Đạo', ward: 'P.2', district: 'Sóc Trăng', city: 'Sóc Trăng' },
  { name: 'Jollibee Vincom Thái Bình', houseNumber: '—', street: 'Lý Bôn', ward: 'Đề Thám', district: 'Thái Bình', city: 'Thái Bình' },
  { name: 'Jollibee Vincom Thái Nguyên', houseNumber: '247', street: 'Lương Ngọc Quyến', ward: 'Quang Trung', district: 'Thái Nguyên', city: 'Thái Nguyên' },
  { name: 'Jollibee Vincom Vĩnh Long', houseNumber: '55', street: 'Phạm Thái Bường', ward: 'P.4', district: 'Vĩnh Long', city: 'Vĩnh Long' },
  { name: 'Jollibee Việt Trì - Hùng Vương', houseNumber: '1828', street: 'Hùng Vương', ward: 'Nông Trang', district: 'Việt Trì', city: 'Phú Thọ' },
  { name: 'Jollibee Vĩnh Long - Phạm Hùng', houseNumber: '10', street: 'Phạm Hùng', ward: 'P.2', district: 'Vĩnh Long', city: 'Vĩnh Long' },
  { name: 'Jollibee Vĩnh Phúc - Big C', houseNumber: '—', street: 'Quốc lộ 2', ward: 'Khai Quang', district: 'Vĩnh Yên', city: 'Vĩnh Phúc' },
  { name: 'Jollibee Vạn Hạnh Mall', houseNumber: '11', street: 'Sư Vạn Hạnh', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'Jollibee Yên Bái - Tô Hiến Thành', houseNumber: '—', street: 'Tô Hiến Thành', ward: 'Nguyễn Thái Học', district: 'Yên Bái', city: 'Yên Bái' },
  { name: 'Jollibee Đà Lạt - Đinh Tiên Hoàng', houseNumber: '49BS2', street: 'Đinh Tiên Hoàng', ward: 'P.2', district: 'Đà Lạt', city: 'Lâm Đồng' },
  { name: 'Jollibee Đà Nẵng - Tiểu La', houseNumber: '32', street: 'Tiểu La', ward: 'Hòa Cường Bắc', district: 'Hải Châu', city: 'Đà Nẵng' },
  { name: 'Jollibee Đồng Xoài - Phú Riềng Đỏ', houseNumber: '1001', street: 'Phú Riềng Đỏ', ward: 'Tân Bình', district: 'Đồng Xoài', city: 'Bình Phước' },
];

// ---------------------------------------------------------------------------
// Katinat Coffee & Tea House — 104 stores
// ---------------------------------------------------------------------------

const katinatStores: StoreRow[] = [
  { name: 'KATINAT - 196 Lê Văn Thọ', houseNumber: '196', street: 'Lê Văn Thọ', ward: 'P.11', district: 'Gò Vấp', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - 2 Đồng Khởi - Biên Hòa', houseNumber: '2', street: 'Đồng Khởi', ward: 'Tam Hiệp', district: 'Biên Hòa', city: 'Đồng Nai' },
  { name: 'KATINAT - 50 Bạch Đằng - Bình Dương', houseNumber: '50', street: 'Bạch Đằng', ward: 'Phú Cường', district: 'Thủ Dầu Một', city: 'Bình Dương' },
  { name: 'KATINAT - Bà Triệu', houseNumber: '33', street: 'Bà Triệu', ward: 'Hàng Bài', district: 'Hoàn Kiếm', city: 'Hà Nội' },
  { name: 'KATINAT - Bến Vân Đồn', houseNumber: '195', street: 'Bến Vân Đồn', ward: 'P.5', district: 'Quận 4', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Crescent Residence 2', houseNumber: 'Lô CR2-12A', street: 'Tôn Dật Tiên', ward: 'Tân Phú', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Cộng Hoà', houseNumber: '20', street: 'Cộng Hòa', ward: 'P.4', district: 'Tân Bình', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Hoa Lan', houseNumber: '45A', street: 'Hoa Lan', ward: 'P.2', district: 'Phú Nhuận', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Hạ Long', houseNumber: 'Ô số 22-23', street: '—', ward: 'Cột 5, Hồng Hải', district: 'Hạ Long', city: 'Quảng Ninh' },
  { name: 'KATINAT - Lê Thanh Nghị', houseNumber: '59-67', street: 'Lê Thanh Nghị', ward: 'Đồng Tâm', district: 'Hai Bà Trưng', city: 'Hà Nội' },
  { name: 'KATINAT - Nguyễn Thị Minh Khai - Đà Lạt', houseNumber: '1', street: 'Nguyễn Thị Minh Khai', ward: 'P.1', district: 'Đà Lạt', city: 'Lâm Đồng' },
  { name: 'KATINAT - Phùng Hưng', houseNumber: '18', street: 'Phùng Hưng', ward: 'Phúc La', district: 'Hà Đông', city: 'Hà Nội' },
  { name: 'KATINAT - Phạm Ngọc Thạch', houseNumber: '49', street: 'Phạm Ngọc Thạch', ward: 'P.6', district: 'Quận 3', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Trường Thi', houseNumber: '2', street: 'Trường Thi', ward: 'Trường Thi', district: 'Vinh', city: 'Nghệ An' },
  { name: 'KATINAT - Trần Phú', houseNumber: '1', street: 'Trần Phú', ward: 'P.1', district: 'Vũng Tàu', city: 'Bà Rịa - Vũng Tàu' },
  { name: 'KATINAT - Tân Sơn Nhì', houseNumber: '195', street: 'Tân Sơn Nhì', ward: 'Tân Sơn Nhì', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Tạ Quang Bửu', houseNumber: '815', street: 'Tạ Quang Bửu', ward: 'P.5', district: 'Quận 8', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Điện Biên Phủ', houseNumber: '788', street: 'Điện Biên Phủ', ward: 'P.1', district: 'Quận 3', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Cao Thắng', houseNumber: '442', street: 'Cao Thắng', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - 158 Đồng Khởi', houseNumber: '158', street: 'Đồng Khởi', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Aeon Mall Tân Phú', houseNumber: 'Lô G63A', street: 'Tân Thắng', ward: 'Sơn Kỳ', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - An Dương Vương', houseNumber: '01', street: 'An Dương Vương', ward: 'P.8', district: 'Quận 5', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Ba Vì', houseNumber: 'QQ1', street: 'Ba Vì', ward: 'P.15', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Bùi Thị Xuân', houseNumber: '122', street: 'Bùi Thị Xuân', ward: 'Phạm Ngũ Lão', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Bạch Đằng - Đà Nẵng', houseNumber: '34', street: 'Bạch Đằng', ward: 'Thạch Thang', district: 'Hải Châu', city: 'Đà Nẵng' },
  { name: 'KATINAT - Bến Bình An', houseNumber: '—', street: 'Đường Số 21', ward: 'Bình An', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Bến Thành', houseNumber: '56-58', street: 'Phan Bội Châu', ward: 'Bến Thành', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Cao Thắng (2)', houseNumber: '442', street: 'Cao Thắng', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Chợ Lớn', houseNumber: '141-147', street: 'Chợ Lớn', ward: 'P.11', district: 'Quận 6', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Công Viên Bờ Sông Sài Gòn', houseNumber: '—', street: '—', ward: 'An Phú', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Công Viên Yên Sở', houseNumber: '—', street: 'QL1A', ward: 'Yên Sở', district: 'Hoàng Mai', city: 'Hà Nội' },
  { name: 'KATINAT - Giảng Võ', houseNumber: '187', street: 'Giảng Võ', ward: 'Cát Linh', district: 'Đống Đa', city: 'Hà Nội' },
  { name: 'KATINAT - Hoàng Diệu 2', houseNumber: '123', street: 'Hoàng Diệu 2', ward: 'Linh Trung', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Huỳnh Thúc Kháng', houseNumber: '3', street: 'Huỳnh Thúc Kháng', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Hàm Nghi', houseNumber: '120', street: 'Hàm Nghi', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Hồ Thị Tư', houseNumber: '56', street: 'Hồ Thị Tư', ward: 'Hiệp Phú', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Hùng Vương - Mỹ Tho', houseNumber: '1A', street: 'Hùng Vương', ward: 'P.1', district: 'Mỹ Tho', city: 'Tiền Giang' },
  { name: 'KATINAT - Hạ Long (Vũng Tàu)', houseNumber: '64', street: 'Hạ Long', ward: 'P.2', district: 'Vũng Tàu', city: 'Bà Rịa - Vũng Tàu' },
  { name: 'KATINAT - Kha Vạn Cân', houseNumber: '895', street: 'Kha Vạn Cân', ward: 'Linh Tây', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lê Lợi - Huế', houseNumber: '106-114', street: 'Lê Lợi', ward: 'Phú Hội', district: 'Huế', city: 'Thừa Thiên - Huế' },
  { name: 'KATINAT - Lê Thái Tổ', houseNumber: '1', street: 'Lê Thái Tổ', ward: 'Hàng Trống', district: 'Hoàn Kiếm', city: 'Hà Nội' },
  { name: 'KATINAT - Lê Trọng Tấn', houseNumber: '440-440A', street: 'Lê Trọng Tấn', ward: 'Tây Thạnh', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lê Văn Lương (Q7)', houseNumber: 'Hẻm 380', street: 'Lê Văn Lương', ward: 'Tân Hưng', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lê Văn Lương (Hà Nội)', houseNumber: 'L1-01', street: 'Lê Văn Lương', ward: 'Nhân Chính', district: 'Thanh Xuân', city: 'Hà Nội' },
  { name: 'KATINAT - Lê Văn Quới', houseNumber: '34', street: 'Lê Văn Quới', ward: 'Bình Hưng Hòa A', district: 'Bình Tân', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lê Đại Hành', houseNumber: '8', street: 'Lê Đại Hành', ward: 'P.15', district: 'Quận 11', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lý Thường Kiệt', houseNumber: '60', street: 'Lý Thường Kiệt', ward: 'Trần Hưng Đạo', district: 'Hoàn Kiếm', city: 'Hà Nội' },
  { name: 'KATINAT - Mậu Thân', houseNumber: '19-19A', street: 'Mậu Thân', ward: 'Xuân Khánh', district: 'Ninh Kiều', city: 'Cần Thơ' },
  { name: 'KATINAT - Nguyên Lạc - Quy Nhơn', houseNumber: '19-19A', street: 'Nguyễn Lạc', ward: 'Trần Phú', district: 'Quy Nhơn', city: 'Bình Định' },
  { name: 'KATINAT - Nguyễn Bỉnh Khiêm (Q1)', houseNumber: '25L', street: 'Nguyễn Bỉnh Khiêm', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Bỉnh Khiêm (Nối Dài)', houseNumber: '58', street: 'Nguyễn Bỉnh Khiêm (Nối Dài)', ward: 'Đa Kao', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Du', houseNumber: '59B', street: 'Nguyễn Du', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Gia Trí', houseNumber: '6', street: 'Nguyễn Gia Trí', ward: 'P.25', district: 'Bình Thạnh', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Huệ', houseNumber: '105', street: 'Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Hữu Cầu', houseNumber: '2', street: 'Nguyễn Hữu Cầu', ward: 'Tân Định', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Sơn', houseNumber: '35-35A', street: 'Nguyễn Sơn', ward: 'Phú Thạnh', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Thị Thập (1)', houseNumber: '332', street: 'Nguyễn Thị Thập', ward: 'Tân Quy', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Thị Thập (2)', houseNumber: '332', street: 'Nguyễn Thị Thập', ward: 'Tân Quy', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Tri Phương', houseNumber: '533', street: 'Nguyễn Tri Phương', ward: 'P.8', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Văn Linh (Q7)', houseNumber: '039', street: 'Nguyễn Văn Linh', ward: 'Tân Phong', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Văn Linh - Đà Nẵng', houseNumber: '09', street: 'Nguyễn Văn Linh', ward: 'Bình Hiên', district: 'Hải Châu', city: 'Đà Nẵng' },
  { name: 'KATINAT - Nguyễn Văn Thoại', houseNumber: '120', street: 'Nguyễn Văn Thoại', ward: 'Mỹ An', district: 'Ngũ Hành Sơn', city: 'Đà Nẵng' },
  { name: 'KATINAT - Nguyễn Văn Tráng', houseNumber: '08', street: 'Nguyễn Văn Tráng', ward: 'Bến Thành', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Đình Thi', houseNumber: '11', street: 'Nguyễn Đình Thi', ward: 'Thụy Khuê', district: 'Tây Hồ', city: 'Hà Nội' },
  { name: 'KATINAT - Ngô Văn Năm', houseNumber: '4B/2', street: 'Ngô Văn Năm', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nơ Trang Long', houseNumber: '101', street: 'Nơ Trang Long', ward: 'P.11', district: 'Bình Thạnh', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Phan Văn Trị', houseNumber: '18A', street: 'Phan Văn Trị', ward: 'P.7', district: 'Gò Vấp', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Phan Văn Đáng', houseNumber: '2', street: 'Phan Văn Đáng', ward: 'Thạnh Mỹ Lợi', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Phan Đình Phùng (Hà Nội 1)', houseNumber: '18', street: 'Phan Đình Phùng', ward: 'Quán Thánh', district: 'Ba Đình', city: 'Hà Nội' },
  { name: 'KATINAT - Phan Đình Phùng (Hà Nội 2)', houseNumber: '83', street: 'Phan Đình Phùng', ward: 'Quán Thánh', district: 'Ba Đình', city: 'Hà Nội' },
  { name: 'KATINAT - Trần Hưng Đạo', houseNumber: '787', street: 'Trần Hưng Đạo', ward: 'P.1', district: 'Quận 5', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Trần Phú - Nha Trang', houseNumber: '42', street: 'Trần Phú', ward: 'Lộc Thọ', district: 'Nha Trang', city: 'Khánh Hòa' },
  { name: 'KATINAT - Tên Lửa', houseNumber: '356', street: 'Tên Lửa', ward: 'Bình Trị Đông', district: 'Bình Tân', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Tô Ngọc Vân', houseNumber: '51', street: 'Tô Ngọc Vân', ward: 'Quảng An', district: 'Tây Hồ', city: 'Hà Nội' },
  { name: 'KATINAT - Tôn Đức Thắng (Q1)', houseNumber: '10B', street: 'Tôn Đức Thắng', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Tôn Đức Thắng - Phan Thiết', houseNumber: '326-336', street: 'Tôn Đức Thắng', ward: 'Phú Thủy', district: 'Phan Thiết', city: 'Bình Thuận' },
  { name: 'KATINAT - Ung Văn Khiêm', houseNumber: '24', street: 'Ung Văn Khiêm', ward: 'P.25', district: 'Bình Thạnh', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Vinhome Ocean Park 3', houseNumber: 'PT-TV 15', street: '—', ward: 'Nghĩa Trụ', district: 'Văn Giang', city: 'Hưng Yên' },
  { name: 'KATINAT - Vòng Xoay Dân Chủ', houseNumber: '10', street: 'Đường 3 Tháng 2', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Vòng Xoay Phù Đổng', houseNumber: '36', street: 'Nguyễn Thị Nghĩa', ward: 'Phạm Ngũ Lão', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Võ Chí Công', houseNumber: '3', street: 'Võ Chí Công', ward: 'Long Thạnh Mỹ', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Võ Thị Sáu', houseNumber: '173', street: 'Võ Thị Sáu', ward: 'Võ Thị Sáu', district: 'Quận 3', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Vườn Lài', houseNumber: '1', street: 'Vườn Lài', ward: 'Phú Thọ Hòa', district: 'Tân Phú', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Vệ Hồ', houseNumber: '1', street: 'Vệ Hồ', ward: 'Xuân La', district: 'Tây Hồ', city: 'Hà Nội' },
  { name: 'KATINAT - Xuân Thủy', houseNumber: '50', street: 'Xuân Thuỷ', ward: 'Thảo Điền', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Yersin - Bình Dương', houseNumber: '229', street: 'Yersin', ward: 'Phú Cường', district: 'Thủ Dầu Một', city: 'Bình Dương' },
  { name: 'KATINAT - Điện Biên Phủ (Landmark 81)', houseNumber: '772', street: 'Điện Biên Phủ', ward: 'P.22', district: 'Bình Thạnh', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Đường 3/4 - Đà Lạt', houseNumber: '27A', street: 'Đường 3/4', ward: 'P.3', district: 'Đà Lạt', city: 'Lâm Đồng' },
  { name: 'KATINAT - Đường số 5', houseNumber: '1-3', street: 'Đường 5', ward: 'Phước Bình', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Đặng Văn Bi', houseNumber: '168', street: 'Đặng Văn Bi', ward: 'Bình Thọ', district: 'Thủ Đức', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Đồng Khởi (OA address)', houseNumber: '91', street: 'Đồng Khởi', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Đội Cấn', houseNumber: '216', street: 'Đội Cấn', ward: 'Đội Cấn', district: 'Ba Đình', city: 'Hà Nội' },
  { name: 'Katinat - AEON Bình Dương Canary', houseNumber: 'Lô G45', street: 'Đại lộ Bình Dương', ward: 'Thuận Giao', district: 'Thuận An', city: 'Bình Dương' },
  { name: 'Katinat - Phó Đức Chính', houseNumber: '41', street: 'Phó Đức Chính', ward: 'Nguyễn Thái Bình', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Bỉnh Khiêm (Q1 - 2)', houseNumber: '25L', street: 'Nguyễn Bỉnh Khiêm', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Bến Thành (2)', houseNumber: '56-58', street: 'Phan Bội Châu', ward: 'Bến Thành', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Lê Văn Lương (2)', houseNumber: 'Hẻm 380', street: 'Lê Văn Lương', ward: 'Tân Hưng', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Thị Thập (3)', houseNumber: '332', street: 'Nguyễn Thị Thập', ward: 'Tân Quy', district: 'Quận 7', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Phan Đình Phùng (3)', houseNumber: '83', street: 'Phan Đình Phùng', ward: 'Quán Thánh', district: 'Ba Đình', city: 'Hà Nội' },
  { name: 'KATINAT - Vòng Xoay Dân Chủ (2)', houseNumber: '10', street: 'Đường 3 Tháng 2', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Vòng Xoay Phù Đổng (2)', houseNumber: '36', street: 'Nguyễn Thị Nghĩa', ward: 'Phạm Ngũ Lão', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Trần Hưng Đạo (2)', houseNumber: '787', street: 'Trần Hưng Đạo', ward: 'P.1', district: 'Quận 5', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Nguyễn Du (2)', houseNumber: '59B', street: 'Nguyễn Du', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
  { name: 'KATINAT - Cao Thắng (3)', houseNumber: '442', street: 'Cao Thắng', ward: 'P.12', district: 'Quận 10', city: 'Hồ Chí Minh' },
];

// ---------------------------------------------------------------------------
// Merchant definitions
// ---------------------------------------------------------------------------

const jollibeeDescription = truncate(
  `Jollibee là một câu chuyện thành công phi thường bởi chỉ từ 2 tiệm kem nhỏ hình thành vào năm 1975, chuyên bán các món ăn nóng và bánh mì kẹp đã trở thành công ty với 7 cửa hàng vào năm 1978. Sau đó trở thành một tập đoàn tạo nên cuộc cách mạng thức ăn nhanh tại Philippines.

Chúng tôi là Jollibee Việt Nam với hơn 100 cửa hàng trên khắp cả nước, chúng tôi mong muốn đem đến niềm vui ẩm thực cho mọi gia đình Việt bằng những món ăn có chất lượng tốt, hương vị tuyệt hảo, dịch vụ chu đáo.`,
  500
);

const katinatDescription = truncate(
  `Hành Trình Chinh Phục Phong Vị Mới — Journey To Explore New Tastes

KATINAT không ngừng theo đuổi sứ mệnh mang phong vị mới từ những vùng đất trứ danh tại Việt Nam và trên thế giới đến khách hàng.`,
  500
);

const merchantDefs = [
  {
    brandName: 'Jollibee Vietnam',
    logoUrl:
      'https://img.mservice.com.vn/common/u/2e02fb5fe4f64fb55bc713540643c6f8eae702d101cea8c59afc49cfc505fc37/653cb725-8cca-4fe7-a55d-9f45405d0e2aap3td95z.jpg',
    bannerUrl:
      'https://img.mservice.com.vn/common/u/2e02fb5fe4f64fb55bc713540643c6f8eae702d101cea8c59afc49cfc505fc37/f2a9b79b-3bc2-4cfa-8c96-4650298a0cc27yecybg2.jpg',
    industry: 'F&B',
    hotline: '19001533',
    description: jollibeeDescription,
    openingHours: '09:00-21:00',
    username: 'jollibee_admin',
    stores: jollibeeStores,
  },
  {
    brandName: 'Katinat Coffee & Tea House',
    logoUrl: 'https://merchant.momocdn.net/uncategorized/1755129600/1755154378722_Screenshot_2025-08-14_135226.png',
    bannerUrl: null as string | null,
    industry: 'F&B',
    hotline: '02838239289',
    description: katinatDescription,
    openingHours: '07:00-23:00',
    username: 'katinat_admin',
    stores: katinatStores,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const passwordHash = await hashPassword('Merchant123!');

  for (const def of merchantDefs) {
    // Merchant has no unique field on brandName -> find-or-create.
    let merchant = await prisma.merchant.findFirst({ where: { brandName: def.brandName } });
    if (merchant) {
      merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          logoUrl: def.logoUrl,
          bannerUrl: def.bannerUrl,
          industry: def.industry,
          hotline: def.hotline,
          description: def.description,
          status: 'active',
        },
      });
    } else {
      merchant = await prisma.merchant.create({
        data: {
          brandName: def.brandName,
          logoUrl: def.logoUrl,
          bannerUrl: def.bannerUrl,
          industry: def.industry,
          hotline: def.hotline,
          description: def.description,
          status: 'active',
        },
      });
    }

    await prisma.user.upsert({
      where: { username: def.username },
      update: {
        passwordHash,
        role: 'merchant',
        merchantId: merchant.id,
        isActive: true,
      },
      create: {
        username: def.username,
        passwordHash,
        role: 'merchant',
        merchantId: merchant.id,
        isActive: true,
      },
    });

    // One-time import: clear any previously seeded stores for this merchant, then recreate.
    await prisma.store.deleteMany({ where: { merchantId: merchant.id } });

    const openingHours = makeOpeningHours(def.openingHours);
    await prisma.store.createMany({
      data: def.stores.map((s) => ({
        merchantId: merchant!.id,
        name: s.name,
        streetAddress: combineStreetAddress(s.houseNumber, s.street),
        ward: clean(s.ward),
        district: clean(s.district),
        city: clean(s.city),
        openingHours,
      })),
    });

    console.log(`Seeded merchant "${def.brandName}" (${merchant.id}) with ${def.stores.length} stores. Login: ${def.username} / Merchant123!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
