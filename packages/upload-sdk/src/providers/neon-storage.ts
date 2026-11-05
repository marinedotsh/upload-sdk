import { UploadSDKError } from "../error"
import type { StorageProvider } from "./../types"
import { createS3CompatibleProvider } from "./s3-compatible"

export type NeonStorageConfig = {
  bucket: string
  /** The branch storage endpoint, exposed as `AWS_ENDPOINT_URL_S3`. */
  endpoint: string
  region: string

  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

export function neonStorage(config: NeonStorageConfig): StorageProvider {
  return createS3CompatibleProvider(config, {
    serviceName: "Neon Object Storage",
    endpoint: parseEndpoint(config.endpoint),
    // Neon Object Storage only supports path-style addressing.
    forcePathStyle: true,
  })
}

function parseEndpoint(endpoint: string): string {
  let url: URL

  try {
    url = new URL(endpoint)
  } catch {
    throw new UploadSDKError("Neon Object Storage endpoint must be a valid URL", {
      code: "INVALID_UPLOAD_CONFIG",
    })
  }

  if (url.protocol !== "https:") {
    throw new UploadSDKError("Neon Object Storage endpoint must use https", {
      code: "INVALID_UPLOAD_CONFIG",
    })
  }

  return url.origin
}
