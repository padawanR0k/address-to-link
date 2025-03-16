import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    console.log('runtime content view loaded');
  }, []);

  return null;
}
