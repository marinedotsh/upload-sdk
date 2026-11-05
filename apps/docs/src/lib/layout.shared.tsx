import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { gitConfig } from "./shared";

function BrandTitle() {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/upload-sdk.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
      <span className="truncate text-base lowercase font-medium leading-none">
        {gitConfig.repo}
      </span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: <BrandTitle />,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
