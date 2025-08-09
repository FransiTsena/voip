    import React, { useCallback } from 'react';
    import { Agent } from '../../types/queueTypes'; // Assuming Agent type is now imported from types/queue

    // Props for the QueueAgentsTab component
    interface QueueAgentsTabProps {
      initialAllAgents: Agent[]; // This is now the source of truth for available agents
      initialSelectedQueueAgents: Agent[]; // This is now the source of truth for selected agents
      onAllAgentsChange: (agents: Agent[]) => void; // Callback to update parent's allAgents state
      onSelectedQueueAgentsChange: (agents: Agent[]) => void; // Callback to update parent's selectedQueueAgents state
    }

    const QueueAgentsTab: React.FC<QueueAgentsTabProps> = ({
      initialAllAgents,
      initialSelectedQueueAgents,
      onAllAgentsChange,
      onSelectedQueueAgentsChange,
    }) => {

      // Handle adding an agent to the queue immediately on select
      const handleSelectAndAddAgent = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const agentId = e.target.value;
        if (agentId) { // Ensure a valid agent is selected (not the default empty option)
          const agentToAdd = initialAllAgents.find(agent => agent.id === agentId);
          if (agentToAdd) {
            // Update selected agents in parent
            onSelectedQueueAgentsChange([...initialSelectedQueueAgents, agentToAdd]);
            // Update all agents in parent (remove the added agent)
            onAllAgentsChange(initialAllAgents.filter(agent => agent.id !== agentId));
          }
        }
      }, [initialAllAgents, initialSelectedQueueAgents, onAllAgentsChange, onSelectedQueueAgentsChange]);

      // Handle removing an agent from the queue
      const handleRemoveAgent = useCallback((agentId: string) => {
        const agentToRemove = initialSelectedQueueAgents.find(agent => agent.id === agentId);
        if (agentToRemove) {
          // Update selected agents in parent (remove the agent)
          onSelectedQueueAgentsChange(initialSelectedQueueAgents.filter(agent => agent.id !== agentId));
          // Update all agents in parent (add the agent back and sort)
          onAllAgentsChange([...initialAllAgents, agentToRemove].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }, [initialAllAgents, initialSelectedQueueAgents, onAllAgentsChange, onSelectedQueueAgentsChange]);

      return (
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Manage Queue Agents</h3>

          {/* Add Agent Section - No explicit "Add" button */}
          <div className="flex items-end space-x-3 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex-grow">
              <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700 mb-1">Select Agent to Add</label>
              <select
                id="agent-select"
                value="" // Set value to empty string to ensure "Select an Agent" is always shown after selection
                onChange={handleSelectAndAddAgent} // Call the new handler
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select an Agent --</option>
                {initialAllAgents.map(agent => ( // Use initialAllAgents directly
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.extension})
                  </option>
                ))}
              </select>
            </div>
            {/* The Add button is removed as per the request */}
          </div>

          {/* Selected Agents List */}
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Agents in this Queue:</h4>
            {initialSelectedQueueAgents.length === 0 ? ( // Use initialSelectedQueueAgents directly
              <p className="text-gray-500 italic">No agents added to this queue yet.</p>
            ) : (
              <div className="space-y-3">
                {initialSelectedQueueAgents.map(agent => ( // Use initialSelectedQueueAgents directly
                  <div key={agent.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                    <span className="text-gray-800 font-medium">{agent.name} ({agent.extension})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAgent(agent.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm"
                      title="Remove Agent"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    export default QueueAgentsTab;
    