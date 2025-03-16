interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * 주소를 좌표로 변환하는 함수
 * Kakao Maps API의 Geocoder 사용
 */
export async function getAddressCoordinates(address: string): Promise<Coordinates | null> {
  return new Promise(resolve => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps API is not loaded');
      resolve(null);
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(address, (result: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        resolve({
          lat: Number.parseFloat(result[0].y),
          lng: Number.parseFloat(result[0].x),
        });
      } else {
        resolve(null);
      }
    });
  });
}
