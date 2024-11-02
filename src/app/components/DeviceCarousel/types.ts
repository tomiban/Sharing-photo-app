// src/components/DeviceCarousel/types.ts
export type PhotoType = {
    id: string;
    image_url: string;
    comment?: string;
  };
  
  export type DeviceConfig = {
    device: string;
    color: string;
    defaultZoom: number;
    width: number;
    height: number;
  };
  
  export type DeviceCarouselProps = {
    photos: PhotoType[];
    deviceConfig: DeviceConfig;
    isFullscreen?: boolean;
    width: number;
    height: number;
  };