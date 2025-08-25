import React from 'react';
import Hearth2 from '../../components/Heart';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hearth2 
        texts={[
          "Chào mừng đến với",
          "Portfolio của tôi",
          "Hy vọng bạn thích",
          "Các dự án của tôi"
        ]}
        color="#fff"
        imageUrl="https://picsum.photos/400/300"
      />
    </div>
  );
};

export default HomePage;
