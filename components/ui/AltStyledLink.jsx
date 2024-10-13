import Link from 'next/link';
import React from 'react';

const AltStyledLink = ({ linkText, path }) => {
  return (
    <Link
      href={path}
      className="bg-transparent text-black border-black border hover:bg-black hover:text-white font-bold transition-colors rounded-xl px-4 py-2 text-lg"
    >
      {linkText}
    </Link>
  );
};

export default AltStyledLink;
