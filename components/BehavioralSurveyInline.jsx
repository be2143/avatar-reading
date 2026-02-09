'use client';

import { useState } from 'react';

export default function BehavioralSurveyInline({ 
  student, 
  onSaveScore,
  storyGoal 
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
      setNewScore(''); // Reset after successful save
    } catch (error) {
      console.error('Error saving score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      <div className="space-y-3 mb-4">
        {storyGoal && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-purple-900 inline">Story Goal: </p>
            <p className="text-sm text-purple-800 inline">{storyGoal}</p>
          </div>
        )}
        {student.challenge && (
          <p className="text-sm text-gray-700">
            <strong>Challenge:</strong> {student.challenge}
          </p>
        )}
        <p className="text-sm text-gray-700">
          <strong>Current Behavioral Change Score:</strong> {student.currentBehavioralScore !== undefined ? `${student.currentBehavioralScore}/10` : 'N/A'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700 mb-2 font-bold">
            How does the student currently performing with the target goals?
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter score (0-10)"
          />
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            <p><strong>Score Scale:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li><strong>0:</strong> not at all</li>
              <li><strong>1-3:</strong> rarely</li>
              <li><strong>4-6:</strong> sometimes (performs with some difficulty)</li>
              <li><strong>7-9:</strong> often</li>
              <li><strong>10:</strong> consistent</li>
            </ul>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Score'}
        </button>
      </form>
    </div>
  );
}




