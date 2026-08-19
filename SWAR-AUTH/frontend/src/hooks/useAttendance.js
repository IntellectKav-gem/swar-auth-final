import { useState } from 'react';

const useAttendance = (initialRecords = []) => {
  const [records, setRecords] = useState(initialRecords);

  const addRecord = record => setRecords(prev => [...prev, record]);
  const removeRecord = id => setRecords(prev => prev.filter(record => record.id !== id));
  const clearRecords = () => setRecords([]);

  return { records, addRecord, removeRecord, clearRecords };
};

export default useAttendance;
