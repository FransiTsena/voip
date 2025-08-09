import React from 'react';

type Props = {
    title: string;
    value: number | string;
    color: string;
    textColor: string;
};

const Card: React.FC<Props> = ({ title, value, color, textColor }) => (
    <div className={`rounded-xl shadow-sm p-4 flex flex-col items-center bg-${color} text-${textColor}`}>
        <span className="text-sm font-medium">{title}</span>
        <span className="text-2xl font-bold">{value}</span>
    </div>
);

export default Card;
