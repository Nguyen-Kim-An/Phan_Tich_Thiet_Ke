'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus, ShippingMethodId } from '@/domain/models';
import { orderRepository } from '@/dao/repositories';

export interface TransportOption {
  id: ShippingMethodId;
  name: string;
  subtitle: string;
  fee: number;
  speedLabel: string;
  totalDistanceKm: number;
  originName: string;
  originAddress: string;
  originCoords: { lat: number; lng: number };
  waypoints: Array<{
    name: string;
    detail: string;
    x: number; // SVG 0..800
    y: number; // SVG 0..420
    lat: number;
    lng: number;
  }>;
}

const PTIT_DEST = {
  name: 'Học viện Công nghệ Bưu chính Viễn thông (PTIT)',
  detail: 'Km10 Nguyễn Trãi, P. Mộ Lao, Q. Hà Đông, Hà Nội',
  x: 163,
  y: 350,
  lat: 20.9809,
  lng: 105.7874,
};

export const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    id: 'motorbike',
    name: 'Xe máy Express Nội đô',
    subtitle: 'Linh hoạt qua trục phố Hàng Bài – Xã Đàn – Tây Sơn – Nguyễn Trãi',
    fee: 25000,
    speedLabel: '42 km/h (Chạy theo tuyến phố)',
    totalDistanceKm: 11.4,
    originName: 'Kho Flagship MaisonAI Tràng Tiền',
    originAddress: '88 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
    originCoords: { lat: 21.0245, lng: 105.8540 },
    waypoints: [
      {
        name: 'Kho Flagship Tràng Tiền',
        detail: '88 Tràng Tiền, Hoàn Kiếm, Hà Nội',
        x: 647,
        y: 112,
        lat: 21.0245,
        lng: 105.8540,
      },
      {
        name: 'Ngã tư Hàng Bài – Lý Thường Kiệt',
        detail: 'Quận Hoàn Kiếm, Hà Nội',
        x: 636,
        y: 128,
        lat: 21.0215,
        lng: 105.8525,
      },
      {
        name: 'Phố Huế – Trần Khát Chân',
        detail: 'Trục giao thương Hai Bà Trưng',
        x: 630,
        y: 160,
        lat: 21.0156,
        lng: 105.8516,
      },
      {
        name: 'Nút giao Phố Huế – Đại Cồ Việt',
        detail: 'Vành đai 1 Hà Nội',
        x: 618,
        y: 188,
        lat: 21.0105,
        lng: 105.8500,
      },
      {
        name: 'Hầm chui Kim Liên – Xã Đàn',
        detail: 'Trục đường Vành đai 1',
        x: 553,
        y: 185,
        lat: 21.0110,
        lng: 105.8410,
      },
      {
        name: 'Đường Xã Đàn – Nam Đồng',
        detail: 'Quận Đống Đa, Hà Nội',
        x: 495,
        y: 169,
        lat: 21.0140,
        lng: 105.8330,
      },
      {
        name: 'Nút giao Ô Chợ Dừa – Tôn Đức Thắng',
        detail: 'Rẽ vào trục Tây Sơn',
        x: 436,
        y: 153,
        lat: 21.0170,
        lng: 105.8250,
      },
      {
        name: 'Đường Tây Sơn (Gò Đống Đa)',
        detail: 'Hướng về Ngã Tư Sở',
        x: 405,
        y: 180,
        lat: 21.0120,
        lng: 105.8207,
      },
      {
        name: 'Cầu vượt Ngã Tư Sở',
        detail: 'Đầu trục đường Nguyễn Trãi',
        x: 371,
        y: 224,
        lat: 21.0040,
        lng: 105.8160,
      },
      {
        name: 'Đường Nguyễn Trãi – Royal City',
        detail: 'Trục đại lộ đôi Thanh Xuân',
        x: 349,
        y: 240,
        lat: 21.0010,
        lng: 105.8130,
      },
      {
        name: 'Đường Nguyễn Trãi – Thượng Đình',
        detail: 'Đoạn ga Thượng Đình đường sắt trên cao',
        x: 313,
        y: 267,
        lat: 20.9960,
        lng: 105.8080,
      },
      {
        name: 'Hầm chui Thanh Xuân (Vành đai 3)',
        detail: 'Nút giao Khuất Duy Tiến – Nguyễn Trãi',
        x: 262,
        y: 295,
        lat: 20.9910,
        lng: 105.8010,
      },
      {
        name: 'Đường Nguyễn Trãi – Ga Phùng Khoang',
        detail: 'Giáp ranh Thanh Xuân – Hà Đông',
        x: 211,
        y: 325,
        lat: 20.9855,
        lng: 105.7940,
      },
      PTIT_DEST,
    ],
  },
  {
    id: 'bicycle',
    name: 'Xe đạp Giao hàng Eco-Friendly',
    subtitle: 'Vận chuyển xanh bảo vệ môi trường qua Hoàng Cầu – Yên Lãng – Nguyễn Trãi',
    fee: 15000,
    speedLabel: '18 km/h (Zero-emission)',
    totalDistanceKm: 7.8,
    originName: 'Hub Eco Boutique Hoàng Cầu',
    originAddress: 'Số 36 Hoàng Cầu, Quận Đống Đa, Hà Nội',
    originCoords: { lat: 21.0170, lng: 105.8250 },
    waypoints: [
      {
        name: 'Hub Eco Boutique Hoàng Cầu',
        detail: 'Số 36 Hoàng Cầu, Đống Đa, Hà Nội',
        x: 436,
        y: 153,
        lat: 21.0170,
        lng: 105.8250,
      },
      {
        name: 'Phố Yên Lãng (Dọc tuyến metro)',
        detail: 'Làn xe đạp ven hồ Hoàng Cầu',
        x: 393,
        y: 169,
        lat: 21.0140,
        lng: 105.8190,
      },
      {
        name: 'Phố Thái Thịnh – Tây Sơn',
        detail: 'Đi đúng làn phố Tây Sơn',
        x: 371,
        y: 191,
        lat: 21.0100,
        lng: 105.8160,
      },
      {
        name: 'Nút giao Ngã Tư Sở',
        detail: 'Đi dưới chân cầu vượt vào Nguyễn Trãi',
        x: 371,
        y: 224,
        lat: 21.0040,
        lng: 105.8160,
      },
      {
        name: 'Làn xe thô sơ Nguyễn Trãi (Royal City)',
        detail: 'Làn trong cùng dành cho xe đạp/xe máy',
        x: 349,
        y: 240,
        lat: 21.0010,
        lng: 105.8130,
      },
      {
        name: 'Đường Nguyễn Trãi – Thượng Đình',
        detail: 'Quận Thanh Xuân, Hà Nội',
        x: 313,
        y: 267,
        lat: 20.9960,
        lng: 105.8080,
      },
      {
        name: 'Đường Nguyễn Trãi – Vành đai 3',
        detail: 'Đi đường gom ven hầm chui Thanh Xuân',
        x: 262,
        y: 295,
        lat: 20.9910,
        lng: 105.8010,
      },
      {
        name: 'Đường Nguyễn Trãi – Triều Khúc',
        detail: 'Khu vực Đại học Hà Nội',
        x: 211,
        y: 325,
        lat: 20.9855,
        lng: 105.7940,
      },
      PTIT_DEST,
    ],
  },
  {
    id: 'car',
    name: 'Ô tô tải Van Chuyên dụng',
    subtitle: 'Chạy thẳng trục đường lớn Vành đai 3 trên cao – Hầm chui Nguyễn Trãi',
    fee: 40000,
    speedLabel: '55 km/h (Đúng lộ trình trục chính)',
    totalDistanceKm: 9.8,
    originName: 'Trung tâm Phân phối MaisonAI Cầu Giấy',
    originAddress: 'Số 12 Phạm Hùng, Quận Cầu Giấy, Hà Nội',
    originCoords: { lat: 21.0280, lng: 105.7800 },
    waypoints: [
      {
        name: 'Hub MaisonAI Cầu Giấy',
        detail: '12 Phạm Hùng, Cầu Giấy, Hà Nội',
        x: 109,
        y: 93,
        lat: 21.0280,
        lng: 105.7800,
      },
      {
        name: 'Trục Phạm Hùng – Nút giao Mễ Trì',
        detail: 'Qua Keangnam Landmark 72',
        x: 138,
        y: 147,
        lat: 21.0180,
        lng: 105.7840,
      },
      {
        name: 'Nút giao Trung Hòa (Đại lộ Thăng Long)',
        detail: 'Nhập vào đường Vành đai 3 trên cao',
        x: 182,
        y: 205,
        lat: 21.0075,
        lng: 105.7900,
      },
      {
        name: 'Đường Vành đai 3 trên cao (Khuất Duy Tiến)',
        detail: 'Trục cao tốc đô thị',
        x: 218,
        y: 251,
        lat: 20.9990,
        lng: 105.7950,
      },
      {
        name: 'Nút giao 4 tầng Thanh Xuân – Nguyễn Trãi',
        detail: 'Xe rẽ phải nhập làn đường Nguyễn Trãi',
        x: 262,
        y: 295,
        lat: 20.9910,
        lng: 105.8010,
      },
      {
        name: 'Đường Nguyễn Trãi – Ga Phùng Khoang',
        detail: 'Trục đường đôi hướng về Hà Đông',
        x: 211,
        y: 325,
        lat: 20.9855,
        lng: 105.7940,
      },
      PTIT_DEST,
    ],
  },
  {
    id: 'autonomous',
    name: 'Xe tự lái AI (Autonomous Pod)',
    subtitle: 'Xe điện tự hành LiDAR chạy chuyên biệt theo tim đường đôi Nguyễn Trãi',
    fee: 35000,
    speedLabel: '38 km/h (Tự hành cấp độ 4)',
    totalDistanceKm: 5.6,
    originName: 'Trạm Xe Tự Hành SmartHub Thanh Xuân',
    originAddress: '235 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội',
    originCoords: { lat: 20.9960, lng: 105.8080 },
    waypoints: [
      {
        name: 'SmartHub Thanh Xuân',
        detail: '235 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        x: 313,
        y: 267,
        lat: 20.9960,
        lng: 105.8080,
      },
      {
        name: 'Làn ưu tiên xe tự hành (Qua nút giao Vành đai 3)',
        detail: 'Cảm biến LiDAR quét vạch kẻ đường Nguyễn Trãi',
        x: 262,
        y: 295,
        lat: 20.9910,
        lng: 105.8010,
      },
      {
        name: 'Trục Nguyễn Trãi – Ga Phùng Khoang',
        detail: 'Tự động dừng đèn tín hiệu thông minh',
        x: 211,
        y: 325,
        lat: 20.9855,
        lng: 105.7940,
      },
      PTIT_DEST,
    ],
  },
  {
    id: 'drone',
    name: 'Drone Giao hàng Tự động (UAV)',
    subtitle: 'Bay thẳng đường chim bay tầm thấp từ Trạm SkyHub Royal City tới bãi đáp PTIT',
    fee: 65000,
    speedLabel: '78 km/h (Bay thẳng đường chim bay)',
    totalDistanceKm: 4.3,
    originName: 'Trạm Drone MaisonAI SkyHub Royal City',
    originAddress: 'Tầng thượng R1, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội',
    originCoords: { lat: 21.0010, lng: 105.8130 },
    waypoints: [
      {
        name: 'SkyHub Royal City',
        detail: 'Bãi cất cánh Tầng thượng R1, 72A Nguyễn Trãi',
        x: 349,
        y: 240,
        lat: 21.0010,
        lng: 105.8130,
      },
      {
        name: 'Hành lang bay thẳng tầm thấp Thượng Đình – Văn Quán',
        detail: 'Bay thẳng đường chim bay ở độ cao 85m trên không',
        x: 256,
        y: 295,
        lat: 20.9910,
        lng: 105.8002,
      },
      PTIT_DEST,
    ],
  },
  {
    id: 'airplane',
    name: 'Máy bay Cargo Hàng không & Drone',
    subtitle: 'Bay thẳng đường hàng không từ Cảng hàng không Quốc tế Nội Bài về PTIT',
    fee: 90000,
    speedLabel: '750 km/h (Bay thẳng không phận)',
    totalDistanceKm: 32.5,
    originName: 'Cảng Hàng không Quốc tế Nội Bài (Cargo Terminal)',
    originAddress: 'Ga Hàng hóa Nội Bài, Sóc Sơn, Hà Nội',
    originCoords: { lat: 21.2187, lng: 105.8200 },
    waypoints: [
      {
        name: 'Ga Hàng hóa Sân bay Nội Bài',
        detail: 'Cất cánh chuyến bay Cargo Express VN-2026',
        x: 420,
        y: 30,
        lat: 21.2187,
        lng: 105.8200,
      },
      {
        name: 'Hành lang bay thẳng không phận Tây Nam Hà Nội',
        detail: 'Đường bay thẳng trên cao tiếp cận vùng trời Hà Đông',
        x: 291,
        y: 190,
        lat: 21.1000,
        lng: 105.8037,
      },
      PTIT_DEST,
    ],
  },
];

export function TransportVehicleSvg({
  mode,
  size = 20,
}: {
  mode: ShippingMethodId;
  size?: number;
}) {
  switch (mode) {
    case 'motorbike':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6h3l2 5h-3.5L14 6Z" />
          <path d="M5.5 17.5 9 11h5l2 6.5" />
          <path d="M9 11 7 8H4" />
        </svg>
      );
    case 'car':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case 'drone':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="6" height="6" rx="1.5" />
          <path d="M9 9 5 5M15 9l4-4M9 15l-4 4M15 15l4 4" />
          <circle cx="4.5" cy="4.5" r="2.5" />
          <circle cx="19.5" cy="4.5" r="2.5" />
          <circle cx="4.5" cy="19.5" r="2.5" />
          <circle cx="19.5" cy="19.5" r="2.5" />
        </svg>
      );
    case 'autonomous':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="8" width="18" height="9" rx="4" />
          <path d="M9 5a3 3 0 0 1 6 0v3H9V5Z" />
          <circle cx="7.5" cy="17.5" r="2" />
          <circle cx="16.5" cy="17.5" r="2" />
          <path d="M8 2.5a6.5 6.5 0 0 1 8 0" />
        </svg>
      );
    case 'airplane':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case 'bicycle':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M12 17.5 8.5 11h7l-3.5 6.5Z" />
          <path d="M5.5 17.5 8.5 11 11 6h3" />
          <path d="M18.5 17.5 15.5 11" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      );
  }
}

function interpolateAlongWaypoints(
  waypoints: TransportOption['waypoints'],
  progress01: number
) {
  if (waypoints.length === 0) {
    return {
      x: PTIT_DEST.x,
      y: PTIT_DEST.y,
      lat: PTIT_DEST.lat,
      lng: PTIT_DEST.lng,
      currentSegmentIdx: 0,
    };
  }
  if (progress01 <= 0) {
    return {
      x: waypoints[0].x,
      y: waypoints[0].y,
      lat: waypoints[0].lat,
      lng: waypoints[0].lng,
      currentSegmentIdx: 0,
    };
  }
  if (progress01 >= 1) {
    const last = waypoints[waypoints.length - 1];
    return {
      x: last.x,
      y: last.y,
      lat: last.lat,
      lng: last.lng,
      currentSegmentIdx: waypoints.length - 1,
    };
  }

  // Compute segment lengths in SVG space
  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const d = Math.hypot(dx, dy);
    segLengths.push(d);
    totalLen += d;
  }

  let targetDist = progress01 * totalLen;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (targetDist <= segLen || i === segLengths.length - 1) {
      const localT = segLen > 0 ? Math.min(1, Math.max(0, targetDist / segLen)) : 1;
      const a = waypoints[i];
      const b = waypoints[i + 1];
      return {
        x: a.x + (b.x - a.x) * localT,
        y: a.y + (b.y - a.y) * localT,
        lat: Number((a.lat + (b.lat - a.lat) * localT).toFixed(4)),
        lng: Number((a.lng + (b.lng - a.lng) * localT).toFixed(4)),
        currentSegmentIdx: localT > 0.5 ? i + 1 : i,
      };
    }
    targetDist -= segLen;
  }

  const last = waypoints[waypoints.length - 1];
  return {
    x: last.x,
    y: last.y,
    lat: last.lat,
    lng: last.lng,
    currentSegmentIdx: waypoints.length - 1,
  };
}

export function ShipmentMapSimulator({
  order,
  onOrderStatusChanged,
}: {
  order: Order;
  onOrderStatusChanged?: (nextStatus: OrderStatus) => void;
}) {
  const initialMode: ShippingMethodId =
    order.shippingAddress.shippingMethod || 'motorbike';
  const [selectedMode, setSelectedMode] =
    useState<ShippingMethodId>(initialMode);

  const transport = useMemo(
    () =>
      TRANSPORT_OPTIONS.find((t) => t.id === selectedMode) ||
      TRANSPORT_OPTIONS[0],
    [selectedMode]
  );

  // Total timeline = 30.0 seconds:
  // - 0.0s .. 10.0s : Phase 1 — Chuẩn bị & đóng gói đồ tại kho (10s)
  // - 10.0s .. 30.0s: Phase 2 — Đang vận chuyển thực tế trên bản đồ tới Học viện Công nghệ Bưu chính Viễn thông (20s)
  // - >= 30.0s      : Phase 3 — Đã tới cổng PTIT, hiển thị nút "Đã nhận được hàng"
  const [elapsedSec, setElapsedSec] = useState<number>(() => {
    if (order.orderStatus === 'completed') return 30;
    return 0;
  });
  const [isConfirmedReceived, setIsConfirmedReceived] = useState<boolean>(
    order.orderStatus === 'completed'
  );
  const [statusSyncedToShipping, setStatusSyncedToShipping] = useState(false);

  useEffect(() => {
    if (isConfirmedReceived) return;
    const interval = setInterval(() => {
      setElapsedSec((prev) => {
        const next = Number((prev + 0.1).toFixed(1));
        if (next >= 30) {
          clearInterval(interval);
          return 30;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isConfirmedReceived, selectedMode]);

  // Sync status to 'shipping' when transitioning from 10s prep to 20s transit
  useEffect(() => {
    if (
      elapsedSec >= 10 &&
      elapsedSec < 30 &&
      !statusSyncedToShipping &&
      !isConfirmedReceived
    ) {
      setStatusSyncedToShipping(true);
      orderRepository.updateStatus(order.orderCode, 'shipping');
      onOrderStatusChanged?.('shipping');
    }
  }, [
    elapsedSec,
    statusSyncedToShipping,
    isConfirmedReceived,
    order.orderCode,
    onOrderStatusChanged,
  ]);

  const phase: 'preparing' | 'shipping' | 'arrived' | 'completed' =
    isConfirmedReceived
      ? 'completed'
      : elapsedSec < 10
      ? 'preparing'
      : elapsedSec < 30
      ? 'shipping'
      : 'arrived';

  const prepSecondsLeft = Math.max(0, Math.ceil(10 - elapsedSec));
  const prepProgressPct = Math.min(100, Math.round((elapsedSec / 10) * 100));

  const shippingElapsed = Math.max(0, Math.min(20, elapsedSec - 10));
  const shippingSecondsLeft = Math.max(0, Math.ceil(20 - shippingElapsed));
  const shippingProgress01 = Math.min(1, Math.max(0, shippingElapsed / 20));
  const shippingProgressPct = Math.round(shippingProgress01 * 100);

  const livePos = useMemo(
    () => interpolateAlongWaypoints(transport.waypoints, shippingProgress01),
    [transport.waypoints, shippingProgress01]
  );

  const remainingKm = Number(
    (transport.totalDistanceKm * (1 - shippingProgress01)).toFixed(1)
  );

  const activeWaypoint =
    transport.waypoints[livePos.currentSegmentIdx] || transport.waypoints[0];

  const handleConfirmReceived = () => {
    setIsConfirmedReceived(true);
    orderRepository.updateStatus(order.orderCode, 'completed');
    onOrderStatusChanged?.('completed');
  };

  const handleRestartSimulation = (mode?: ShippingMethodId) => {
    if (mode) setSelectedMode(mode);
    setIsConfirmedReceived(false);
    setStatusSyncedToShipping(false);
    setElapsedSec(0);
    orderRepository.updateStatus(order.orderCode, 'confirmed');
    onOrderStatusChanged?.('confirmed');
  };

  const polylinePoints = transport.waypoints
    .map((wp) => `${wp.x},${wp.y}`)
    .join(' ');

  return (
    <div className="card bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden">
      {/* Top Status Header */}
      <div className="bg-neutral text-neutral-content p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-primary badge-sm uppercase tracking-wider font-semibold">
              Mô Phỏng Giao Vận Thời Gian Thực
            </span>
            <span className="font-mono text-xs text-neutral-content/70">
              Mã vận đơn: #{order.orderCode}
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-white">
            {phase === 'preparing' &&
              `Đang chuẩn bị & đóng gói đồ tại kho (${prepSecondsLeft}s)`}
            {phase === 'shipping' &&
              `Đang vận chuyển bằng ${transport.name} (${shippingSecondsLeft}s)`}
            {phase === 'arrived' &&
              'Đơn hàng đã tới Học viện Công nghệ Bưu chính Viễn thông!'}
            {phase === 'completed' &&
              'Giao hàng hoàn tất — Khách hàng đã xác nhận nhận hàng'}
          </h3>
        </div>

        {/* Phase Indicator Badge */}
        <div className="flex items-center gap-2">
          {phase === 'preparing' && (
            <span className="badge badge-warning badge-lg gap-2 font-semibold">
              <span className="loading loading-spinner loading-xs" />
              Chuẩn bị hàng: {prepSecondsLeft}s
            </span>
          )}
          {phase === 'shipping' && (
            <span className="badge badge-info badge-lg gap-2 font-semibold">
              <span className="loading loading-ring loading-sm" />
              Đang giao: {shippingSecondsLeft}s còn lại
            </span>
          )}
          {phase === 'arrived' && (
            <span className="badge badge-success badge-lg font-semibold animate-bounce">
              Đã đến cổng PTIT — Chờ nhận hàng
            </span>
          )}
          {phase === 'completed' && (
            <span className="badge badge-success badge-lg font-semibold">
              Đơn hàng Hoàn tất
            </span>
          )}
        </div>
      </div>

      {/* Transport Mode Switcher Bar */}
      <div className="bg-base-200/70 border-b border-base-300 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-base-content/70 mr-1">
            Phương tiện vận chuyển:
          </span>
          {TRANSPORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleRestartSimulation(opt.id)}
              className={`btn btn-xs gap-1.5 ${
                selectedMode === opt.id
                  ? 'btn-primary'
                  : 'btn-outline border-base-300 bg-base-100'
              }`}
            >
              <TransportVehicleSvg mode={opt.id} size={13} />
              <span>{opt.name.split(' ')[0]} {opt.name.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => handleRestartSimulation()}
          className="btn btn-ghost btn-xs text-primary"
        >
          Chạy lại mô phỏng (10s chuẩn bị + 20s giao hàng)
        </button>
      </div>

      {/* Main Content Grid: Left Real Map Canvas + Right Live Telemetry & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 7 Cols: Interactive Hanoi -> PTIT Map */}
        <div className="lg:col-span-7 relative bg-[#e8ecef] min-h-[380px] sm:min-h-[430px] border-b lg:border-b-0 lg:border-r border-base-300 overflow-hidden">
          {/* OpenStreetMap Hanoi Embed Layer (Hoan Kiem -> Thanh Xuan -> Ha Dong PTIT) */}
          <iframe
            title="Bản đồ vận chuyển Hà Nội tới Học viện Công nghệ Bưu chính Viễn thông"
            src="https://www.openstreetmap.org/export/embed.html?bbox=105.7650%2C20.9680%2C105.8750%2C21.0450&layer=mapnik"
            className="absolute inset-0 w-full h-full opacity-55 pointer-events-none contrast-105"
          />

          {/* Subtle Cartographic Grid & Hanoi River/Arterial Overlay */}
          <svg
            viewBox="0 0 800 420"
            className="relative z-10 w-full h-full min-h-[380px] sm:min-h-[430px]"
          >
            <defs>
              <linearGradient id="routeGrad" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.28" />
              </filter>
            </defs>

            {/* Red River (Sông Hồng) stylized geographic curve on the east of Hanoi */}
            <path
              d="M 560 0 Q 690 110 700 240 T 680 420"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="26"
              strokeLinecap="round"
              opacity="0.55"
            />
            <text
              x="692"
              y="185"
              fill="#1e40af"
              fontSize="10"
              fontWeight="600"
              opacity="0.7"
              transform="rotate(78 692 185)"
            >
              SÔNG HỒNG
            </text>

            {/* Hanoi Arterial Streets Network Overlay (Roads follow actual coordinates) */}
            <g opacity="0.85">
              {/* Trục Nguyễn Trãi - Trần Phú (Hà Đông) */}
              <path
                d="M 371 224 L 349 240 L 313 267 L 262 295 L 211 325 L 163 350 L 110 380"
                fill="none"
                stroke="#fed7aa"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 371 224 L 349 240 L 313 267 L 262 295 L 211 325 L 163 350 L 110 380"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="215"
                y="312"
                fill="#78350f"
                fontSize="9.5"
                fontWeight="700"
                transform="rotate(-30 215 312)"
              >
                ĐƯỜNG NGUYỄN TRÃI
              </text>

              {/* Trục Vành đai 3 (Phạm Hùng - Khuất Duy Tiến) */}
              <path
                d="M 109 40 L 109 93 L 138 147 L 182 205 L 218 251 L 262 295 L 340 350"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 109 40 L 109 93 L 138 147 L 182 205 L 218 251 L 262 295 L 340 350"
                fill="none"
                stroke="#64748b"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="188"
                y="235"
                fill="#1e293b"
                fontSize="9.5"
                fontWeight="700"
                transform="rotate(50 188 235)"
              >
                VÀNH ĐAI 3 (KHUẤT DUY TIẾN)
              </text>

              {/* Trục Phố Huế - Xã Đàn - Tây Sơn */}
              <path
                d="M 647 112 L 636 128 L 630 160 L 618 188 L 553 185 L 495 169 L 436 153 L 405 180 L 371 224"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 647 112 L 636 128 L 630 160 L 618 188 L 553 185 L 495 169 L 436 153 L 405 180 L 371 224"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="465" y="160" fill="#334155" fontSize="9" fontWeight="700">
                XÃ ĐÀN – TÂY SƠN
              </text>

              {/* Trục Đại lộ Thăng Long */}
              <path
                d="M 182 205 L 30 205"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <text x="60" y="200" fill="#475569" fontSize="8.5" fontWeight="600">
                ĐẠI LỘ THĂNG LONG
              </text>
            </g>

            {/* Aerial Flight Corridor for UAV Drone and Airplane */}
            {(selectedMode === 'drone' || selectedMode === 'airplane') && (
              <g>
                <line
                  x1={transport.waypoints[0].x}
                  y1={transport.waypoints[0].y}
                  x2={PTIT_DEST.x}
                  y2={PTIT_DEST.y}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />
              </g>
            )}

            {/* Dashed background full route path */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#1f2937"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
            />
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="4.5"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Waypoint checkpoints */}
            {transport.waypoints.map((wp, idx) => {
              const isOrigin = idx === 0;
              const isDest = idx === transport.waypoints.length - 1;
              const isCurrentTarget = idx === livePos.currentSegmentIdx;
              const isPassed = idx <= livePos.currentSegmentIdx && phase !== 'preparing';
              const shouldShowLabel = isOrigin || isDest || (isCurrentTarget && phase === 'shipping');

              return (
                <g key={wp.name}>
                  {isDest && (
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r="22"
                      fill="#16a34a"
                      opacity="0.2"
                    >
                      <animate
                        attributeName="r"
                        values="14;28;14"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {isOrigin && (
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r="18"
                      fill="#9a3412"
                      opacity="0.2"
                    />
                  )}
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={isOrigin || isDest ? 8 : isCurrentTarget ? 6.5 : 4.5}
                    fill={
                      isDest
                        ? '#15803d'
                        : isOrigin
                        ? '#9a3412'
                        : isPassed
                        ? '#15803d'
                        : '#ffffff'
                    }
                    stroke="#1f2937"
                    strokeWidth={isOrigin || isDest ? 2.5 : 1.5}
                  />

                  {/* Labels for Origin, Current Target, and PTIT Destination */}
                  {shouldShowLabel && (
                    <g
                      transform={`translate(${
                        isDest ? wp.x - 10 : wp.x + 12
                      }, ${isDest ? wp.y + 24 : wp.y - 10})`}
                    >
                      <rect
                        x="-6"
                        y="-13"
                        width={isDest ? 295 : isOrigin ? 205 : 190}
                        height={isDest ? 34 : 22}
                        rx="5"
                        fill={isDest ? '#14532d' : isCurrentTarget ? '#1e293b' : '#ffffff'}
                        fillOpacity={isDest ? '0.95' : isCurrentTarget ? '0.92' : '0.9'}
                        stroke={isDest ? '#22c55e' : isCurrentTarget ? '#38bdf8' : '#d1d5db'}
                        strokeWidth="1"
                        filter="url(#dropShadow)"
                      />
                      <text
                        x="2"
                        y="1"
                        fill={isDest || isCurrentTarget ? '#ffffff' : '#111827'}
                        fontSize={isDest ? '11' : '10'}
                        fontWeight="700"
                      >
                        {isDest
                          ? 'ĐIỂM ĐẾN: HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG'
                          : isOrigin
                          ? `ĐIỂM ĐI: ${wp.name}`
                          : `ĐANG TỚI: ${wp.name}`}
                      </text>
                      {isDest && (
                        <text x="2" y="15" fill="#bbf7d0" fontSize="9.5">
                          Km10 Nguyễn Trãi, Quận Hà Đông, Hà Nội
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Moving Vehicle Marker on Map */}
            <g
              transform={`translate(${livePos.x}, ${livePos.y})`}
              filter="url(#dropShadow)"
            >
              <circle
                cx="0"
                cy="0"
                r="24"
                fill={phase === 'preparing' ? '#f59e0b' : '#7c2d12'}
                opacity="0.22"
              >
                <animate
                  attributeName="r"
                  values="18;28;18"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx="0"
                cy="0"
                r="16"
                fill={
                  phase === 'preparing'
                    ? '#d97706'
                    : phase === 'arrived' || phase === 'completed'
                    ? '#15803d'
                    : '#7c2d12'
                }
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <g transform="translate(-10, -10)" className="text-white">
                <TransportVehicleSvg mode={selectedMode} size={20} />
              </g>

              {/* Floating Live Callout Tag above Vehicle */}
              <g transform="translate(-78, -44)">
                <rect
                  x="0"
                  y="0"
                  width="156"
                  height="22"
                  rx="11"
                  fill="#111827"
                  fillOpacity="0.92"
                />
                <text
                  x="78"
                  y="14"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="600"
                >
                  {phase === 'preparing'
                    ? `Đóng gói tại kho (${prepSecondsLeft}s)`
                    : phase === 'shipping'
                    ? `Đang chạy • Còn ${remainingKm} km (${shippingSecondsLeft}s)`
                    : 'Đã đến cổng PTIT Hà Đông!'}
                </text>
              </g>
            </g>
          </svg>

          {/* Bottom-left GPS Coordinates Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-base-100/95 backdrop-blur-xs border border-base-300 rounded-field px-3 py-1.5 text-[11px] shadow-sm flex items-center gap-3">
            <span>
              <strong>Tọa độ GPS trực tiếp:</strong> {livePos.lat}°N,{' '}
              {livePos.lng}°E
            </span>
            <span className="text-base-content/50">|</span>
            <span>
              <strong>Tốc độ:</strong>{' '}
              {phase === 'shipping' ? transport.speedLabel : '0 km/h'}
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Real-time 10s + 20s Progress & Confirmation CTA */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-base-100">
          <div className="space-y-4">
            {/* Origin -> Destination Address Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-field bg-base-200/60 border border-base-300">
                <span className="text-[10px] uppercase tracking-wider text-base-content/60 font-bold block">
                  Địa chỉ kho xuất phát (Địa chỉ ảo)
                </span>
                <strong className="text-sm text-neutral block">
                  {transport.originName}
                </strong>
                <span className="text-base-content/70">
                  {transport.originAddress}
                </span>
              </div>

              <div className="p-3 rounded-field bg-primary/5 border border-primary/30">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold block">
                  Địa chỉ nhận hàng thực tế
                </span>
                <strong className="text-sm text-neutral block">
                  Học viện Công nghệ Bưu chính Viễn thông (PTIT)
                </strong>
                <span className="text-base-content/70">
                  {order.shippingAddress.streetAddress},{' '}
                  {order.shippingAddress.district}, {order.shippingAddress.city}{' '}
                  • Người nhận: <strong>{order.shippingAddress.recipientName}</strong>
                </span>
              </div>
            </div>

            {/* Step 1: 10s Warehouse Preparation Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-neutral">
                  Giai đoạn 1: Chuẩn bị & Đóng gói đồ tại kho (10 giây)
                </strong>
                <span className="font-mono font-semibold text-primary">
                  {Math.min(10, Math.floor(elapsedSec))}/10s ({prepProgressPct}%)
                </span>
              </div>
              <progress
                className="progress progress-warning w-full h-2.5"
                value={prepProgressPct}
                max={100}
              />
              <p className="text-[11px] text-base-content/60">
                {elapsedSec < 4
                  ? 'Đang lấy sản phẩm từ kệ kho và kiểm tra tem kích cỡ...'
                  : elapsedSec < 8
                  ? 'Đang bọc giấy chống ẩm, đóng hộp cứng và in vận đơn điện tử...'
                  : 'Đã bàn giao kiện hàng cho phương tiện vận chuyển.'}
              </p>
            </div>

            {/* Step 2: 20s Live Map Transit Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-neutral">
                  Giai đoạn 2: Vận chuyển thực tế tới PTIT (20 giây)
                </strong>
                <span className="font-mono font-semibold text-info">
                  {Math.floor(shippingElapsed)}/20s ({shippingProgressPct}%)
                </span>
              </div>
              <progress
                className="progress progress-info w-full h-2.5"
                value={shippingProgressPct}
                max={100}
              />
              <p className="text-[11px] text-base-content/70">
                <strong>Vị trí hiện tại:</strong> {activeWaypoint.name} —{' '}
                {activeWaypoint.detail}
              </p>
            </div>
          </div>

          {/* Step 3: Pop-up "Đã nhận được hàng" Action Button when 20s shipping completes */}
          <div className="pt-4 border-t border-base-300">
            {phase === 'arrived' && (
              <div className="card bg-success/10 border-2 border-success p-4 space-y-3 animate-fade-in">
                <div className="text-xs text-base-content">
                  <strong className="text-success text-sm block mb-0.5">
                    Phương tiện đã giao hàng tới Học viện Công nghệ Bưu chính Viễn thông!
                  </strong>
                  Vui lòng kiểm tra kiện hàng và bấm nút xác nhận bên dưới để hoàn tất đơn hàng.
                </div>
                <button
                  type="button"
                  onClick={handleConfirmReceived}
                  className="btn btn-success btn-block btn-lg text-white font-semibold shadow-lg"
                >
                  Đã nhận được hàng — Hoàn tất đơn hàng
                </button>
              </div>
            )}

            {phase === 'completed' && (
              <div className="card bg-base-200/80 border border-success/40 p-4 space-y-2 text-center">
                <span className="badge badge-success mx-auto font-semibold">
                  Đơn hàng #{order.orderCode} đã hoàn tất
                </span>
                <p className="text-xs text-base-content/70">
                  Cảm ơn bạn đã xác nhận nhận hàng tại{' '}
                  <strong>Học viện Công nghệ Bưu chính Viễn thông (PTIT)</strong>. Trạng thái đơn hàng đã được cập nhật thành <strong>Hoàn tất</strong>.
                </p>
              </div>
            )}

            {(phase === 'preparing' || phase === 'shipping') && (
              <div className="alert alert-soft alert-info text-xs py-3">
                <span>
                  Nút <strong>“Đã nhận được hàng”</strong> sẽ tự động xuất hiện ngay khi phương tiện di chuyển tới cổng{' '}
                  <strong>Học viện Công nghệ Bưu chính Viễn thông</strong> (sau{' '}
                  <strong>
                    {phase === 'preparing'
                      ? `${prepSecondsLeft + 20} giây`
                      : `${shippingSecondsLeft} giây`}
                  </strong>{' '}
                  nữa).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
