'use client';

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import '@/css/shepherd-custom.css';

export default function StoriesTour() {
  const tourRef = useRef(null);

  useEffect(() => {
    const hasSeen = typeof window !== 'undefined' && window.localStorage.getItem('shepherd_stories_intro_seen');

    const createTourIfNeeded = () => {
      if (tourRef.current) return tourRef.current;
      const tour = new Shepherd.Tour({
        defaultStepOptions: {
          scrollTo: { behavior: 'smooth', block: 'center' },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 12
        },
        useModalOverlay: true
      });

      tour.addStep({
        id: 'stories-create',
        text: 'Start by uploading or generating a new story.',
        attachTo: { element: '#stories-actions', on: 'bottom' },
        buttons: [
          { text: 'Skip', action: () => tour.cancel(), secondary: true },
          { text: 'Next', action: () => tour.next() }
        ]
      });

      tour.addStep({
        id: 'stories-read',
        text: 'Open and read any story from the grid.',
        attachTo: { element: '.story-read-btn', on: 'top' },
        buttons: [
          { text: 'Back', action: () => tour.back(), secondary: true },
          { text: 'Next', action: () => tour.next() }
        ]
      });

      tour.addStep({
        id: 'stories-personalize',
        text: 'Personalize a story for your student here.',
        attachTo: { element: '.story-personalize-btn', on: 'top' },
        buttons: [
          { text: 'Back', action: () => tour.back(), secondary: true },
          { text: 'Done', action: () => tour.complete() }
        ]
      });

      tour.on('complete', () => window.localStorage.setItem('shepherd_stories_intro_seen', '1'));
      tour.on('cancel', () => window.localStorage.setItem('shepherd_stories_intro_seen', '1'));

      tourRef.current = tour;
      return tour;
    };

    if (typeof window !== 'undefined') {
      window.startStoriesTour = () => {
        const tour = createTourIfNeeded();
        try { tour.start(); } catch (e) { /* noop */ }
      };
    }

    if (!hasSeen) {
      let attempts = 0;
      const maxAttempts = 25;
      const waitAndStart = () => {
        const actions = document.querySelector('#stories-actions');
        const readBtn = document.querySelector('.story-read-btn');
        const personalizeBtn = document.querySelector('.story-personalize-btn');
        if (actions && readBtn && personalizeBtn) {
          const tour = createTourIfNeeded();
          tour.start();
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
        attempts += 1;
      };
      const intervalId = setInterval(waitAndStart, 200);

      return () => {
        clearInterval(intervalId);
        if (tourRef.current) tourRef.current.cancel();
        tourRef.current = null;
      };
    }

    return () => {
      if (tourRef.current) tourRef.current.cancel();
      tourRef.current = null;
    };
  }, []);

  return null;
}


