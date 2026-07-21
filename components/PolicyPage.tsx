import type { ReactNode } from 'react';

export default function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="section-title">{title}</h1>
      <div className="prose-policy mt-6 space-y-4 text-neutral-600 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-denim-800 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  );
}
