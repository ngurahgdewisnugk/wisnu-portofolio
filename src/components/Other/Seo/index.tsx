import Head from "next/head";

import { profile } from "@/data/profile";
import { SeoInterface } from "@/interfaces/SeoInterface";

const Seo = ({ title, description }: SeoInterface) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={description} />
      <meta name="author" content={profile.name} />
      <meta
        name="keywords"
        content="Cloud Engineer, DevOps, AWS, CI/CD, Release Management, Docker, Kubernetes"
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <meta name="theme-color" content="#7A90FF" />

      <meta property="og:type" content="website" key="ogtype" />
      <meta property="og:site_name" content={profile.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="/og-image.png" />

      <meta name="robots" content="index,follow" />
    </Head>
  );
};

export default Seo;
