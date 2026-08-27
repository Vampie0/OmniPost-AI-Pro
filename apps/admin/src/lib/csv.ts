/**
 * Exports an array of objects to a downloadable CSV file.
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  customHeaders?: Partial<Record<keyof T, string>>
) {
  if (!rows || rows.length === 0) {
    console.warn('No rows to export to CSV.');
    return;
  }

  const firstRow = rows[0] as Record<string, any>;
  const keys = Object.keys(firstRow) as (keyof T)[];
  const headerRow = keys
    .map((key) => {
      const headerName = customHeaders?.[key] || String(key);
      return `"${headerName.replace(/"/g, '""')}"`;
    })
    .join(',');

  const csvRows = rows.map((row) => {
    return keys
      .map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = [headerRow, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
