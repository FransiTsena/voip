import { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { FiPlus, FiLoader } from 'react-icons/fi'; // Assuming react-icons is installed

// 1. Define Interfaces for better type safety
interface FormData {
  name: string;
  featureCode: string;
  // Updated: To store both the ID and the type of the destination
  destinationId: string;
  destinationType: string;
}

interface DestTypeOption {
  label: string;
  value: string;
  endpoint: string;
}

// A more flexible interface for destination options, as they can come from different APIs
// and have different identifying properties (e.g., _id for MongoDB, id, extension, name, number)
interface DestOption {
  _id?: string; // For MongoDB documents
  id?: string;  // Generic ID
  extension?: string; // For extensions
  name?: string;      // For named entities like IVRs, Queues
  number?: string;    // Another possible identifier for extensions/numbers
  label?: string;     // Generic display label
  // Add other properties that might be returned by your API for these options
}

// Define the types of destinations available (UNCHANGED AS PER YOUR REQUEST)
const DEST_TYPES: DestTypeOption[] = [
  { label: 'IVR', value: 'ivr', endpoint: '/api/ivr/menu' },
  { label: 'Extension', value: 'extension', endpoint: '/api/extensions' },
  { label: 'Queue', value: 'queue', endpoint: '/api/queues' },
  // Your original types, "Recording" not added here as per "dont add aditionaly type code"
];

// Base API URL from environment variables, defaulting for development
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MiscApplicationForm: FC = () => {
  // State for form input data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    featureCode: '',
    destinationId: '', // Changed from 'destination' to 'destinationId'
    destinationType: '', // Added 'destinationType'
  });

  // State for form submission status
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // States for managing destination dropdowns
  const [destType, setDestType] = useState<string>('');
  const [destOptions, setDestOptions] = useState<DestOption[]>([]);
  const [destLoading, setDestLoading] = useState<boolean>(false);

  // Effect hook to fetch destination options whenever destType changes
  useEffect(() => {
    if (!destType) {
      setDestOptions([]); // Clear options if no type is selected
      return;
    }

    const endpoint = DEST_TYPES.find(d => d.value === destType)?.endpoint;
    if (!endpoint) {
      console.warn(`No endpoint found for destination type: ${destType}`);
      setDestOptions([]);
      return;
    }

    setDestLoading(true);
    axios.get<{ data?: DestOption[] | DestOption[]; }>(`${API_URL}${endpoint}`) // Type axios response
      .then(res => {
        const data = res.data;
        // Ensure data is an array, or extract from a 'data' property if it's an object
        setDestOptions(Array.isArray(data) ? data : data.data || []);
      })
      .catch((err: AxiosError) => { // Type the error
        console.error(`Failed to load destination options for ${destType}:`, err);
        setDestOptions([]);
        setError(`Failed to load ${destType} options.`);
      })
      .finally(() => setDestLoading(false));
  }, [destType]);

  // Handler for input changes (text fields)
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for destination type selection
  const handleDestTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedType = e.target.value;
    setDestType(selectedType);
    // Reset destinationId and set destinationType when the type changes
    setFormData(prev => ({ ...prev, destinationId: '', destinationType: selectedType }));
    setError('');
  };

  // Handler for destination item selection
  const handleDestinationItemChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedId = e.target.value;
    setFormData(prev => ({
      ...prev,
      destinationId: selectedId,
      // destinationType is already correctly set by handleDestTypeChange
    }));
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Check for both destinationId and destinationType
      if (!formData.name || !formData.featureCode || !formData.destinationId || !formData.destinationType) {
        throw new Error('Please fill in all required fields: Name, Feature Code, Destination Type, and Destination.');
      }

      // Construct the payload to send to the backend
      const payload = {
        name: formData.name,
        featureCode: formData.featureCode,
        destination: { // Nest type and id under a 'destination' object
          type: formData.destinationType,
          id: formData.destinationId,
        },
      };

      await axios.post(`${API_URL}/api/misc`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess('Misc Application created successfully!');
      // Reset form fields after successful submission
      setFormData({ name: '', featureCode: '', destinationId: '', destinationType: '' });
      setDestType(''); // Reset the destination type dropdown state
    } catch (err: any) { // Use 'any' for generic error catching or define a more specific error interface
      console.error('Error creating Misc Application:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create application';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create New Misc Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              placeholder="e.g., Sales IVR Access"
            />
          </div>

          {/* Feature Code */}
          <div>
            <label htmlFor="featureCode" className="block text-sm font-medium text-gray-700 mb-1">Feature Code</label>
            <input
              type="text"
              id="featureCode"
              name="featureCode"
              value={formData.featureCode}
              onChange={handleChange}
              required
              pattern="\d+"
              title="Please enter numbers only"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              placeholder="e.g., 9091"
            />
            <p className="mt-1 text-xs text-gray-500">Numbers only (e.g., 9091)</p>
          </div>

          {/* Destination Type Dropdown */}
          <div>
            <label htmlFor="destType" className="block text-sm font-medium text-gray-700 mb-1">Destination Type</label>
            <select
              id="destType"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              value={destType} // Controlled by 'destType' state
              onChange={handleDestTypeChange}
              required
            >
              <option value="">Select type</option>
              {DEST_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>

          {/* Destination Item Dropdown (conditionally rendered) */}
          {destType && (
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Select {DEST_TYPES.find(d => d.value === destType)?.label}
              </label>
              {destLoading ? (
                <div className="text-gray-500 py-2 flex items-center gap-2">
                  <FiLoader className="animate-spin mr-2" /> Loading options...
                </div>
              ) : (
                <select
                  id="destination"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                  value={formData.destinationId} // Controlled by 'formData.destinationId'
                  onChange={handleDestinationItemChange}
                  required
                  disabled={destOptions.length === 0}
                >
                  <option value="">Select {destType}</option>
                  {destOptions.map(opt => (
                    <option
                      key={opt._id || opt.id || opt.extension || opt.name || opt.number || opt.label || JSON.stringify(opt)} // Robust key generation
                      // The value sent to the backend should be the ID
                      value={opt._id || opt.id || opt.extension || opt.number || ''} // Prioritize actual IDs
                    >
                      {opt.name || opt.extension || opt.number || opt.label || 'Unnamed'} {/* Display name */}
                    </option>
                  ))}
                </select>
              )}
              {destType && destOptions.length === 0 && !destLoading && (
                <p className="mt-1 text-sm text-red-500">No {destType} options found. Please ensure they are created.</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center w-full px-4 py-2 rounded-md font-semibold text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors duration-200 ease-in-out`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  Create Application
                </>
              )}
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center">
              <span className="mr-2 text-lg">⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center">
              <span className="mr-2 text-lg">✅</span> {success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MiscApplicationForm;