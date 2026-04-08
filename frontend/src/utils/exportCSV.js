/**
 * Export an array of objects to a CSV file download.
 * @param {Object[]} data - Array of row objects
 * @param {string} filename - Download filename (without .csv)
 * @param {Object} [columnMap] - Optional mapping { key: 'Label' } to rename/reorder columns
 */
export function exportToCSV(data, filename, columnMap = null) {
  if (!data || data.length === 0) return;

  const keys = columnMap ? Object.keys(columnMap) : Object.keys(data[0]);
  const headers = columnMap ? Object.values(columnMap) : keys;

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  };

  const rows = data.map((row) => keys.map((k) => escape(row[k])).join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
