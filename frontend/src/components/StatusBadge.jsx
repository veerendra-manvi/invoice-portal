import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    Draft: 'bg-gray-100 text-gray-800 border-gray-200',
    Sent: 'bg-blue-100 text-blue-800 border-blue-200',
    Paid: 'bg-green-100 text-green-800 border-green-200',
    Overdue: 'bg-red-100 text-red-800 border-red-200',
    Cancelled: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const currentStyle = styles[status] || styles.Draft;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${currentStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
