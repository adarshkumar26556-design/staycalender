const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiFetch = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
