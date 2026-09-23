import type { RunData } from '../types';

export default function SettingsView({ data }: { data: RunData }) {
  const { run, settings } = data;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Run settings</h1>

      <Section title="Run">
        <Row label="Store" value={run.storeName} />
        <Row label="Run reference" value={run.reference} />
        <Row label="Picker" value={run.pickerName} />
        <Row label="Started" value={new Date(run.startedAt).toLocaleString()} />
      </Section>

      <Section title="Picking rules">
        <Row label="Maximum substitutions per order" value={String(settings.maxSubstitutions)} />
        <Row label="Short pick tolerance" value={`${settings.shortPickTolerancePct}%`} />
        <Row label="Chilled staging limit" value={`${settings.chilledStagingMinutes} minutes`} />
        <Row label="Ambient staging limit" value={`${settings.ambientStagingMinutes} minutes`} />
      </Section>

      <p className="text-sm text-slate-500">Settings are read only in this console.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">{title}</h2>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-3 text-sm">
      <dt className="w-72 text-slate-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
