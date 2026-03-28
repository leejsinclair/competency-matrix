import React, { useState } from 'react';

const MinimalMatrix: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6">
      <h2>Minimal Matrix Test</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default MinimalMatrix;
