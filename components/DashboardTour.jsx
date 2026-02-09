'use client';

import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
// import 'shepherd.js/dist/css/shepherd.css';
import '@/css/shepherd-custom.css';

export default function DashboardTour() {
  const tourRef = useRef(null);

  useEffect(() => {
    const hasSeen = typeof window !== 'undefined' && window.localStorage.getItem('shepherd_dashboard_intro_seen');

    const createTourIfNeeded = () => {
      if (tourRef.current) return tourRef.current;
      const tour = new Shepherd.Tour({
        defaultStepOptions: {
        //   cancelIcon: { enabled: true },
          scrollTo: { behavior: 'smooth', block: 'center' },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 12
        },
        useModalOverlay: true
      });

      tour.addStep({
        id: 'generate',
        text: 'Generate a new story tailored to your needs.',
        attachTo: { element: '#btn-generate-story', on: 'right' },
        buttons: [
          { text: 'Skip', action: tour.cancel, secondary: true },
          { text: 'Next', action: tour.next }
        ]
      });

      tour.addStep({
        id: 'upload',
        text: 'Already have one? Upload an existing story here.',
        attachTo: { element: '#btn-upload-story', on: 'right' },
        buttons: [
          { text: 'Back', action: tour.back, secondary: true },
          { text: 'Next', action: tour.next }
        ]
      });

      tour.addStep({
        id: 'students',
        text: 'Add students to personalize stories and track progress.',
        attachTo: { element: '#students-section', on: 'top' },
        buttons: [
          { text: 'Back', action: tour.back, secondary: true },
          { text: 'Done', action: tour.complete }
        ]
      });

      tour.on('complete', () => window.localStorage.setItem('shepherd_dashboard_intro_seen', '1'));
      tour.on('cancel', () => window.localStorage.setItem('shepherd_dashboard_intro_seen', '1'));

      tourRef.current = tour;
      return tour;
    };

    // Always expose a manual trigger for debugging or replays
    if (typeof window !== 'undefined') {
      window.startDashboardTour = () => {
        const tour = createTourIfNeeded();
        try { tour.start(); } catch (e) { /* noop */ }
      };
    }

    // Expose a manual trigger for debugging
    // Auto-start only if not seen
    if (!hasSeen) {
      // Retry loop to wait for elements (up to ~5s)
      let attempts = 0;
      const maxAttempts = 25; // 25 * 200ms = 5s
      const waitAndStart = () => {
        const generateBtn = document.querySelector('#btn-generate-story');
        const uploadBtn = document.querySelector('#btn-upload-story');
        const studentsSection = document.querySelector('#students-section');
        if (generateBtn && uploadBtn && studentsSection) {
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