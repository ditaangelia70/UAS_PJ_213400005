import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MakeupList = () => {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token'); // Ambil token dari localStorage
      const response = await axios.get('http://localhost:5000/makeup', {
        headers: {
          Authorization: token, // Kirim token di header
        },
      });
      setData(response.data.data); // Set data makeup ke state
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. Please login first.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>Makeup List</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {item.jenisMakeup} - {item.merkMakeup} (Expired: {item.expired})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MakeupList;
