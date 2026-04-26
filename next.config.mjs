/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.js");

export default withNextIntl(nextConfig);
