'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BehavioralSurveyPage() {
    const router = useRouter();
    const [surveyData, setSurveyData] = useState({
        studentName: '',
        question1: '',
        question2: '',
        question3: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' or 'error'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSurveyData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus(null);

        // In a real application, you would send this data to your API.
        // For this example, we'll simulate a successful submission.
        console.log('Submitting survey data:', surveyData);

        try {
            // Replace this with a real API call to your backend
            // const response = await fetch('/api/submit-survey', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(surveyData),
            // });

            // if (!response.ok) {
            //     throw new Error('Failed to submit survey.');
            // }

            // Simulate a network delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            setSubmissionStatus('success');
            // Redirect the user after a brief moment
            setTimeout(() => {
                router.push('/'); // Or to a success page
            }, 3000);

        } catch (error) {
            console.error('Submission error:', error);
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h1 className="text-3xl font-bold text-purple-700 mb-2 text-center">Behavioral Change Survey</h1>
                <p className="text-gray-600 mb-6 text-center">
                    Please take a moment to answer these questions about the student's recent reading session.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Student's Name</label>
                        <input
                            type="text"
                            id="studentName"
                            name="studentName"
                            value={surveyData.studentName}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="question1" className="block text-sm font-medium text-gray-700">
                            1. How engaged was the student during the reading activity?
                        </label>
                        <select
                            id="question1"
                            name="question1"
                            value={surveyData.question1}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="">Select an option</option>
                            <option value="very_engaged">Very Engaged</option>
                            <option value="moderately_engaged">Moderately Engaged</option>
                            <option value="not_engaged">Not Engaged</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="question2" className="block text-sm font-medium text-gray-700">
                            2. Did you notice any positive behavioral changes (e.g., increased focus, asking questions)?
                        </label>
                        <textarea
                            id="question2"
                            name="question2"
                            rows="3"
                            value={surveyData.question2}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="question3" className="block text-sm font-medium text-gray-700">
                            3. What was the student's emotional response to the story?
                        </label>
                        <select
                            id="question3"
                            name="question3"
                            value={surveyData.question3}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="">Select an option</option>
                            <option value="happy_excited">Happy / Excited</option>
                            <option value="calm_relaxed">Calm / Relaxed</option>
                            <option value="neutral">Neutral</option>
                            <option value="anxious_frustrated">Anxious / Frustrated</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Additional Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows="4"
                            value={surveyData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                    </button>
                </form>

                {submissionStatus === 'success' && (
                    <div className="mt-4 p-3 text-center text-sm font-medium text-green-800 bg-green-100 rounded-md">
                        ✅ Survey submitted successfully! Redirecting...
                    </div>
                )}
                {submissionStatus === 'error' && (
                    <div className="mt-4 p-3 text-center text-sm font-medium text-red-800 bg-red-100 rounded-md">
                        ❌ Failed to submit survey. Please try again.
                    </div>
                )}
            </div>
        </div>
    );
}