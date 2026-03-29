'use client';

import { DocumentList } from '@/components/documents/document-list';

export default function DocumentsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Documentos</h1>
      <DocumentList />
    </div>
  );
}
