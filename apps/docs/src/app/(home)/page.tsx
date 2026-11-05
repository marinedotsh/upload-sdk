import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { AwsS3Logo, ImageKitLogo, NeonLogo } from "@/components/logo";
import { CodeExample } from "./code-example";
import { InstallSection } from "./install";

export default function HomePage() {
  return (
    <main className="flex-1 overflow-hidden bg-fd-background text-fd-foreground">
      <Hero />
      <CodeExample />
      <SupportedProviders />
      <InstallSection />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b bg-[linear-gradient(180deg,var(--color-fd-muted)/0.28,transparent_55%)]">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <div className="inline-flex items-center rounded-sm border bg-fd-secondary/75 px-1.5 py-0.5 text-xs font-medium text-fd-muted-foreground sm:text-sm">
            Open source
          </div>

          <div className="inline-flex items-center rounded-sm border bg-fd-secondary/75 px-1.5 py-0.5 text-xs font-medium text-fd-muted-foreground sm:text-sm">
            TypeScript-first
          </div>
        </div>

        <h1
          style={{ fontFamily: "var(--font-geist)" }}
          className="mt-8 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:mt-10 sm:text-5xl lg:text-6xl"
        >
          A simpler way to handle direct file uploads.
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-fd-muted-foreground sm:mt-6 sm:text-lg sm:leading-8 lg:text-[19px]">
          Validate files and prepare secure direct uploads to AWS S3, ImageKit,
          or Neon Object Storage using one TypeScript SDK.
        </p>

        <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:mt-12 sm:w-auto sm:max-w-none sm:flex-row">
          <Link
            href="/docs/getting-started/quick-start"
            style={{ fontFamily: "var(--font-geist)" }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-600/90 sm:w-auto sm:text-base"
          >
            Get started
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </Link>

          <Link
            href="/docs/guides/next-js-direct-uploads"
            style={{ fontFamily: "var(--font-geist)" }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-fd-secondary/60 px-5 text-sm font-medium text-fd-secondary-foreground transition-colors hover:bg-fd-secondary sm:w-auto sm:text-base"
          >
            Next.js guide
            <ArrowRight
              className="size-4"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

const providers = [
  {
    name: "AWS S3",
    description:
      "Validate files and generate signed URLs for direct uploads to your S3 bucket.",
    icon: <AwsS3Logo size={30} />,
    href: "/docs/providers/aws-s3",
  },
  {
    name: "ImageKit",
    description:
      "Validate files and prepare authenticated direct uploads to ImageKit.",
    icon: <ImageKitLogo size={24} className="rounded-sm" />,
    href: "/docs/providers/imagekit",
  },
  {
    name: "Neon",
    description:
      "Validate files and prepare signed direct uploads to a Neon Object Storage bucket.",
    icon: <NeonLogo size={22} />,
    href: "/docs/providers/neon-object-storage",
  },
];

const providerCellClassName =
  "min-w-0 border-b p-5 last:border-b-0 sm:p-6 md:odd:border-r md:nth-[n+3]:border-b-0 lg:border-r lg:border-b-0 lg:p-8 lg:last:border-r-0";

export function SupportedProviders() {
  return (
    <section className="mx-auto w-full max-w-7xl border-x border-b">
      <div className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
        <h2
          style={{ fontFamily: "var(--font-geist)" }}
          className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
        >
          Supported providers
        </h2>

        <p className="mt-3 max-w-xl text-pretty text-base leading-7 text-fd-muted-foreground sm:mt-4 sm:text-lg">
          Use the same upload flow with AWS S3, ImageKit, or Neon.
        </p>
      </div>

      <div className="grid grid-cols-1 border-t md:grid-cols-2 lg:grid-cols-4">
        {providers.map((provider) => (
          <Link
            key={provider.name}
            href={provider.href}
            className={`group transition-colors hover:bg-fd-muted/40 ${providerCellClassName}`}
          >
            <div className="flex size-10 items-center justify-center rounded-md border bg-neutral-950 text-white shadow-sm sm:size-12">
              {provider.icon}
            </div>

            <h3
              style={{ fontFamily: "var(--font-geist)" }}
              className="mt-4 inline-flex items-center text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl"
            >
              {provider.name}

              <ArrowRight className="ml-2 size-4 shrink-0 transition-transform group-hover:translate-x-1 sm:size-5" />
            </h3>

            <p className="mt-2 max-w-sm text-[15px] leading-6 text-fd-muted-foreground sm:text-base">
              {provider.description}
            </p>
          </Link>
        ))}

        <div className={providerCellClassName}>
          <div className="flex size-10 items-center justify-center rounded-md border bg-fd-muted/50 text-fd-muted-foreground sm:size-12">
            <Plus className="size-5 sm:size-6" />
          </div>

          <h3
            style={{ fontFamily: "var(--font-geist)" }}
            className="mt-4 text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl"
          >
            More providers
          </h3>

          <p className="mt-2 max-w-sm text-[15px] leading-6 text-fd-muted-foreground sm:text-base">
            Cloudflare R2 and Cloudinary adapters are planned.
          </p>
        </div>
      </div>
    </section>
  );
}
