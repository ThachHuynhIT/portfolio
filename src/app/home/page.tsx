import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Welcome to My Portfolio</h1>
      <p>This is the home page of my portfolio website.</p>
      <a href="/about" style={{ textDecoration: 'none', color: 'blue' }}>
        Learn more about me
      </a>
    </div>
  );
};

export default HomePage;
