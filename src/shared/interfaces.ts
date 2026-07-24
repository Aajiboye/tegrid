/**@description `SignedUrlParams` is the structure that holds parameters for generating a signed URL. */
export interface SignedUrlParams {
  timestamp: number;
  upload_preset: string;
  folder: string;
  eager?: string;
}
