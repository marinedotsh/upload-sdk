import { UploadSDKError } from "../error"
import type {
  CompleteMultipartUploadOutput,
  PrepareUploadOutput,
  ProviderAbortMultipartUploadInput,
  ProviderCompleteMultipartUploadInput,
  ProviderCreateMultipartUploadInput,
  ProviderCreateMultipartUploadOutput,
  ProviderPrepareMultipartUploadPartsInput,
  ProviderPrepareMultipartUploadPartsOutput,
  ProviderPrepareUploadInput,
  StorageProvider,
} from "./../types"
import { encodeBase64, hmacSha256, sha256, toHex } from "./../validation/crypto-utils"

export type S3CompatibleConfig = {
  bucket: string
  region: string

  credentials: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
}

type S3CompatibleOptions = {
  /** Display name used in provider error messages. */
  serviceName: string
  /** Origin of the S3 API, for example `https://bucket.s3.us-east-1.amazonaws.com`. */
  endpoint: string
  /** Address the bucket in the request path instead of the hostname. */
  forcePathStyle: boolean
}

type PostPolicyCondition = Record<string, string> | ["content-length-range", number, number]

export function createS3CompatibleProvider(
  config: S3CompatibleConfig,
  options: S3CompatibleOptions,
): StorageProvider {
  const { serviceName } = options
  const endpoint = options.endpoint.replace(/\/+$/, "")
  const bucketPath = options.forcePathStyle ? `/${encodeRfc3986(config.bucket)}` : ""

  async function prepareUpload(input: ProviderPrepareUploadInput): Promise<PrepareUploadOutput> {
    const expiresInSeconds = input.expiresInSeconds ?? 300

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 604_800) {
      throw new UploadSDKError("expiresInSeconds must be between 1 and 604800 seconds", {
        code: "INVALID_UPLOAD_CONFIG",
      })
    }

    const key = input.key.replace(/^\/+/, "")

    if (!key) {
      throw new UploadSDKError("Upload key cannot be empty", {
        code: "INVALID_UPLOAD_CONFIG",
      })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000)
    const amzDate = formatAmzDate(now)
    const dateStamp = amzDate.slice(0, 8)
    const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`
    const credential = `${config.credentials.accessKeyId}/${credentialScope}`

    const metadataFields = Object.fromEntries(
      Object.entries(input.metadata ?? {}).map(([name, value]) => [
        `x-amz-meta-${name.toLowerCase()}`,
        String(value),
      ]),
    )

    const fields: Record<string, string> = {
      key,
      "Content-Type": input.contentType,
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": credential,
      "X-Amz-Date": amzDate,
      ...metadataFields,
    }

    if (config.credentials.sessionToken) {
      fields["X-Amz-Security-Token"] = config.credentials.sessionToken
    }

    const conditions: PostPolicyCondition[] = [
      { bucket: config.bucket },
      { key },
      { "Content-Type": input.contentType },
      { "X-Amz-Algorithm": fields["X-Amz-Algorithm"] },
      { "X-Amz-Credential": fields["X-Amz-Credential"] },
      { "X-Amz-Date": fields["X-Amz-Date"] },
      ...Object.entries(metadataFields).map(
        ([name, value]) => ({ [name]: value }) as Record<string, string>,
      ),
    ]

    if (config.credentials.sessionToken) {
      conditions.push({
        "X-Amz-Security-Token": config.credentials.sessionToken,
      })
    }

    if (input.limits?.maxFileSizeBytes) {
      conditions.push(["content-length-range", 0, input.limits.maxFileSizeBytes])
    }

    const policy = {
      expiration: expiresAt.toISOString(),
      conditions,
    }

    const encodedPolicy = encodeBase64(JSON.stringify(policy))
    const signature = await createSignature(
      config.credentials.secretAccessKey,
      dateStamp,
      config.region,
      encodedPolicy,
    )

    fields.Policy = encodedPolicy
    fields["X-Amz-Signature"] = signature

    return {
      strategy: "multipart",
      url: `${endpoint}${bucketPath}`,
      method: "POST",
      headers: {},
      fields,
      key,
      expiresAt: expiresAt.toISOString(),
    }
  }

  async function createMultipartUpload(
    input: ProviderCreateMultipartUploadInput,
  ): Promise<ProviderCreateMultipartUploadOutput> {
    const key = normalizeKey(input.key)
    const metadataHeaders = createMetadataHeaders(input.metadata)
    const headers = {
      "content-type": input.contentType,
      ...metadataHeaders,
    }
    const response = await signedFetch({
      config,
      method: "POST",
      endpoint,
      bucketPath,
      key,
      query: [["uploads", ""]],
      headers,
      body: "",
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new UploadSDKError(
        responseText || `${serviceName} could not create the multipart upload.`,
        {
          code: "UPLOAD_PROVIDER_ERROR",
          statusCode: response.status,
        },
      )
    }

    const uploadId = readXmlValue(responseText, "UploadId")

    if (!uploadId) {
      throw new UploadSDKError(`${serviceName} did not return a multipart upload ID.`, {
        code: "UPLOAD_PROVIDER_ERROR",
      })
    }

    return {
      strategy: "multipart-parts",
      key,
      uploadId,
    }
  }

  async function prepareMultipartUploadParts(
    input: ProviderPrepareMultipartUploadPartsInput,
  ): Promise<ProviderPrepareMultipartUploadPartsOutput> {
    const key = normalizeKey(input.key)
    const expiresInSeconds = input.expiresInSeconds ?? 300

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 604_800) {
      throw new UploadSDKError("expiresInSeconds must be between 1 and 604800 seconds", {
        code: "INVALID_UPLOAD_CONFIG",
      })
    }

    validatePartNumbers(input.partNumbers)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString()
    const parts = await Promise.all(
      input.partNumbers.map(async (partNumber) => ({
        partNumber,
        url: await createPresignedPartUrl({
          config,
          endpoint,
          bucketPath,
          expiresInSeconds,
          key,
          now,
          partNumber,
          uploadId: input.uploadId,
        }),
        method: "PUT" as const,
        headers: {},
        expiresAt,
      })),
    )

    return {
      strategy: "multipart-parts",
      key,
      uploadId: input.uploadId,
      parts,
    }
  }

  async function completeMultipartUpload(
    input: ProviderCompleteMultipartUploadInput,
  ): Promise<CompleteMultipartUploadOutput> {
    const key = normalizeKey(input.key)
    validateCompletedParts(input.parts)

    const body = createCompleteMultipartUploadXml(input.parts)
    const response = await signedFetch({
      config,
      method: "POST",
      endpoint,
      bucketPath,
      key,
      query: [["uploadId", input.uploadId]],
      headers: {
        "content-type": "application/xml",
      },
      body,
    })
    const responseText = await response.text()
    const embeddedError = readS3Error(responseText)

    if (!response.ok || embeddedError) {
      throw new UploadSDKError(
        embeddedError?.message ??
          (responseText || `${serviceName} could not complete the multipart upload.`),
        {
          code: "UPLOAD_PROVIDER_ERROR",
          statusCode: response.status,
          details: embeddedError,
        },
      )
    }

    const etag = readXmlValue(responseText, "ETag")

    if (!etag) {
      throw new UploadSDKError(
        `${serviceName} did not return an ETag for the completed multipart upload.`,
        {
          code: "UPLOAD_PROVIDER_ERROR",
        },
      )
    }

    return {
      key,
      location: readXmlValue(responseText, "Location"),
      bucket: readXmlValue(responseText, "Bucket"),
      etag,
    }
  }

  async function abortMultipartUpload(input: ProviderAbortMultipartUploadInput): Promise<void> {
    const key = normalizeKey(input.key)
    const response = await signedFetch({
      config,
      method: "DELETE",
      endpoint,
      bucketPath,
      key,
      query: [["uploadId", input.uploadId]],
      headers: {},
      body: "",
    })

    if (!response.ok) {
      throw new UploadSDKError(
        (await response.text()) || `${serviceName} could not abort the multipart upload.`,
        {
          code: "UPLOAD_PROVIDER_ERROR",
          statusCode: response.status,
        },
      )
    }
  }

  return {
    abortMultipartUpload,
    completeMultipartUpload,
    createMultipartUpload,
    prepareUpload,
    prepareMultipartUploadParts,
  }
}

function formatAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "")
}

async function createSignature(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  encodedPolicy: string,
): Promise<string> {
  const dateKey = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp)
  const regionKey = await hmacSha256(dateKey, region)
  const serviceKey = await hmacSha256(regionKey, "s3")
  const signingKey = await hmacSha256(serviceKey, "aws4_request")
  const signature = await hmacSha256(signingKey, encodedPolicy)

  return toHex(signature)
}

type SignedFetchOptions = {
  config: S3CompatibleConfig
  method: "DELETE" | "POST"
  endpoint: string
  bucketPath: string
  key: string
  query: readonly [string, string][]
  headers: Record<string, string>
  body: string
}

async function signedFetch(options: SignedFetchOptions): Promise<Response> {
  const now = new Date()
  const amzDate = formatAmzDate(now)
  const headers: Record<string, string> = {
    ...normalizeHeaders(options.headers),
    host: new URL(options.endpoint).host,
    "x-amz-content-sha256": toHex(await sha256(options.body)),
    "x-amz-date": amzDate,
  }

  if (options.config.credentials.sessionToken) {
    headers["x-amz-security-token"] = options.config.credentials.sessionToken
  }

  const canonicalUri = `${options.bucketPath}${createCanonicalUri(options.key)}`
  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalRequest = [
    options.method,
    canonicalUri,
    createCanonicalQueryString(options.query),
    createCanonicalHeaders(headers),
    signedHeaders,
    headers["x-amz-content-sha256"],
  ].join("\n")
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${options.config.region}/s3/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    toHex(await sha256(canonicalRequest)),
  ].join("\n")
  const signature = await createSignature(
    options.config.credentials.secretAccessKey,
    dateStamp,
    options.config.region,
    stringToSign,
  )
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${options.config.credentials.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ")

  return fetch(`${options.endpoint}${canonicalUri}?${createCanonicalQueryString(options.query)}`, {
    method: options.method,
    headers: {
      ...headers,
      authorization,
    },
    body: options.body || undefined,
  })
}

type PresignedPartUrlOptions = {
  config: S3CompatibleConfig
  endpoint: string
  bucketPath: string
  key: string
  uploadId: string
  partNumber: number
  expiresInSeconds: number
  now: Date
}

async function createPresignedPartUrl(options: PresignedPartUrlOptions): Promise<string> {
  const amzDate = formatAmzDate(options.now)
  const dateStamp = amzDate.slice(0, 8)
  const credentialScope = `${dateStamp}/${options.config.region}/s3/aws4_request`
  const credential = `${options.config.credentials.accessKeyId}/${credentialScope}`
  const query: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(options.expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
    ["partNumber", String(options.partNumber)],
    ["uploadId", options.uploadId],
  ]

  if (options.config.credentials.sessionToken) {
    query.push(["X-Amz-Security-Token", options.config.credentials.sessionToken])
  }

  const canonicalUri = `${options.bucketPath}${createCanonicalUri(options.key)}`
  const canonicalQueryString = createCanonicalQueryString(query)
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    `host:${new URL(options.endpoint).host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n")
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    toHex(await sha256(canonicalRequest)),
  ].join("\n")
  const signature = await createSignature(
    options.config.credentials.secretAccessKey,
    dateStamp,
    options.config.region,
    stringToSign,
  )

  return `${options.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`
}

function normalizeKey(key: string): string {
  const normalizedKey = key.replace(/^\/+/, "")

  if (!normalizedKey) {
    throw new UploadSDKError("Upload key cannot be empty", {
      code: "INVALID_UPLOAD_CONFIG",
    })
  }

  return normalizedKey
}

function createMetadataHeaders(
  metadata: ProviderPrepareUploadInput["metadata"],
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata ?? {}).map(([name, value]) => [
      `x-amz-meta-${name.toLowerCase()}`,
      String(value),
    ]),
  )
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value.trim()]),
  )
}

function createCanonicalHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .sort(([left], [right]) => compareCodePoints(left, right))
    .map(([name, value]) => `${name}:${value}`)
    .join("\n")
    .concat("\n")
}

function createCanonicalUri(key: string): string {
  return `/${key.split("/").map(encodeRfc3986).join("/")}`
}

function createCanonicalQueryString(query: readonly [string, string][]): string {
  return query
    .map(([name, value]) => [encodeRfc3986(name), encodeRfc3986(value)] as const)
    .sort(([leftName, leftValue], [rightName, rightValue]) =>
      leftName === rightName
        ? compareCodePoints(leftValue, rightValue)
        : compareCodePoints(leftName, rightName),
    )
    .map(([name, value]) => `${name}=${value}`)
    .join("&")
}

// SigV4 sorts by byte value, so uppercase `X-Amz-*` names come before lowercase ones.
// `localeCompare` ignores case and would produce a different canonical request.
function compareCodePoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function validatePartNumbers(partNumbers: readonly number[]) {
  if (!partNumbers.length) {
    throw new UploadSDKError("At least one multipart upload part is required", {
      code: "INVALID_UPLOAD_INPUT",
    })
  }

  for (const partNumber of partNumbers) {
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
      throw new UploadSDKError("Multipart upload part numbers must be between 1 and 10000", {
        code: "INVALID_UPLOAD_INPUT",
      })
    }
  }
}

function validateCompletedParts(
  parts: readonly ProviderCompleteMultipartUploadInput["parts"][number][],
) {
  validatePartNumbers(parts.map((part) => part.partNumber))

  for (const part of parts) {
    if (!part.etag) {
      throw new UploadSDKError("Completed multipart upload parts must include ETags", {
        code: "INVALID_UPLOAD_INPUT",
      })
    }
  }
}

function createCompleteMultipartUploadXml(
  parts: readonly ProviderCompleteMultipartUploadInput["parts"][number][],
): string {
  const sortedParts = [...parts].sort((left, right) => left.partNumber - right.partNumber)

  return `<CompleteMultipartUpload>${sortedParts
    .map(
      (part) =>
        `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${escapeXml(part.etag)}</ETag></Part>`,
    )
    .join("")}</CompleteMultipartUpload>`
}

function readXmlValue(xml: string, tagName: string): string | undefined {
  return xml.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`, "s"))?.[1]
}

function readS3Error(xml: string): { code?: string; message?: string } | undefined {
  if (!/<Error[\s>]/.test(xml)) {
    return undefined
  }

  return {
    code: readXmlValue(xml, "Code"),
    message: readXmlValue(xml, "Message"),
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
