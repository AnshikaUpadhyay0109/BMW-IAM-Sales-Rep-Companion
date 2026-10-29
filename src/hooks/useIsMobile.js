import { useState, useEffect } from 'react';
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 560);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 560);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  useEffect(() => {
    if (mobile) document.body.classList.add('m');
    else document.body.classList.remove('m');
  }, [mobile]);
  return mobile;
}
