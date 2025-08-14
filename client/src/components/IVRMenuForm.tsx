import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ErrorState, IVREntry, IVRState } from '../types/ivr';
import axios from 'axios';
import IVREntries from './ivr-componetns/IVREntries';

const IVRMenuCreator = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [ivr, setIvr] = useState<IVRState>({
    name: '',
    description: '',
    dtmf: {
      announcement: { id: '', name: '' },
      timeout: 5,
      invalidRetries: 3,
      invalidRetryRecording: { id: '', name: '' },
      timeoutRetries: 3,
    },
    entries: [
      { id: Date.now(), type: '', digit: '', value: '' }
    ],
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [systemRecordings, setSystemRecordings] = useState<Array<{_id: string, name: string}>>([]);
  const [menus, setMenus] = useState<Array<{_id: string, name: string}>>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleGeneralChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIvr({ ...ivr, [name]: value });
    if (value.trim()) setErrors({ ...errors, [name]: '' });
  };

  const handleDTMFChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'announcement' || name === 'invalidRetryRecording') {
      const selectedRecording = systemRecordings.find(rec => rec._id === value);
      if (selectedRecording) {
        setIvr(prev => ({
          ...prev,
          dtmf: {
            ...prev.dtmf,
            [name]: { id: selectedRecording._id, name: selectedRecording.name }
          }
        }));
      } else {
         setIvr(prev => ({
          ...prev,
          dtmf: {
            ...prev.dtmf,
            [name]: { id: '', name: '' }
          }
        }));
      }
    } else {
      setIvr(prev => ({
        ...prev,
        dtmf: { ...prev.dtmf, [name]: value }
      }));
    }
  
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: ErrorState= {};
    if (!ivr.name.trim()) newErrors.name = 'IVR name is required';
    if (!ivr.dtmf.announcement.id) newErrors.announcement = 'Announcement is required';
    if (ivr.dtmf.timeout < 1) newErrors.timeout = 'Timeout must be at least 1 second';
    if (ivr.dtmf.invalidRetries < 1) newErrors.invalidRetries = 'Invalid retries must be at least 1';
    if (ivr.dtmf.timeoutRetries < 1) newErrors.timeoutRetries = 'Timeout retries must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/api/ivr/menu`, ivr, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data) {
        alert('IVR Menu created successfully!');
      }
    } catch (error) {
      console.error('Error creating IVR menu:', error);
      alert('Failed to create IVR menu.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchSystemRecordings = async () => {
    try {
      const response = await axios.get(`${API}/api/audio/recordings`);
      setSystemRecordings(response.data.data);
    } catch (err) {
      console.error('Error fetching system recordings:', err);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await axios.get(`${API}/api/ivr/menu`);
  
      setMenus(response.data);
    } catch (err) {
      console.error('Error fetching IVR menus:', err);
    }
  };

  useEffect(() => {
    fetchSystemRecordings();
    fetchMenus();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-800">Create IVR Menu</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* General Options */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-6 mb-6 md:mb-0 transform hover:scale-105 transition-transform">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">General Options</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  IVR Name <span className="text-xs text-gray-500">(Required)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={ivr.name}
                  onChange={handleGeneralChange}
                  className={`mt-1 block w-full border rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="Enter IVR name"
                  aria-label="IVR Name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={ivr.description}
                  onChange={handleGeneralChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter IVR description"
                  rows={4}
                  aria-label="IVR Description"
                />
              </div>
            </div>
          </div>

          {/* DTMF Options */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-6 transform hover:scale-105 transition-transform">
            <h2 className="text-xl font-semibold mb-4 text-indigo-700">DTMF Options</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Announcement <span className="text-xs text-gray-500">(Required)</span>
                </label>
                <select
                  name="announcement"
                  value={ivr.dtmf.announcement.id}
                  onChange={handleDTMFChange}
                  className={`mt-1 block w-full border rounded-md p-2 ${errors.announcement ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                  aria-label="Announcement recording"
                >
                  <option value="">Select recording</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>
                      {rec.name}
                    </option>
                  ))}
                </select>
                {errors.announcement && <p className="text-red-500 text-sm mt-1">{errors.announcement}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeout (seconds) <span className="text-xs text-gray-500">(Min: 1)</span>
                </label>
                <input
                  type="number"
                  name="timeout"
                  value={ivr.dtmf.timeout}
                  onChange={handleDTMFChange}
                  className={`mt-1 block w-full border rounded-md p-2 ${errors.timeout ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                  min="1"
                  aria-label="Timeout in seconds"
                />
                {errors.timeout && <p className="text-red-500 text-sm mt-1">{errors.timeout}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Invalid Retries <span className="text-xs text-gray-500">(Min: 1)</span>
                </label>
                <input
                  type="number"
                  name="invalidRetries"
                  value={ivr.dtmf.invalidRetries}
                  onChange={handleDTMFChange}
                  className={`mt-1 block w-full border rounded-md p-2 ${errors.invalidRetries ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                  min="1"
                  aria-label="Invalid retries"
                />
                {errors.invalidRetries && <p className="text-red-500 text-sm mt-1">{errors.invalidRetries}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invalid Retry Recording</label>
                <select
                  name="invalidRetryRecording"
                  value={ivr.dtmf.invalidRetryRecording.id}
                  onChange={handleDTMFChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  aria-label="Invalid retry recording"
                >
                  <option value="">Select recording</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>
                      {rec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeout Retries <span className="text-xs text-gray-500">(Min: 1)</span>
                </label>
                <input
                  type="number"
                  name="timeoutRetries"
                  value={ivr.dtmf.timeoutRetries}
                  onChange={handleDTMFChange}
                  className={`mt-1 block w-full border rounded-md p-2 ${errors.timeoutRetries ? 'border-red-500' : 'border-gray-300'} focus:ring-indigo-500 focus:border-indigo-500`}
                  min="1"
                  aria-label="Timeout retries"
                />
                {errors.timeoutRetries && <p className="text-red-500 text-sm mt-1">{errors.timeoutRetries}</p>}
              </div>
            </div>
          </div>
        </div>
        
        <IVREntries
          systemRecordings={systemRecordings}
          menus={menus}
          entries={ivr.entries}
          setEntries={(newEntries: IVREntry[]) => setIvr((prev) => ({ ...prev, entries: newEntries }))}
        />

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={submitting}
            aria-label="Save IVR"
          >
            {submitting ? 'Saving...' : 'Save IVR'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IVRMenuCreator;