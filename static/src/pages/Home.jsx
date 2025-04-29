import React, { useState, useEffect } from 'react';
import UserCard from '../components/UserCard';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/homepage-users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-purple-500 mb-4">Welcome to andrewarrow.dev</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Get support and questions answered about our iOS apps.
        </p>
      </section>

      <section className="mb-12">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <blockquote className="text-xl text-gray-300 italic mb-4">
    floormula<br/>
    12x <br/>
    Car Tower Voice<br/>
    ReadHerring<br/>
    Lithium<br/>
          </blockquote>
        </div>
        <div>
    Please email support@andrewarrow.dev for questions on any of our apps!
        </div>
      </section>

    </div>
  );
};

export default Home;
