import App from '@src/App';
import injectedStyle from '@src/index.css?inline';
import { createRoot } from 'react-dom/client';
import { validateAddress } from './utils/addressValidator';

// 확장 프로그램 활성화 상태
let isAddressLinkEnabled = false;

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message: { action: string; enabled: boolean }) => {
  if (message.action === 'toggleAddressLink') {
    isAddressLinkEnabled = message.enabled;

    if (isAddressLinkEnabled) {
      // 활성화 시 주소 감지 및 링크 변환 시작
      setTimeout(() => detectAndLinkAddresses(), 1000);
    }

    return true;
  }
});

// 초기 활성화 상태 가져오기
chrome.storage.local.get(['addressLinkEnabled'], (result: { addressLinkEnabled?: boolean }) => {
  isAddressLinkEnabled = result.addressLinkEnabled || false;

  // 이미 활성화된 상태라면 즉시 주소 감지 시작 (타이머 시간 줄임)
  if (isAddressLinkEnabled) {
    setTimeout(() => detectAndLinkAddresses(), 300);
  }
});

// 주소 감지 및 링크 변환 함수
function detectAndLinkAddresses(): void {
  // 이미 처리된 노드를 추적하기 위한 Set
  const processedNodes = new Set<Node>();

  // 페이지 내 모든 텍스트 노드를 찾아 처리하는 함수
  function processTextNodes(node: Node): void {
    if (processedNodes.has(node)) return;

    // 텍스트 노드인 경우 처리
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text && text.trim().length > 0 && validateAddress(text.trim())) {
        replaceWithLink(node as Text, text);
        processedNodes.add(node);
      }
      return;
    }

    // HTMLElement가 아닌 경우 건너뛰기
    if (!(node instanceof HTMLElement)) {
      return;
    }

    // 특정 태그 내부는 건너뛰기 (이미 링크이거나 스크립트, 스타일 등)
    if (
      node.tagName === 'A' ||
      node.tagName === 'SCRIPT' ||
      node.tagName === 'STYLE' ||
      node.tagName === 'HEAD' ||
      node.tagName === 'IFRAME' ||
      node.id === 'chrome-extension-boilerplate-react-vite-runtime-content-view-root' ||
      node.closest('#whereisthis-root')
    ) {
      return;
    }

    // 자식 노드 처리
    Array.from(node.childNodes).forEach(childNode => {
      processTextNodes(childNode);
    });
  }

  // 텍스트 노드를 링크로 교체
  function replaceWithLink(textNode: Text, text: string): void {
    // 주소 부분만 추출하여 링크 변환
    const trimmedText = text.trim();
    const encodedAddress = encodeURIComponent(trimmedText);

    const link = document.createElement('a');
    link.href = `https://map.naver.com/p/search/${encodedAddress}`;
    link.textContent = trimmedText;
    link.target = '_blank';
    link.title = '네이버 지도에서 보기';
    link.className = 'whereisthis-address-link';
    link.style.color = '#03C75A'; // 네이버 색상
    link.style.textDecoration = 'underline';
    link.style.cursor = 'pointer';

    // 부모 노드가 있는 경우에만 교체
    if (textNode.parentNode) {
      textNode.parentNode.replaceChild(link, textNode);
    }
  }

  try {
    // 페이지 내 모든 노드 처리 시작
    if (document.body) {
      console.log('페이지 내 모든 노드 처리 시작 ');
      processTextNodes(document.body);

      // 동적으로 추가되는 콘텐츠를 위한 MutationObserver 설정
      const observer = new MutationObserver((mutationsList: MutationRecord[]) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                processTextNodes(node);
              }
            });
          }
        }
      });

      // body의 모든 변경 사항 관찰
      observer.observe(document.body, { childList: true, subtree: true });
    }
  } catch (error) {
    console.error('주소 감지 및 링크 변환 실패:', error);
  }
}

export function mount() {
  const root = document.createElement('div');
  root.id = 'chrome-extension-boilerplate-react-vite-runtime-content-view-root';

  document.body.append(root);

  const rootIntoShadow = document.createElement('div');
  rootIntoShadow.id = 'shadow-root';

  const shadowRoot = root.attachShadow({ mode: 'open' });

  if (navigator.userAgent.includes('Firefox')) {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = injectedStyle;
    shadowRoot.appendChild(styleElement);
  } else {
    const globalStyleSheet = new CSSStyleSheet();
    globalStyleSheet.replaceSync(injectedStyle);
    shadowRoot.adoptedStyleSheets = [globalStyleSheet];
  }

  shadowRoot.appendChild(rootIntoShadow);
  createRoot(rootIntoShadow).render(<App />);

  // 페이지 로드 후 활성화 상태라면 주소 감지 시작 (타이머 시간 줄임)
  if (isAddressLinkEnabled) {
    setTimeout(() => detectAndLinkAddresses(), 300);
  }
}

// 페이지 로드 시 자동으로 mount 함수 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log('???');
  mount();
});
