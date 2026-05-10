"use client";

import { useState, useTransition } from "react";

const PAYMENT_OPTIONS = ["現金", "刷卡", "Line Pay", "街口", "ATM 轉帳", "Apple Pay", "悠遊付"];

type Info = {
  businessHours: string;
  serviceArea: string;
  address: string;
  phone: string;
  line: string;
  paymentMethods: string[];
  website: string;
  mapUrl: string;
};

export function MerchantInfoForm({ initial }: { initial: Info }) {
  const [data, setData] = useState<Info>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Info>(k: K, v: Info[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function togglePay(p: string) {
    set("paymentMethods", data.paymentMethods.includes(p)
      ? data.paymentMethods.filter((x) => x !== p)
      : [...data.paymentMethods, p]);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = await fetch("/api/business/merchant-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (r.ok) setMsg({ ok: true, text: "已儲存" });
      else {
        const j = await r.json().catch(() => ({}));
        setMsg({ ok: false, text: j?.error ?? "儲存失敗" });
      }
    });
  }

  return (
    <div className="space-y-3 text-sm">
      {msg && (
        <div className={`rounded border px-3 py-2 ${
          msg.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/50 bg-danger/10 text-danger"
        }`}>{msg.text}</div>
      )}

      <Field label="營業時間（例：週一至週日 12:00–24:00）">
        <textarea value={data.businessHours} onChange={(e) => set("businessHours", e.target.value)}
          rows={2} className={cls()} maxLength={300} />
      </Field>

      <Field label="服務地區（例：大安區、信義區、可外送）">
        <input value={data.serviceArea} onChange={(e) => set("serviceArea", e.target.value)}
          className={cls()} maxLength={200} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="店家地址">
          <input value={data.address} onChange={(e) => set("address", e.target.value)}
            className={cls()} maxLength={200} />
        </Field>
        <Field label="Google Map 連結">
          <input value={data.mapUrl} onChange={(e) => set("mapUrl", e.target.value)}
            className={cls()} placeholder="https://maps.google.com/..." maxLength={500} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="聯絡電話">
          <input value={data.phone} onChange={(e) => set("phone", e.target.value)}
            className={cls()} maxLength={30} />
        </Field>
        <Field label="LINE ID">
          <input value={data.line} onChange={(e) => set("line", e.target.value)}
            className={cls()} maxLength={50} />
        </Field>
        <Field label="官網/IG/FB">
          <input value={data.website} onChange={(e) => set("website", e.target.value)}
            className={cls()} maxLength={300} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">支付方式</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePay(p)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                data.paymentMethods.includes(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >{p}</button>
          ))}
        </div>
      </div>

      <button type="button" onClick={save} disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-80 disabled:opacity-50">
        儲存店家資訊
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function cls() {
  return "w-full rounded-md border bg-background px-3 py-2 text-sm";
}
