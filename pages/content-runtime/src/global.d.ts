declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        services: {
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
          Geocoder: new () => {
            addressSearch: (address: string, callback: (result: any[], status: string) => void) => void;
          };
        };
      };
    };
  }
}

export {};
