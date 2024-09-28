import Link from 'next/link';
import React from 'react';

const StyledLink = ({ linkText, path }) => {
  return (
    <Link
      href={path}
      className="bg-orange-800 text-white hover:bg-orange-900 transition-colors rounded-xl px-4 py-2"
    >
      {linkText}
    </Link>
  );
};

export default StyledLink;
