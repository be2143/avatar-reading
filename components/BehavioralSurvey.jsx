'use client';

import { useState } from 'react';

export default function BehavioralSurveyPopup({ 
  student, 
  onClose, 
  onSaveScore 
}) {
  const [newScore, setNewScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newScore === '') return alert('Please enter a new behavioral score');
    
    setIsSubmitting(true);
    try {
      await onSaveScore(newScore);
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ 
          background: 'white', 
          padding: 24, 
          borderRadius: 12, 
          minWidth: 400,
          maxWidth: 500,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Behavioral Survey for {student.name || 'Student'}
        </h2>
        
        <div className="space-y-3 mb-6">
          {student.challenge && (
            <p className="text-sm text-gray-700">
              <strong>Challenge:</strong> {student.challenge}
            </p>
          )}
          {student.goals && (
            <p className="text-sm text-gray-700">
              <strong>Goals:</strong> {student.goals}
            </p>
          )}
          <p className="text-sm text-gray-700">
            <strong>Current Behavioral Change Score:</strong> {student.currentBehavioralScore ?? 'N/A'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Behavioral Change Score (0-100):
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter score (0-100)"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = No progress, 100 = Goal achieved
            </p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Score'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}