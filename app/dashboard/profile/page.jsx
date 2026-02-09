'use client';

import { useSession } from "next-auth/react";
import { User, Upload } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    let revokeUrl = null;
    if (imageFile) {
      const nextUrl = URL.createObjectURL(imageFile);
      setPreviewUrl(nextUrl);
      revokeUrl = nextUrl;
    }
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    async function fetchMe() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setImageUrl(data.image || '');
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') {
      fetchMe();
    }
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const form = new FormData();
      form.append('name', name);
      if (imageFile) form.append('image', imageFile);
      const res = await fetch('/api/user/me', { method: 'PUT', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save');
      }
      const data = await res.json();
      setImageUrl(data.image || '');
      setSuccess('Profile updated');
      setImageFile(null);
      setPreviewUrl('');
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function onFileChange(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setImageFile(file);
  }

  const avatarSrc = previewUrl || imageUrl || '/logo.png';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
      <h2 className="font-semibold text-lg">User Profile</h2>
        <p className="text-sm text-gray-500">Manage your personal information.</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-1 ring-gray-200">
            <Image src={avatarSrc} alt="Avatar" fill sizes="96px" className="object-cover" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" /> Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
            <p className="mt-2 text-xs text-gray-500">JPG, PNG up to ~5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name"
              disabled={loading || saving}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-putple-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {loading ? <span className="text-sm text-gray-500">Loading…</span> : null}
        </div>
      </form>
    </div>
  );
}