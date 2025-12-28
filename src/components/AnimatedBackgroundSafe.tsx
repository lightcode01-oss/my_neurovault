import React from 'react';

export function AnimatedBackgroundSafe() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900/10 to-black/5 opacity-40" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-[550px] h-[550px] bg-pink-500/6 rounded-full blur-3xl" />
    </div>
  );
}

export default AnimatedBackgroundSafe;
