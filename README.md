<p align="center">
  <img alt="Upload SDK" src="./apps/docs/public/upload-sdk.svg" width="96" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@marinedotsh/upload-sdk"><img alt="version" src="https://shieldcn.dev/npm/@marinedotsh/upload-sdk.svg?variant=secondary" /></a>
  <a href="https://x.com/shivamrun"><img alt="follow" src="https://shieldcn.dev/x/follow/shivamrun.svg?variant=secondary&amp;theme=zinc&amp;font=geist&amp;logo=ri%3ABsTwitterX&amp;label=Follow&amp;color=hjb" /></a>
</p>

Prepare direct browser uploads from your server without tying your application to one storage provider.

```ts
const preparedUpload = await uploader.prepareUpload("avatar", {
  filename: "profile.png",
  contentType: "image/png",
  size: 120_000,
});
```

`@marinedotsh/upload-sdk` validates client-reported file information, creates safe storage
keys, and returns short-lived multipart upload targets for AWS S3, ImageKit, and Neon Object Storage.

- Typed storage profiles and upload assets
- Provider-agnostic `prepareUpload()` flow
- Filename, MIME type, extension, and size validation
- Collision-resistant storage keys
- Signed S3 POST policies (AWS S3 and Neon Object Storage) and ImageKit V2 upload tokens
- Consistent SDK errors for validation and provider failures

## Installation

```bash
pnpm add @marinedotsh/upload-sdk
```

Other package managers:

```bash
npm install @marinedotsh/upload-sdk
yarn add @marinedotsh/upload-sdk
bun add @marinedotsh/upload-sdk
```

## Setup

Create your uploader in server-only code:

```ts
import {
  createUploader,
  defineAssets,
  defineStorageProfiles,
} from "@marinedotsh/upload-sdk";
import { awsS3 } from "@marinedotsh/upload-sdk/providers";

const storageProfiles = defineStorageProfiles({
  userUploads: awsS3({
    bucket: process.env.AWS_BUCKET!,
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

const assets = defineAssets(storageProfiles, {
  avatar: {
    keyPrefix: "avatars",
    accept: {
      mimeTypes: ["image/png", "image/jpeg"],
      extensions: [".png", ".jpg", ".jpeg"],
    },
    limits: {
      maxFileSize: {
        value: 2,
        unit: "MB",
      },
    },
    expiresIn: {
      value: 5,
      unit: "minutes",
    },
  },
});

export const uploader = createUploader({
  storageProfiles,
  defaultStorageProfile: "userUploads",
  assets,
});
```

After authenticating and authorizing a request, prepare the upload:

```ts
const preparedUpload = await uploader.prepareUpload("avatar", {
  filename: "profile.png",
  contentType: "image/png",
  size: 120_000,
});
```

Return `preparedUpload` to the browser. The SDK response contains a multipart target:

```ts
type PrepareUploadOutput = {
  strategy: "multipart";
  url: string;
  method: "POST";
  headers: Record<string, string>;
  fields: Record<string, string>;
  key: string;
  expiresAt: string;
};
```

## Browser upload

Send the file directly to the provider with the returned form fields:

```ts
import type { PrepareUploadOutput } from "@marinedotsh/upload-sdk";

async function uploadToProvider(
  file: File,
  preparedUpload: PrepareUploadOutput,
): Promise<string> {
  const formData = new FormData();

  for (const [name, value] of Object.entries(preparedUpload.fields)) {
    formData.append(name, value);
  }

  formData.append("file", file);

  const response = await fetch(preparedUpload.url, {
    method: preparedUpload.method,
    headers: preparedUpload.headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error("The file could not be uploaded.");
  }

  return preparedUpload.key;
}
```

Do not manually set the multipart `Content-Type` header. The browser adds the boundary.

## Providers

### AWS S3

```ts
import { awsS3 } from "@marinedotsh/upload-sdk/providers";

awsS3({
  bucket: process.env.AWS_BUCKET!,
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});
```

S3 uploads use a signed POST policy. The generated policy includes the key, content type,
expiration, metadata fields, and the configured size limit when present.

### ImageKit

```ts
import { imageKit } from "@marinedotsh/upload-sdk/providers";

imageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});
```

ImageKit uploads use a V2 upload JWT. The SDK maps asset rules into ImageKit upload
checks for file size and MIME type where supported.

### Neon Object Storage

```ts
import { neonStorage } from "@marinedotsh/upload-sdk/providers";

neonStorage({
  bucket: process.env.NEON_STORAGE_BUCKET!,
  endpoint: process.env.AWS_ENDPOINT_URL_S3!,
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

Neon Object Storage is S3-compatible, so uploads use the same signed POST policy as S3,
addressed path-style at `{endpoint}/{bucket}`. Use a Neon credential with the `storage:write`
scope; `neon env pull` writes the endpoint, region, and keys for the linked branch. Large-file
multipart uploads are supported too.

## Validation model

Upload SDK validates information reported by the client before it asks a provider to sign
anything. This keeps obvious invalid uploads out of the signing path, but it does not read
or inspect the actual file bytes.

Your application is still responsible for authentication, authorization, upload completion
checks, trusted database records, content inspection when required, and cleanup of abandoned
uploads.

## API reference

```ts
import {
  createUploader,
  defineAssets,
  defineStorageProfiles,
  defineUploadConfig,
  isUploadSDKError,
  UploadSDKError,
} from "@marinedotsh/upload-sdk";
```

```ts
import { awsS3, imageKit, neonStorage } from "@marinedotsh/upload-sdk/providers";
```

Common types:

```ts
import type {
  AssetUploadConfig,
  Duration,
  FileSizeLimit,
  PrepareUploadOutput,
  StorageProvider,
  UploadMetadata,
  UploadSDKErrorCode,
} from "@marinedotsh/upload-sdk";
```

## Repository

This repo is a pnpm workspace managed with Turbo.

| Path | Description |
| --- | --- |
| `packages/upload-sdk` | Published SDK package |
| `packages/upload-sdk/src/providers` | AWS S3, ImageKit, and Neon Object Storage provider implementations |
| `packages/upload-sdk/src/validation` | Input, key, filename, duration, and size validation |
| `apps/demo` | Next.js demo application |
| `apps/docs` | Fumadocs documentation site |
| `docs` | Repository-level process docs |

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Package publish checks:

```bash
pnpm --filter @marinedotsh/upload-sdk publish:check
```

## Documentation

- [Docs site](https://upload-sdk.dev)
- [Quick start](https://upload-sdk.dev/docs/getting-started/quick-start)
- [AWS S3 provider](https://upload-sdk.dev/docs/providers/aws-s3)
- [ImageKit provider](https://upload-sdk.dev/docs/providers/imagekit)
- [Neon Object Storage provider](https://upload-sdk.dev/docs/providers/neon-object-storage)
- [Direct upload architecture](https://upload-sdk.dev/docs/resources/direct-upload-architecture)

## License

[MIT](./packages/upload-sdk/LICENSE)
