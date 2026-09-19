"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HttpError, requestMessage } from "@/lib/http-client";

export function RequestState({ loading, error, retry }: { loading?: boolean; error?: string; retry?: () => void }) {
  if (loading) return <p role="status" className="p-4 text-sm text-slate-600">กำลังโหลดข้อมูล…</p>;
  if (!error) return null;
  return <div role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p>{retry && <button type="button" onClick={retry} className="mt-2 font-semibold underline">ลองใหม่ / โหลดข้อมูลล่าสุด</button>}</div>;
}
export function useRemoteData<T>(load: () => Promise<T>) {
  const router = useRouter();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ source: typeof load | null; revision: number; data: T | null; error: string }>({ source: null, revision: -1, data: null, error: "" });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(load).then(data => {
      if (active) setState({ source: load, revision, data, error: "" });
    }).catch(error => {
      if (!active) return;
      if (error instanceof HttpError && error.status === 401) router.replace("/login");
      setState({ source: load, revision, data: null, error: requestMessage(error) });
    });
    return () => { active = false; };
  }, [load, revision, router]);
  const current = state.source === load && state.revision === revision;
  const retry = useCallback(() => setRevision(n => n + 1), []);
  const update = (fn: (data: T) => T) => setState(old => old.source === load && old.data ? { ...old, data: fn(old.data) } : old);
  return { data: current ? state.data : null, loading: !current, error: current ? state.error : "", retry, update };
}
export function useRequestAction() {
  const router = useRouter();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function run(action: () => Promise<void>, message = "บันทึกสำเร็จ") {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setSuccess("");
    try { await action(); setSuccess(message); }
    catch (e) {
      if (e instanceof HttpError && e.status === 401) router.replace("/login");
      setError(requestMessage(e));
    } finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, success, run };
}
