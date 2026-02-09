// components/EditStudentModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { IoCloseSharp } from 'react-icons/io5'; // For the close icon

export default function EditStudentModal({ student, onClose, onSave }) {
  // Local state for form fields, initialized with current student data
  const [formData, setFormData] = useState({
    name: '',
    age: '', // Will be derived from birthday
    birthday: '',
    diagnosis: '',
    guardian: '',
    contact: '',
    comprehensionLevel: '',
    preferredStoryLength: '',
    preferredSentenceLength: '',
    learningPreferences: '',
    interests: '',
    challenges: '',
    notes: '',
    image: '', // Assuming image is a URL or base64 string
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (student) {
      // Format birthday to YYYY-MM-DD for date input type
      const formattedBirthday = student.birthday
        ? new Date(student.birthday).toISOString().split('T')[0]
        : '';

      setFormData({
        name: student.name || '',
        age: student.age || '', 
        birthday: formattedBirthday,
        diagnosis: student.diagnosis || '',
        guardian: student.guardian || '',
        contact: student.contact || '',
        comprehensionLevel: student.comprehensionLevel || '',
        preferredStoryLength: student.preferredStoryLength || '',
        preferredSentenceLength: student.preferredSentenceLength || '',
        learningPreferences: student.learningPreferences || '',
        interests: student.interests || '',
        challenges: student.challenges || '',
        notes: student.notes || '',
        image: student.image || '',
      });
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pass the updated form data to the parent's onSave function
      await onSave(formData);
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error('Error saving student data:', error);
      // You might want to display an error message in the modal
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Student Profile</h2>
              <p className="text-sm text-gray-600 mt-1">Update student information and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close modal"
            >
              <IoCloseSharp size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Profile Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                Diagnosis
              </label>
              <input
                type="text"
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="guardian" className="block text-sm font-medium text-gray-700">
                Parent/Guardian
              </label>
              <input
                type="text"
                id="guardian"
                name="guardian"
                value={formData.guardian}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                Contact
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="comprehensionLevel" className="block text-sm font-medium text-gray-700">
                Comprehension Level
              </label>
              <select
                id="comprehensionLevel"
                name="comprehensionLevel"
                value={formData.comprehensionLevel}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              >
                <option value="">Select level</option>
                <option value="prek_k">Pre-K / Kindergarten</option>
                <option value="early_elementary">Early Elementary (Grades 1-2)</option>
                <option value="mid_elementary">Mid Elementary (Grades 3-5)</option>
                <option value="middle_school">Middle School (Grades 6-8)</option>
                <option value="high_school">High School (Grades 9-12)</option>
                <option value="post_secondary">Post-Secondary / Adult</option>
              </select>
            </div>
            <div>
              <label htmlFor="preferredStoryLength" className="block text-sm font-medium text-gray-700">
                Preferred Story Length
              </label>
              <select
                id="preferredStoryLength"
                name="preferredStoryLength"
                value={formData.preferredStoryLength}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              >
                <option value="">Select length</option>
                <option value="very_short">Very Short (~5 sentences)</option>
                <option value="short">Short (1-2 paragraphs)</option>
                <option value="medium">Medium (3-5 paragraphs)</option>
                <option value="long">Long (More than 5 paragraphs)</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="preferredSentenceLength" className="block text-sm font-medium text-gray-700">
                Preferred Sentence Length
              </label>
              <select
                id="preferredSentenceLength"
                name="preferredSentenceLength"
                value={formData.preferredSentenceLength}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              >
                <option value="">Select length</option>
                <option value="very_short">Very Short (1-5 words)</option>
                <option value="short">Short (6-10 words)</option>
                <option value="medium">Medium (11-15 words)</option>
                <option value="long">Long (More than 15 words)</option>
              </select>
            </div>
            </div>
          </div>

          {/* Learning Preferences & Interests */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Learning Preferences & Interests
            </h3>
              <div>
                {/* <label htmlFor="learningPreferences" className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Preferences / Interests
                </label> */}
                <textarea
                  id="learningPreferences"
                  name="learningPreferences"
                  value={formData.learningPreferences}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                  placeholder="e.g., Visual storytelling, hands-on activities"
                ></textarea>
              </div>
          </div>

          {/* Challenges */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              Challenges
            </h3>
              <div>
                {/* <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-2">
                  Challenges
                </label> */}
                <textarea
                  id="challenges"
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                  placeholder="e.g., Difficulty with social cues, sensory sensitivities"
                ></textarea>
              </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Additional Notes
            </h3>
            <div>
              {/* <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label> */}
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                placeholder="Any other relevant information about the student"
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}