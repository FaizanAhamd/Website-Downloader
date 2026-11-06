/**
 * config.js — centralized runtime configuration.
 * Everything here is environment-driven; nothing is hardcoded.
 */
module.exports = {
  // Public branding / contact (safe to expose in the UI)
  brand: {
    name: process.env.PUBLIC_PRODUCT_NAME || 'Website Downloader',
    owner: process.env.PUBLIC_PRODUCT_OWNER || 'Faizan Ahmad',
    githubUrl: process.env.PUBLIC_GITHUB_URL || 'https://github.com/FaizanAhamd/Website-Downloader',
    // Leave empty unless configured → the UI hides these blocks.
    contactEmail: process.env.PUBLIC_CONTACT_EMAIL || '',
    businessAddress: process.env.PUBLIC_BUSINESS_ADDRESS || '',
    siteUrl: process.env.PUBLIC_SITE_URL || '', // optional canonical/OG
  },

  host: {
    port: Number(process.env.PORT) || 3000,
  },

  // Base URL used by the frontend to reach the socket.io API.
  // Empty = same origin (default local / classic hosting).
  apiBaseUrl: process.env.API_BASE_URL || '',

  download: {
    quota: process.env.DOWNLOAD_QUOTA || '100m',
    timeoutMs: Number(process.env.DOWNLOAD_TIMEOUT_MS) || 5 * 60 * 1000,
    watchdogMs: Number(process.env.DOWNLOAD_WATCHDOG_MS) || 2000,
    maxConcurrent: Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 5,
    zipTtlHours: Number(process.env.DOWNLOAD_ZIP_TTL_HOURS) || 24,
    wgetPath: process.env.WGET_PATH || null,
    // Private archive storage — never inside public/.
    archiveDir: process.env.ARCHIVE_DIR || require('path').join(__dirname, 'private', 'archives'),
  },
};