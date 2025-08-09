import React from 'react';

// Define the shape of the form data for the Add Extension form
interface AddExtensionFormData {
  userExtension: string;
  displayName: string;
  outboundCID: string;
  emergencyCID: string;
  secret: string;
  // All fields below 'secret' are removed as per request
}

// Reusable component for form rows (can be moved to a common utility file if used elsewhere)
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="flex items-center border-b border-gray-200 py-4 last:border-b-0">
    <div className="w-1/3 pr-4 text-left text-gray-700 font-medium flex items-center justify-start">
      {label}
      {tooltip && (
        <span className="ml-2 text-gray-400 cursor-help" title={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    <div className="w-2/3 pl-4">
      {children}
    </div>
  </div>
));

interface GeneralSettingsProps {
  formData: AddExtensionFormData;
  handleChange: (name: string, value: any) => void; // Updated handleChange signature
  // Removed handleGroupsChange, isUsernameDisabled, and all related options
  FormRow: typeof FormRow; // Pass the component itself
}

const GeneralSettings: React.FC<GeneralSettingsProps> = React.memo(({
  formData,
  handleChange,
  FormRow
}) => (
  <>
    {/* Device hint */}
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
      <p className="font-bold">Add Extension</p>
      <p>This device uses PJSIP technology listening on Port 5060 (UDP)</p>
    </div>

    {/* User Extension */}
    <FormRow label="User Extension" tooltip="The extension number for this user.">
      <input
        type="text"
        name="userExtension"
        value={formData.userExtension}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 1001"
        required
      />
    </FormRow>

    {/* Display Name */}
    <FormRow label="Display Name" tooltip="The name to display for this extension.">
      <input
        type="text"
        name="displayName"
        value={formData.displayName}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., John Doe"
        required
      />
    </FormRow>

    {/* Outbound CID */}
    <FormRow label="Outbound CID" tooltip="The Caller ID to use for outbound calls from this extension.">
      <input
        type="text"
        name="outboundCID"
        value={formData.outboundCID}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 5551234567"
      />
    </FormRow>

    {/* Emergency CID */}
    <FormRow label="Emergency CID" tooltip="The Caller ID to use for emergency calls from this extension.">
      <input
        type="text"
        name="emergencyCID"
        value={formData.emergencyCID}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 911"
      />
    </FormRow>

    {/* Secret */}
    <FormRow label="Secret" tooltip="The password for this extension's SIP/PJSIP registration.">
      <input
        type="text"
        name="secret"
        value={formData.secret}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., aStrongPassword"
        required
      />
    </FormRow>
  </>
));

export default GeneralSettings;
