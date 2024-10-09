import Link from 'next/link';
import React from 'react';

const StyledLink = ({ linkText, path }) => {
  return (
    <Link
      href={path}
      className="bg-alternate text-black border-black border hover:bg-black hover:text-alternate font-bold transition-colors rounded-xl px-4 py-2 text-lg"
    >
      {linkText}
    </Link>
  );
};

export default StyledLink;
