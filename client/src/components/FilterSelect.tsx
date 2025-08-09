import React from 'react';

type Props = {
    label: string;
    name: string;
    value: string;
    options: string[];
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
};

const FilterSelect: React.FC<Props> = ({ label, name, value, options, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-onSurfaceVariant mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="border border-outlineVariant bg-surface px-2 py-1 rounded-md text-onSurface"
        >
            {options.map(opt => (
                <option key={opt} value={opt}>
                    {opt === '' ? 'All' : opt}
                </option>
            ))}
        </select>
    </div>
);

export default FilterSelect;
