import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { appName, packageName } from "@/lib/shared";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) {
    return notFound();
  }

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #020817 0%, #061a38 42%, #083d77 100%)",
        color: "white",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 15%, rgba(6, 176, 253, 0.38), transparent 32%), radial-gradient(circle at 85% 80%, rgba(0, 87, 252, 0.36), transparent 34%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -140,
          display: "flex",
          width: 520,
          height: 520,
          borderRadius: 260,
          border: "1px solid rgba(125, 211, 252, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 56,
          bottom: 56,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(191, 219, 254, 0.2)",
          borderRadius: 36,
          background: "rgba(2, 8, 23, 0.48)",
          padding: 56,
          boxShadow: "0 32px 90px rgba(0, 0, 0, 0.32)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 86,
                height: 86,
                borderRadius: 24,
                background: "linear-gradient(135deg, #e0f2fe, #ffffff)",
                boxShadow: "0 20px 48px rgba(14, 165, 233, 0.35)",
              }}
            >
              <UploadSdkMark />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  fontSize: 33,
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
              >
                {appName}
              </div>
              <div
                style={{
                  color: "#bfdbfe",
                  fontSize: 24,
                  fontWeight: 500,
                }}
              >
                {packageName}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: 999,
              border: "1px solid rgba(147, 197, 253, 0.28)",
              background: "rgba(14, 165, 233, 0.13)",
              color: "#dbeafe",
              fontSize: 22,
              fontWeight: 700,
              padding: "12px 20px",
            }}
          >
            Documentation
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              maxWidth: 910,
              fontSize: 74,
              fontWeight: 850,
              letterSpacing: 0,
              lineHeight: 0.96,
            }}
          >
            {page.data.title}
          </div>
          <div
            style={{
              maxWidth: 860,
              color: "#dbeafe",
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.35,
            }}
          >
            {page.data.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {["Typed assets", "Strict validation", "Direct uploads"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    border: "1px solid rgba(147, 197, 253, 0.24)",
                    background: "rgba(15, 23, 42, 0.54)",
                    color: "#bfdbfe",
                    fontSize: 20,
                    fontWeight: 700,
                    padding: "10px 16px",
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
          <div
            style={{
              color: "#7dd3fc",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            S3 + ImageKit + Neon
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

function UploadSdkMark() {
  return (
    <svg
      width={58}
      height={66}
      viewBox="0 0 1095 1254"
      style={{ display: "flex" }}
      aria-hidden="true"
    >
      <g transform="matrix(0.872688,0,0,1,0,0)">
        <g transform="matrix(2.006037,0,0,1.750645,-732.48969,-224.654049)">
          <g transform="matrix(1,0,0,0.915142,50.69932,-70.652974)">
            <path
              d="M628,226.5C628,692.16 628.09,723.07 629.46,723.73C630.07,724.08 627.46,723.63 627.07,723.4C589.61,702.13 552,679.16 514.75,657.62L512,652.95C511.58,590.93 512.85,526.1 511.36,464.95L348.25,564.71C343.37,566.19 338.05,563.95 337.05,559.25L337,417.61C340.37,393.17 363.07,387.75 379.25,375.82L617.04,228.53C620.18,227.63 623.22,226.04 628,226.5Z"
              fill="rgb(6,176,253)"
            />
          </g>
          <g transform="matrix(1,0,0,0.915142,50.69932,-70.652974)">
            <path
              d="M629.46,723.73C628.09,723.07 628,692.16 628,226.5C640.21,227.7 646.31,235.59 655.25,240.1C706.35,272.59 763.04,304.52 813.75,337.39L904.02,394.16C910.06,399.58 915.96,407.63 917,418.59L916.98,559.25C915.16,564.1 911.36,565.97 905.75,564.68L744.02,465.5L742.51,465.5L742.25,652.25L739.84,657.14C703.98,679 666.74,702.37 629.46,723.73Z"
              fill="rgb(0,87,252)"
            />
          </g>
        </g>
        <g transform="matrix(2.006037,0,0,1.750645,-732.48969,-224.654049)">
          <g transform="matrix(1,0,0,0.915142,50.69932,-70.652974)">
            <path
              d="M628.25,827.06L628.25,991.17C627.5,990.88 624.54,990.42 622.8,990.49C533.28,935.59 442.64,879.23 351.25,825.51C344.67,820.73 338.96,812.44 337.03,802.25L337,663.07C337.84,658.31 342.53,655.43 348.21,657.04L628.25,827.06Z"
              fill="rgb(6,176,253)"
            />
          </g>
          <g transform="matrix(1,0,0,0.915142,50.69932,-70.652974)">
            <path
              d="M907.25,656.81L911,656.86C914.26,657.31 916.15,660.18 917,662.97L917,800.89C915.93,810.97 909.26,820.55 903.25,825.1L635.23,989.65C634.5,990.17 630.64,990.89 628.25,991.17L628.25,827.06L907.25,656.81Z"
              fill="rgb(0,87,252)"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
