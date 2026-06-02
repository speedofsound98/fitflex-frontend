import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — FitFlex` : 'FitFlex — Book Fitness Classes Near You';
  }, [title]);
}
