'use client';

import { useState } from 'react';
import { HelpCircle, X, Mail, Phone, MessageSquare } from 'lucide-react';

export default function FloatingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-28 right-12 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"      
        aria-label="Get help"
      >
        <HelpCircle className="w-7 h-7" />
        <span className="sr-only">Help & Support</span>
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-6 animate-in fade-in-50 slide-in-from-bottom-2">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close help panel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you have any problems or need assistance using the system, 
              please don't hesitate to contact us.
            </p>

            {/* Contact Methods */}
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <a 
                    href="mailto:support@yourdomain.com" 
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    be2143@nyu.edu
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Help Text */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700 text-center">
                Thank you for using our system!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop (optional) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}