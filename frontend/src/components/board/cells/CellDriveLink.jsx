import { useState } from 'react';
import { useRole } from '../../../hooks/useRole';

export default function CellDriveLink({ value, onUpdate }) {
  const { isTaller } = useRole();
  const url = value?.text ?? (typeof value === 'string' ? value : '');
  const [local, setLocal] = useState(url);

  const canEdit = !isTaller;

  function handleBlur() {
    const trimmed = String(local).trim();
    if (trimmed !== String(url).trim()) {
      onUpdate({ text: trimmed });
    }
  }

  if (!canEdit) {
    const href = url && String(url).trim();
    if (href) {
      const displayUrl = href.length > 50 ? href.slice(0, 47) + '...' : href;
      return (
        <div className="py-2">
          <a
            href={href.startsWith('http') ? href : `https://${href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm break-all"
          >
            {displayUrl}
          </a>
        </div>
      );
    }
    return <div className="py-2 text-gray-500 text-sm">—</div>;
  }

  return (
    <div className="py-2">
      <input
        type="url"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder="https://drive.google.com/..."
        className="w-full bg-transparent border-none outline-none py-1 px-2 rounded text-sm text-white placeholder-gray-500 focus:ring-1 ring-accent"
      />
    </div>
  );
}
