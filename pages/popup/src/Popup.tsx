import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { ToggleButton } from '@extension/ui';
import '@src/Popup.css';
import { useEffect, useState } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const [addressLinkEnabled, setAddressLinkEnabled] = useState(false);

  useEffect(() => {
    // 초기 상태 가져오기
    chrome.storage.local.get(['addressLinkEnabled'], result => {
      setAddressLinkEnabled(result.addressLinkEnabled || false);
    });

    // 이제 페이지 로드 시 자동 주입되므로 제거
    // injectContentScript();
  }, []);

  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  // injectContentScript 함수는 필요 시 수동 호출 용도로 유지
  const injectContentScript = async (): Promise<void> => {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

    if (!tab || !tab.id) {
      console.error('No active tab found');
      return;
    }

    if (tab.url?.startsWith('about:') || tab.url?.startsWith('chrome:')) {
      chrome.notifications.create('inject-error', notificationOptions);
      return;
    }

    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch((err: Error) => {
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        } else {
          console.error('Script injection error:', err);
        }
      });
  };

  const toggleAddressLink = async (): Promise<void> => {
    const newState = !addressLinkEnabled;
    setAddressLinkEnabled(newState);

    // 상태 저장
    await chrome.storage.local.set({ addressLinkEnabled: newState });

    // 현재 활성화된 탭에 상태 전달
    try {
      const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
      if (tab?.id) {
        await chrome.tabs
          .sendMessage(tab.id, { action: 'toggleAddressLink', enabled: newState })
          .catch(() => console.log('No content script listening'));
      }
    } catch (error) {
      console.error('Error toggling address link:', error);
    }
  };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p>
          Edit <code>pages/popup/src/Popup.tsx</code>
        </p>
        {/* 필요 시 수동 주입 버튼 */}
        <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={injectContentScript}>
          스크립트 다시 주입하기
        </button>

        <button
          className={
            'font-bold mt-2 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight
              ? addressLinkEnabled
                ? 'bg-green-200 text-black'
                : 'bg-red-200 text-black'
              : addressLinkEnabled
                ? 'bg-green-700 text-white'
                : 'bg-red-700 text-white')
          }
          onClick={toggleAddressLink}>
          주소 자동 링크 기능 {addressLinkEnabled ? '활성화됨' : '비활성화됨'}
        </button>

        <ToggleButton>{t('toggleTheme')}</ToggleButton>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
