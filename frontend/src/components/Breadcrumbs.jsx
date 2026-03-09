import { Link } from 'react-router-dom';

const Chevron = () => (
  <span className="text-gray-500 mx-1.5" aria-hidden>/</span>
);

export default function Breadcrumbs({ items }) {
  if (!items?.length) return null;
  return (
    <nav className="flex items-center text-sm text-gray-400 flex-wrap gap-0.5" aria-label="Migas de pan">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <Chevron />}
          {item.to != null ? (
            <Link to={item.to} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
