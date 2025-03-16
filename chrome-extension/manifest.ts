import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'ko',
  name: 'address to link - 주소에 지도 링크 자동추가',
  version: packageJson.version,
  description: '접근한 페이지에서 주소로 인식되는 텍스트에 지도 링크를 추가합니다',
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'activeTab', 'scripting'], // 필수 권한만 남김
  action: {
    default_icon: {
      '16': 'favicon-16x16.png',
      '32': 'favicon-32x32.png',
    },
    default_title: 'Address to Link',
  },
  icons: {
    '16': 'favicon-16x16.png',
    '32': 'favicon-32x32.png',
    '192': 'android-chrome-192x192.png',
    '512': 'android-chrome-512x512.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content-runtime/index.iife.js'], // 핵심 기능 스크립트만 유지
    },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      css: ['content.css'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', 'icon-*.png', 'android-chrome-*.png', 'favicon*.*'],
      matches: ['*://*/*'],
    },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
} satisfies chrome.runtime.ManifestV3;

export default manifest;
