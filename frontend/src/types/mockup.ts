export type DeviceType = 'none' | 'browser';
export type BrandingPosition = 'none' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface MockupSettings {
  deviceType: DeviceType;
  backgroundColor: string;
  borderRadius: number;
  imageRadius: number;
  imageScale: number;
  browserScale: number;
  shadow: boolean;
  deviceColor: 'black' | 'silver';
  brandingPosition: BrandingPosition;
}

export interface SavedPreset {
  id: string;
  name: string;
  settings: MockupSettings;
}

export interface UploadedImage {
  id: string;
  src: string;
  name: string;
}
