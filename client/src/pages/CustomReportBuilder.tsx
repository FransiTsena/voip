import React, { useState } from 'react';

const CustomReportBuilder: React.FC = () => {
    const [metrics, setMetrics] = useState<string[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        agents: [],
        queues: [],
    });
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        if (checked) {
            setMetrics([...metrics, value]);
        } else {
            setMetrics(metrics.filter(metric => metric !== value));
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    const generateReport = () => {
        // I will implement this later
        console.log({ metrics, filters });
    };

    return (
        <div className="max-w-6xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Custom Report Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metrics Selection */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Metrics</h3>
                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center">
                            <input type="checkbox" value="totalCalls" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">Total Calls</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" value="answeredCalls" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">Answered Calls</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" value="missedCalls" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">Missed Calls</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" value="abandonedCalls" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">Abandoned Calls</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" value="averageHandleTime" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">Average Handle Time</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" value="firstCallResolution" onChange={handleMetricChange} className="form-checkbox" />
                            <span className="ml-2">First Call Resolution</span>
                        </label>
                    </div>
                </div>
                {/* Filters */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" name="startDate" id="startDate" onChange={handleFilterChange} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" name="endDate" id="endDate" onChange={handleFilterChange} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        {/* Agent and Queue filters will be implemented later */}
                    </div>
                    <div className="mt-4">
                        <button onClick={generateReport} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
            {/* Report Table will be implemented later */}
        </div>
    );
};

export default CustomReportBuilder;
