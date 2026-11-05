# @marinedotsh/upload-sdk

Generate provider-agnostic signed upload targets for S3, ImageKit, and Neon Object Storage.

## Installation

```sh
pnpm add @marinedotsh/upload-sdk
# or
bun add @marinedotsh/upload-sdk
# or
yarn add @marinedotsh/upload-sdk
```

## Usage

```ts
import { createUploader, defineAssets, defineStorageProfiles } from "@marinedotsh/upload-sdk"
import { awsS3 } from "@marinedotsh/upload-sdk/providers"

const storageProfiles = defineStorageProfiles({
  s3: awsS3({
    bucket: "my-bucket",
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
})

const assets = defineAssets(storageProfiles, {
  avatar: {
    keyPrefix: "uploads/avatars",
    expiresIn: { value: 5, unit: "minutes" },
    limits: {
      maxFileSize: { value: 1, unit: "MB" },
    },
  },
})

const uploader = createUploader({
  storageProfiles,
  defaultStorageProfile: "s3",
  assets,
})

const preparedUpload = await uploader.prepareUpload("avatar", {
  filename: "profile.png",
  contentType: "image/png",
  size: 120_000,
})
```

`preparedUpload` returns a multipart upload target with form fields for direct browser `POST` uploads.

`expiresIn` controls how long the generated provider upload target remains valid.
`limits.maxFileSize` and `accept` rules are checked before a provider signature is generated.
Providers also enforce the signed upload request where supported: S3 and Neon Object Storage sign
the generated key, content type, and size range into their POST policy, while ImageKit receives a
V2 upload JWT with a `checks` expression for size and MIME type validation.

## Browser uploads

Use `uploadFile` in browser code to send a prepared multipart upload target with progress and
abort support:

```ts
import { uploadFile } from "@marinedotsh/upload-sdk"

await uploadFile(preparedUpload, file, {
  signal: abortController.signal,
  onProgress: ({ percent }) => {
    console.log(percent)
  },
})
```

The helper appends all signed fields before the file and returns the generated storage key after
the provider accepts the upload.

## Large S3 uploads

AWS S3 and Neon Object Storage storage profiles also support chunked multipart uploads:

```ts
const multipartUpload = await uploader.createMultipartUpload("video", {
  filename: input.filename,
  contentType: input.contentType,
  size: input.size,
})

const preparedParts = await uploader.prepareMultipartUploadParts({
  ...multipartUpload,
  partNumbers: [1, 2, 3],
})
```

Then upload the signed parts from browser code:

```ts
import { uploadMultipartParts } from "@marinedotsh/upload-sdk"

const chunkSize = 8 * 1024 * 1024
const uploadedParts = await uploadMultipartParts(preparedParts, file, {
  chunkSize,
  concurrency: 3,
  onProgress: ({ percent }) => {
    console.log(percent)
  },
})
```

Complete or abort the upload on the server:

```ts
await uploader.completeMultipartUpload(uploadedParts)

await uploader.abortMultipartUpload(multipartUpload)
```

Keep the uploader and provider credentials in server-only code.
For browser multipart uploads, configure S3 CORS to allow `PUT` and expose the `ETag` header.
Chunks must follow S3 limits: at least 5 MiB except the final part, at most 5 GiB per part, and at
most 10,000 parts.
ImageKit does not currently expose the same S3-style multipart upload flow through this SDK.

## Providers

- `awsS3`
- `imageKit`
- `neonStorage`

## License

MIT
