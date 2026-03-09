// Netlify serverless function to fetch inventory data from Google Sheets via Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGpuUe8AkkQCrO9zB4uolgX2smc_Ih66k8VXrlWdB3794D5YuYckhaAoTq6TcozOHT/exec';

exports.handler = async (event, context) => {
  try {
    // Fetch from Apps Script (handles authentication)
    const response = await fetch(APPS_SCRIPT_URL + '?action=getInventory&_=' + Date.now());
    const data = await response.json();
    
    // Apps Script returns array of arrays, not objects
    if (!data || data.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        },
        body: 'Item ID,Item Name,Category,Quantity,Status,Location,Value (₹),Added Date,Notes\n'
      };
    }
    
    // First row is headers, rest are data rows
    const headers = data[0];
    const csvRows = [headers.join(',')];
    
    // Convert each data row to CSV
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const values = row.map(val => {
        if (val === null || val === undefined || val === '') return '';
        // Escape quotes and wrap in quotes if contains comma
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') ? `"${str}"` : str;
      });
      csvRows.push(values.join(','));
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: csvRows.join('\n')
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};
