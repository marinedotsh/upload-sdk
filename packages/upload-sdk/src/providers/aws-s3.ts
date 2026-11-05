import type { StorageProvider } from "./../types"
import { createS3CompatibleProvider, type S3CompatibleConfig } from "./s3-compatible"

export type AwsS3Config = S3CompatibleConfig

export function awsS3(config: AwsS3Config): StorageProvider {
  return createS3CompatibleProvider(config, {
    serviceName: "S3",
    endpoint: `https://${config.bucket}.s3.${config.region}.amazonaws.com`,
    forcePathStyle: false,
  })
}
