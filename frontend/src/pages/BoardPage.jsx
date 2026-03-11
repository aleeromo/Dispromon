import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getBoard } from '../api/client';
import BoardTable from '../components/board/BoardTable';
import BoardKanban from '../components/board/BoardKanban';
import BoardTimeline from '../components/board/BoardTimeline';
import Breadcrumbs from '../components/Breadcrumbs';

const VIEWS = [
  { id: 'table', label: 'Tabla' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'timeline', label: 'Cronograma' },
];

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const b = await getBoard(boardId);
      setBoard(b);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const breadcrumbItems = board?.workspace
    ? [
        { label: board.workspace.name, to: '/' },
        { label: board.name },
      ]
    : [];

  if (loading || !board) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <span className="text-monday-text-muted">Cargando board...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-monday-bg">
      <header className="shrink-0 flex flex-col gap-3 px-6 py-4 border-b border-monday-border bg-white">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-monday-text">{board.name}</h1>
          <nav className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`px-4 py-2 rounded-monday text-sm font-medium transition-colors ${
                  view === v.id
                    ? 'bg-monday-primary text-white'
                    : 'text-monday-text-muted hover:bg-monday-hover hover:text-monday-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {view === 'table' && <BoardTable board={board} onRefresh={loadBoard} />}
        {view === 'kanban' && <BoardKanban board={board} onRefresh={loadBoard} />}
        {view === 'timeline' && <BoardTimeline board={board} onRefresh={loadBoard} />}
      </div>
    </div>
  );
}
