import { useEffect, useState } from 'react';
import PickRunView from './components/PickRunView';
import SettingsView from './components/SettingsView';
import { loadRun, openDatabase } from './data/db';
import type { RunData } from './types';

type View = 'run' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('run');
  const [data, setData] = useState<RunData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    openDatabase()
      .then(() => setData(loadRun()))
      .catch((e: unknown) => setError(String(e)));
  }, []);

  // Staging clocks move in real time, so re-render every 30 seconds.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function refresh() {
    setData(loadRun());
    setNow(new Date());
  }

  const tabClass = (selected: boolean) =>
    `px-3 py-1.5 text-sm font-medium rounded-md ${
      selected ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <nav className="mb-6 flex items-center gap-2">
        <span className="mr-4 text-lg font-bold tracking-tight">Store Pick</span>
        <button className={tabClass(view === 'run')} onClick={() => setView('run')}>
          Pick run
        </button>
        <button className={tabClass(view === 'settings')} onClick={() => setView('settings')}>
          Settings
        </button>
      </nav>

      {error && <p className="text-red-700">Could not load the database: {error}</p>}
      {!data && !error && <p className="text-slate-500">Loading…</p>}
      {data && view === 'run' && <PickRunView data={data} now={now} onChanged={refresh} />}
      {data && view === 'settings' && <SettingsView data={data} />}
    </div>
  );
}
