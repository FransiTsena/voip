import { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import axios from "axios";

// --- Type Definitions ---
interface IVREntry {
  id: number;
  digit: string;
  type: string;
  value: string;
}

interface Queue {
  _id: string;
  queueId: string;
  name: string;
}

interface EntryErrors {
  [key: string]: string | undefined;
}

interface IVREntriesProps {
  entries: IVREntry[];
  setEntries: (entries: IVREntry[]) => void;
  systemRecordings: Array<{_id: string, name: string}>;
  menus: Array<{_id: string, name: string}>;
}

// --- Component ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const IVREntries: React.FC<IVREntriesProps> = ({ entries, setEntries, systemRecordings, menus }) => {
  const [errors, setErrors] = useState<EntryErrors>({});
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Extension state
  const [extensions, setExtensions] = useState<Array<{
    displayName: string; userExtension: string; deviceState: string 
}>>([]);
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Fetch queues when component mounts
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        setLoadingQueues(true);
        const response = await axios.get<Queue[]>(`${API_URL}/api/queue`);

        setQueues(response.data);
        setFetchError(null);
      } catch (err) {
        console.error('Error fetching queues:', err);
        setFetchError('Failed to load queues.');
      } finally {
        setLoadingQueues(false);
      }
    };

    fetchQueues();
  }, []);

  // --- State Handlers ---
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hasExtensionType = entries.some(entry => entry.type === "extension");
        
        if (hasExtensionType && extensions.length === 0 && !loadingExtensions) {
          setLoadingExtensions(true);
  
          const response = await axios.get(`${API_URL}/api/agent`);
          console.log (response.data)
          setExtensions(response.data || []);
          setExtensionError(null);
  
          console.log("Fetched extensions:", response.data);
        }
      } catch (err) {
        console.error("Error fetching extensions:", err);
        setExtensionError("Failed to load extensions");
      } finally {
        setLoadingExtensions(false);
      }
    };
  
    fetchExtensions();
    
    // ✅ dependencies should NOT include extensions.length (it will trigger infinite loop)
    // ✅ Instead, depend only on entries and loadingExtensions
  }, [entries, loadingExtensions, API_URL]);
  

  const addEntry = () => {
    const newEntry: IVREntry = { 
      id: Date.now(), 
      digit: '', 
      type: '', // Default to empty to force user selection
      value: '' 
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (id: number, field: keyof IVREntry, value: string) => {
    let newErrors = { ...errors };
    const entryKey = `digit_${id}`;

    // Validate for duplicate digits
    if (field === 'digit') {
      const isDigitUsed = entries.some(entry => entry.id !== id && entry.digit === value && value !== '');
      if (isDigitUsed) {
        newErrors[entryKey] = 'Digit already in use.';
      } else {
        delete newErrors[entryKey];
      }
    }
    setErrors(newErrors);
    
    // Update entries state
    const updatedEntries = entries.map((entry) => {
      if (entry.id === id) {
        // If type is changed, reset the destination value
        if (field === 'type') {
          return { ...entry, type: value, value: '' };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    });

    setEntries(updatedEntries);
  };

  const removeEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };


  // --- Render Functions ---

  const renderDestinationField = (entry: IVREntry) => {
    // If no type is selected, show a disabled placeholder
    if (!entry.type) {
      return (
        <select className="w-full p-2 border rounded bg-gray-100" disabled>
          <option>Select a type first</option>
        </select>
      );
    }
    
    // Render the appropriate destination dropdown based on type
    switch (entry.type) {
      case 'extension':
        if (loadingExtensions) return <div className="p-2 text-gray-500">Loading extensions...</div>;
        if (extensionError) return <div className="p-2 text-red-500">{extensionError}</div>;
        return (
          <select
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select an extension...</option>
            {extensions.map((ext) => (
              <option key={ext.userExtension} value={ext.userExtension}>
                {ext.userExtension} ({ext.displayName})
              </option>
            ))}
          </select>
        );

      case 'queue':
        if (loadingQueues) return <div className="p-2 text-gray-500">Loading queues...</div>;
        if (fetchError) return <div className="p-2 text-red-500">{fetchError}</div>;
        return (
          <select
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a queue...</option>
            {queues.map((queue) => (
              <option key={queue._id} value={queue.queueId}>
                {queue.name}
              </option>
            ))}
          </select>
        );

        case 'recording':
          return (
            <select
              value={entry.value}
              onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a recording...</option>
              {systemRecordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          );
      case 'ivr':
          return (
            <select
              value={entry.value}
              onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a recording...</option>
              {menus.map((menu) => (
                <option key={menu._id} value={menu._id}>
                  {menu.name}
                </option>
              ))}
            </select>
          );

      default:
        return null; // No destination field needed for other types
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Menu Entries</h3>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <FiPlus />
          Add Entry
        </button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-4 bg-gray-50/50 relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Digit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Digit</label>
                <input
                  type="text"
                  value={entry.digit}
                  onChange={(e) => updateEntry(entry.id, 'digit', e.target.value.replace(/[^0-9*#]/g, ''))}
                  maxLength={1}
                  className={`w-full p-2 border rounded ${errors[`digit_${entry.id}`] ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 1"
                />
                {errors[`digit_${entry.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`digit_${entry.id}`]}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={entry.type}
                  onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                  className="w-full p-2 border rounded border-gray-300"
                >
                  <option value="" disabled>Choose a type...</option>
                  <option value="extension">Route to Extension</option>
                  <option value="queue">Route to Queue</option>
                  <option value="recording">Play Recording</option>
                  <option value="ivr">Route to IVR Menu</option>
                </select>
              </div>

              {/* Destination */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                {renderDestinationField(entry)}
              </div>
            </div>

            {/* Remove Button */}
            {entries.length > 1 && (
               <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  aria-label="Remove Entry"
                >
                  <FiTrash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IVREntries;