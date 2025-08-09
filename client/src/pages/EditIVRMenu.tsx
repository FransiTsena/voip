import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// --- TYPES ---
interface Recording { _id: string; name: string; }
interface Extension { _id: string; extension: string; name: string; }
// Updated Queue interface to include queueId
interface Queue { _id: string; queueId: string; name: string; }
interface IvrInfo { _id: string; name: string; }

interface IVREntry {
  id: number; // Client-side unique ID for React keys and manipulation
  type: string;
  digit: string;
  value: string; // This will store the _id for IVR/Recording/Queue, or extension for Extension/Voicemail
  _id?: string; // Mongoose adds this for subdocuments in a saved IVR
}

interface IVRState {
  _id?: string; // MongoDB _id for the IVR menu itself
  name: string;
  description: string;
  dtmf: {
    announcement: { id: string; name: string };
    timeout: number;
    invalidRetries: number;
    invalidRetryRecording: { id: string; name: string };
    timeoutRetries: number;
  };
  entries: IVREntry[];
}

interface ErrorState { [key: string]: string; }

// --- REUSABLE COMPONENTS ---

const IVREntries = ({ entries, setEntries, systemRecordings, allIvrs, allExtensions, allQueues }) => {
  const handleEntryChange = (id: number, field: keyof IVREntry, value: string | number) => {
    const newEntries = entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { id: Date.now(), type: 'extension', digit: '', value: '' }]);
  };

  // Professional delete with confirmation and icon
  const removeEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const renderDestinationInput = (entry: IVREntry) => {
    const commonSelectClass = "mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500";
    const commonInputClass = "mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500";

    switch (entry.type) {
      case 'ivr':
        return (
          <select value={entry.value} onChange={e => handleEntryChange(entry.id, 'value', e.target.value)} className={commonSelectClass}>
            <option value="">Select IVR Menu</option>
            {allIvrs.map(ivr => <option key={ivr._id} value={ivr._id}>{ivr.name}</option>)}
          </select>
        );
      case 'recording':
        return (
          <select value={entry.value} onChange={e => handleEntryChange(entry.id, 'value', e.target.value)} className={commonSelectClass}>
            <option value="">Select Recording</option>
            {systemRecordings.map(rec => <option key={rec._id} value={rec._id}>{rec.name}</option>)}
          </select>
        );
      case 'queue':
         return (
          <select value={entry.value} onChange={e => handleEntryChange(entry.id, 'value', e.target.value)} className={commonSelectClass}>
            <option value="">Select Queue</option>
            {/* FIX: Use q.queueId as the value for the option, as this is what's stored in IVREntry.value */}
            {allQueues.map(q => <option key={q._id} value={q.queueId}>{q.name} ({q.queueId})</option>)}
          </select>
        );
      case 'voicemail':
      case 'extension':
        return (
          <select value={entry.value} onChange={e => handleEntryChange(entry.id, 'value', e.target.value)} className={commonSelectClass}>
            <option value="">Select Extension</option>
            {allExtensions.map(ext => <option key={ext._id} value={ext.extension}>{ext.extension} ({ext.name})</option>)}
          </select>
        );
      default:
        return <input type="text" value={entry.value} readOnly className={`${commonInputClass} bg-gray-100`} placeholder="Select a type first" />;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 text-indigo-700">Menu Entries</h2>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-1 md:grid-cols-10 gap-3 items-center p-3 bg-gray-50 rounded-lg">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Digit(s)</label>
              <input type="text" value={entry.digit} onChange={e => handleEntryChange(entry.id, 'digit', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g., 1"/>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select value={entry.type} onChange={e => handleEntryChange(entry.id, 'type', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                <option value="extension">Go to Extension</option>
                <option value="ivr">Go to IVR Menu</option>
                <option value="queue">Go to Queue</option>
                <option value="recording">Play Recording</option>
                <option value="voicemail">Voicemail</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="text-sm font-medium text-gray-700">Destination</label>
              {renderDestinationInput(entry)}
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="mt-1 h-8 w-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 flex items-center justify-center p-0 transition-colors duration-200"
                title="Delete Entry"
              >
                {/* Smaller Trash can SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addEntry} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">+ Add Entry</button>
    </div>
  );
};

// --- PAGE COMPONENTS ---

const IVRForm = ({ ivrId, onSave, onCancel }) => {
    const isEditMode = !!ivrId;
    const [ivr, setIvr] = useState<IVRState>({
        name: '', description: '',
        dtmf: {
            announcement: { id: '', name: '' },
            timeout: 5,
            invalidRetries: 3,
            invalidRetryRecording: { id: '', name: '' },
            timeoutRetries: 3,
        },
        entries: [],
    });
    const [errors, setErrors] = useState<ErrorState>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEditMode);

    const [systemRecordings, setSystemRecordings] = useState<Recording[]>([]);
    const [allIvrs, setAllIvrs] = useState<IvrInfo[]>([]);
    const [allExtensions, setAllExtensions] = useState<Extension[]>([]);
    const [loadingExtensions, setLoadingExtensions] = useState(false);
    const [extensionError, setExtensionError] = useState<string | null>(null);
    const [allQueues, setAllQueues] = useState<Queue[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingExtensions(true);
            setExtensionError(null);
            try {
                // Fetch all required reference data in parallel
                const [recordingsRes, ivrsRes, extensionsRes, queuesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/audio/recordings`),
                    axios.get(`${API_URL}/api/ivr/menu`),
                    axios.get(`${API_URL}/api/agent`), // <-- Fetch extensions from /api/agent
                    axios.get(`${API_URL}/api/queue`),
                ]);

                // --- API RESPONSE PARSING CONSISTENCY ---
                // Based on your provided queue response, and previous single IVR,
                // I'm assuming direct array/object for most, but keeping .data.data for recordings/extensions
                // if that's what you observed. Adjust if needed.
                setSystemRecordings(recordingsRes.data.data || []); // Assuming recordings might be data.data
                setAllIvrs(ivrsRes.data || []); // Assuming IVR list is directly data
                // Parse extension response from /api/agent to fit Extension interface
                const extensions = (extensionsRes.data || []).map((ext: any) => ({
                    _id: ext.exten, // Use exten as unique ID
                    extension: ext.exten,
                    name: ext.deviceState || '', // Or any other property you want to show
                }));
                setAllExtensions(extensions);
                setAllQueues(queuesRes.data || []); // FIX: Assuming queue list is directly data, not data.data


                if (isEditMode && ivrId) {
                    const ivrResponse = await axios.get(`${API_URL}/api/ivr/menu/${ivrId}`);
                    const fetchedIvrData = ivrResponse.data; // Confirmed: no 'data' wrapper for single IVR

                    const entries = (fetchedIvrData.entries || []).map(entry => ({
                        ...entry,
                        id: entry._id || Date.now() // Use existing _id for existing entries, new ID for new ones
                    }));

                    setIvr({
                        _id: fetchedIvrData._id,
                        name: fetchedIvrData.name || '',
                        description: fetchedIvrData.description || '',
                        dtmf: {
                            announcement: fetchedIvrData.dtmf?.announcement || { id: '', name: '' },
                            timeout: fetchedIvrData.dtmf?.timeout ?? 5,
                            invalidRetries: fetchedIvrData.dtmf?.invalidRetries ?? 3,
                            invalidRetryRecording: fetchedIvrData.dtmf?.invalidRetryRecording || { id: '', name: '' },
                            timeoutRetries: fetchedIvrData.dtmf?.timeoutRetries ?? 3,
                        },
                        entries: entries,
                    });
                } else if (!isEditMode) {
                    setIvr(prev => ({ ...prev, entries: [{ id: Date.now(), type: 'extension', digit: '', value: '' }] }));
                }
            } catch (error) {
                console.error('Failed to load initial data or IVR:', error);
                if (isEditMode && ivrId) {
                    setErrors({ form: `Failed to load IVR with ID: "${ivrId}". Please check the ID, API URL, and network connection.` });
                } else {
                    setErrors({ form: 'Failed to load required data for new IVR. Please try again.' });
                }
                setLoadingExtensions(false);
                setExtensionError('Failed to load extensions.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ivrId, isEditMode]);

    const handleGeneralChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setIvr({ ...ivr, [name]: value });
    };

    const handleDTMFChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedDtmf = { ...ivr.dtmf };
        if (name === 'announcement' || name === 'invalidRetryRecording') {
            const selected = systemRecordings.find(rec => rec._id === value);
            updatedDtmf[name] = selected ? { id: selected._id, name: selected.name } : { id: '', name: '' };
        } else {
            updatedDtmf[name] = Number(value);
        }
        setIvr(prev => ({ ...prev, dtmf: updatedDtmf }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...ivr };
            payload.entries = ivr.entries.map(({ id, ...rest }) => rest); // Clean client-side 'id'

            if (isEditMode && ivrId) {
                await axios.put(`${API_URL}/api/ivr/menu/${ivrId}`, payload);
                alert('IVR Menu updated successfully!');
            } else {
                await axios.post(`${API_URL}/api/ivr/menu`, payload);
                alert('IVR Menu created successfully!');
            }
            onSave();
        } catch (error) {
            console.error('Error saving IVR menu:', error);
            alert('Failed to save IVR menu. Please check the console and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (errors.form) return <div className="text-center p-10 text-red-500">{errors.form}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto bg-gray-50 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{isEditMode ? 'Edit IVR Menu' : 'Create IVR Menu'}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">General Options</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IVR Name</label>
                            <input type="text" name="name" value={ivr.name} onChange={handleGeneralChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" required />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={ivr.description} onChange={handleGeneralChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" rows={3} />
                        </div>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">DTMF Options</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Announcement</label>
                            <select name="announcement" value={ivr.dtmf.announcement?.id || ''} onChange={handleDTMFChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" required>
                                <option value="">Select recording</option>
                                {systemRecordings.map(rec => <option key={rec._id} value={rec._id}>{rec.name}</option>)}
                            </select>
                        </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Invalid Retry Recording</label>
                            <select name="invalidRetryRecording" value={ivr.dtmf.invalidRetryRecording?.id || ''} onChange={handleDTMFChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300">
                                <option value="">Select recording (Optional)</option>
                                {systemRecordings.map(rec => <option key={rec._id} value={rec._id}>{rec.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Timeout (s)</label>
                                <input type="number" name="timeout" value={ivr.dtmf.timeout} onChange={handleDTMFChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" min="1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Invalid Retries</label>
                                <input type="number" name="invalidRetries" value={ivr.dtmf.invalidRetries} onChange={handleDTMFChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" min="0" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Timeout Retries</label>
                                <input type="number" name="timeoutRetries" value={ivr.dtmf.timeoutRetries} onChange={handleDTMFChange} className="mt-1 block w-full border rounded-md p-2 border-gray-300" min="0" />
                            </div>
                        </div>
                    </div>
                </div>
                <IVREntries entries={ivr.entries} setEntries={(newEntries) => setIvr(prev => ({ ...prev, entries: newEntries }))} systemRecordings={systemRecordings} allIvrs={allIvrs} allExtensions={allExtensions} allQueues={allQueues} />
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300" disabled={submitting}>Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300" disabled={submitting}>{submitting ? 'Saving...' : 'Save IVR'}</button>
                </div>
            </form>
        </div>
    );
};

const IVRList = ({ onEdit, onCreate }) => {
    const [ivrs, setIvrs] = useState<IvrInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIvrs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/ivr/menu`);
            setIvrs(response.data || []); // Assumed: list of IVRs is directly in response.data
        } catch (error) {
            console.error("Failed to fetch IVR menus", error);
            setIvrs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIvrs();
    }, []);

    if (loading) return <div className="p-6 text-center">Loading IVR Menus...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">IVR Menus</h1>
                <button onClick={onCreate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">+ Create New IVR</button>
            </div>
            <div className="space-y-4">
                {ivrs.length > 0 ? ivrs.map(ivr => (
                    <div key={ivr._id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center transition hover:shadow-lg">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{ivr.name}</h2>
                        </div>
                        <button onClick={() => onEdit(ivr._id)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Edit</button>
                    </div>
                )) : <p className="text-center text-gray-500 bg-white p-6 rounded-lg shadow-md">No IVR menus found. Click "Create New IVR" to get started.</p>}
            </div>
        </div>
    );
};

// --- MAIN APP ---

export default function App() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [currentIvrId, setCurrentIvrId] = useState<string | null>(null);

    useEffect(() => {
        // This useEffect synchronizes internal state with URL parameters
        if (id) {
            setCurrentIvrId(id);
            setView('edit');
        } else if (window.location.pathname === '/ivr-menu/create') {
            setCurrentIvrId(null);
            setView('create');
        } else {
            setCurrentIvrId(null);
            setView('list');
        }
    }, [id, window.location.pathname]); // Depend on 'id' and pathname to react to URL changes

    const handleEdit = (selectedId: string) => {
        navigate(`/ivr-menu/edit/${selectedId}`);
    };

    const handleCreate = () => {
        navigate('/ivr-menu/create');
    };

    const handleSave = () => {
        navigate('/');
    };

    const handleCancel = () => {
        navigate('/');
    };

    const renderView = () => {
        switch (view) {
            case 'create':
                return <IVRForm onSave={handleSave} onCancel={handleCancel} ivrId={null} />;
            case 'edit':
                return <IVRForm ivrId={currentIvrId} onSave={handleSave} onCancel={handleCancel} />;
            case 'list':
            default:
                return <IVRList onEdit={handleEdit} onCreate={handleCreate} />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            {renderView()}
        </div>
    );
}
