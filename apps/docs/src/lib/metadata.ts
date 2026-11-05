import type { Metadata } from "next";
import { appName, docsImageRoute, gitConfig, packageName } from "./shared";

const fallbackSiteUrl = "https://upload-sdk.dev";
export const repositoryUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
export const npmPackageUrl = `https://www.npmjs.com/package/${packageName}`;

export const siteTitle =
  "Upload SDK - TypeScript Direct Uploads for S3, ImageKit, and Neon";
export const siteDescription =
  "TypeScript SDK for secure direct browser uploads to AWS S3, ImageKit, and Neon Object Storage, with typed asset rules, validation, signed POST targets, and S3 multipart uploads.";

export const siteKeywords = [
  "upload sdk",
  packageName,
  "TypeScript upload SDK",
  "file upload SDK",
  "signed uploads",
  "direct browser uploads",
  "browser file uploads",
  "provider-agnostic uploads",
  "S3 presigned uploads",
  "S3 POST policy",
  "S3 multipart uploads",
  "large file uploads",
  "chunked uploads",
  "ImageKit uploads",
  "ImageKit upload JWT",
  "Neon Object Storage uploads",
  "Neon branch storage",
  "file upload validation",
  "typed upload config",
  "asset upload rules",
  "Node.js upload SDK",
  "Next.js uploads",
  "server-side upload signatures",
];

function createSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl;

  try {
    const url = new URL(rawUrl);
    const isLocalUrl = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    if (process.env.NODE_ENV === "production" && isLocalUrl) {
      return new URL(fallbackSiteUrl);
    }

    return new URL(url.origin);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const siteUrl = createSiteUrl();
export const siteBaseUrl = siteUrl.origin;
export const ogImageUrl = new URL(`${docsImageRoute}/image.png`, siteUrl);

export function toAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function createPageTitle(title: string) {
  return `${title} | ${appName}`;
}

export function createPageDescription(title: string, description?: string) {
  return (
    description ??
    `${title} documentation for ${packageName}, a TypeScript SDK for direct uploads to AWS S3, ImageKit, and Neon Object Storage.`
  );
}

export function createPageKeywords(title: string) {
  return [
    title,
    `${title} Upload SDK`,
    `${packageName} ${title}`,
    ...siteKeywords,
  ];
}

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: `%s | ${appName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [
    {
      name: "Shivam Gupta",
      url: "https://github.com/shivamrun",
    },
  ],
  creator: "Shivam Gupta",
  publisher: "marinedotsh",
  applicationName: appName,
  category: "Developer tools",
  referrer: "origin-when-cross-origin",
  icons: {
    icon: "/upload-sdk.svg",
    shortcut: "/upload-sdk.svg",
    apple: "/upload-sdk.svg",
  },
  alternates: {
    canonical: siteBaseUrl,
    types: {
      "text/markdown": toAbsoluteUrl("/llms.txt"),
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteBaseUrl,
    siteName: appName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImageUrl.toString(),
        width: 1200,
        height: 630,
        alt: "Upload SDK documentation and provider-agnostic signed upload tooling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: "@shivamrun",
    images: [ogImageUrl.toString()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "npm:package": packageName,
    "github:repository": `${gitConfig.user}/${gitConfig.repo}`,
    "docs:llms": toAbsoluteUrl("/llms.txt"),
  },
};

const organization = {
  "@type": "Organization",
  "@id": `${siteBaseUrl}/#organization`,
  name: "marinedotsh",
  url: `https://github.com/${gitConfig.user}`,
};

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteBaseUrl}/#website`,
      name: appName,
      alternateName: "Provider-Agnostic Upload SDK",
      url: siteBaseUrl,
      description: siteDescription,
      inLanguage: "en-US",
      publisher: organization,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteBaseUrl}/docs?query={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    organization,
    {
      "@type": "SoftwareSourceCode",
      "@id": `${siteBaseUrl}/#source-code`,
      name: appName,
      alternateName: "Provider-Agnostic Upload SDK",
      url: siteBaseUrl,
      codeRepository: repositoryUrl,
      sameAs: [repositoryUrl, npmPackageUrl],
      description: siteDescription,
      license: `${repositoryUrl}/blob/${gitConfig.branch}/packages/upload-sdk/LICENSE`,
      programmingLanguage: "TypeScript",
      runtimePlatform: "Node.js >=18",
      applicationCategory: "DeveloperTool",
      isAccessibleForFree: true,
      keywords: siteKeywords,
      author: {
        "@type": "Person",
        name: "Shivam Gupta",
        url: "https://github.com/shivamrun",
      },
      publisher: {
        "@id": `${siteBaseUrl}/#organization`,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        url: npmPackageUrl,
        itemOffered: {
          "@type": "SoftwareApplication",
          name: packageName,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Node.js",
        },
      },
      about: [
        "Provider-agnostic upload signing",
        "S3 presigned POST uploads",
        "ImageKit upload JWTs",
        "Neon Object Storage uploads",
        "File upload validation",
        "Typed asset upload configuration",
        "Large S3 multipart uploads",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteBaseUrl}/#software-application`,
      name: packageName,
      alternateName: appName,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Node.js",
      softwareVersion: "0.1.1",
      url: siteBaseUrl,
      downloadUrl: npmPackageUrl,
      codeRepository: repositoryUrl,
      description: siteDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export function createDocsPageStructuredData(input: {
  title: string;
  description?: string;
  url: string;
  imageUrl: string;
}) {
  const title = createPageTitle(input.title);
  const description = createPageDescription(input.title, input.description);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${input.url}#article`,
        headline: title,
        description,
        url: input.url,
        image: input.imageUrl,
        inLanguage: "en-US",
        isPartOf: {
          "@id": `${siteBaseUrl}/#website`,
        },
        about: {
          "@id": `${siteBaseUrl}/#software-application`,
        },
        publisher: {
          "@id": `${siteBaseUrl}/#organization`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${input.url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Documentation",
            item: toAbsoluteUrl("/docs"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: input.title,
            item: input.url,
          },
        ],
      },
    ],
  };
}
