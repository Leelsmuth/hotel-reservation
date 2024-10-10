import React from 'react';

const HeadingOne = ({ children, classes = '' }) => {
  return <h1 className={`text-3xl font-bold ${classes}`}>{children}</h1>;
};

export default HeadingOne;
