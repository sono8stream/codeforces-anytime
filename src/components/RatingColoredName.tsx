import React, { useEffect } from 'react';
import styled from 'styled-components';
import getRatingColorStyle from '../utils/getRatingColorStyle';

const RatingColoredName: React.FC<{ rating: number; name: string }> = ({
  rating,
  name,
}) => {
  if (rating >= 3000) {
    return (
      <>
        <Black>{name[0]}</Black>
        <Colored rating={rating}>{name.substr(1)}</Colored>
      </>
    );
  } else {
    return <Colored rating={rating}>{name}</Colored>;
  }
};

const Black = styled.span`
  color: #000000;
`;

const Colored = styled.span`
  ${(props: { rating: number }) => getRatingColorStyle(props.rating)};
`;

export default RatingColoredName;
