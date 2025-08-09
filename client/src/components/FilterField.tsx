import React from 'react';

type Props = {
    label: string;
    name: string;
    type: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const FilterField: React.FC<Props> = ({ label, name, type, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-onSurfaceVariant mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="border border-outlineVariant bg-surface px-2 py-1 rounded-md text-onSurface"
        />
    </div>
);

export default FilterField;
