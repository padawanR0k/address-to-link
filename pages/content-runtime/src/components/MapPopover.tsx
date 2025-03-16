import { useEffect, useRef, useState } from 'react';
import { getAddressCoordinates } from '../services/geocoding';

interface MapPopoverProps {
  address: string;
  width: number;
  height: number;
  onClose: () => void;
}

export function MapPopover({ address, width, height, onClose }: MapPopoverProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Kakao Map API 로드
    const script = document.createElement('script');
    script.src =
      'https://dapi.kakao.com/v2/maps/sdk.js?appkey=2e30b0218283aeee60f7eab58e3d4caa&libraries=services&autoload=false';
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        initMap();
      });
    };

    script.onerror = () => {
      setError('지도 API를 로드하는데 실패했습니다.');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 지도 초기화 함수
  const initMap = async () => {
    try {
      if (!mapContainerRef.current) return;

      // 주소로 좌표 검색
      const coordinates = await getAddressCoordinates(address);
      if (!coordinates) {
        setError('해당 주소의 위치를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 지도 생성
      const options = {
        center: new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapContainerRef.current, options);
      mapInstanceRef.current = map;

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng),
      });
      marker.setMap(map);

      setLoading(false);
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('지도를 불러오는데 문제가 발생했습니다.');
      setLoading(false);
    }
  };

  // ESC 키로 팝오버 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="shadow-xl rounded-md overflow-hidden bg-white"
      style={{
        width: `${width}px`,
        maxWidth: '500px',
        minWidth: '300px',
        border: '1px solid #ccc',
      }}>
      <div className="p-2 flex justify-between items-center bg-blue-50 border-b">
        <h3 className="text-sm font-medium text-gray-700 truncate" title={address}>
          위치: {address}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
          ✕
        </button>
      </div>

      <div ref={mapContainerRef} style={{ height: `${height}px`, width: '100%' }} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-red-500 text-center p-4">{error}</div>
          </div>
        )}
      </div>

      <div className="p-2 bg-blue-50 text-xs text-gray-500 text-right">
        <a
          href={`https://map.kakao.com/link/search/${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline">
          카카오맵에서 보기
        </a>
      </div>
    </div>
  );
}
