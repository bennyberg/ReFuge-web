"use client";

import React, { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useWizard } from "../WizardProvider";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function emptyChildExtras() {
  return { firstEntryDate: "", fileJoinDate: "" };
}

export default function Step4Page() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const {
    draft,
    extras,
    setExtras,
    update,
    updateChild,
    addChildRow,
    instanceId,
    isHydrated,

    // ✅ saving like the other wizard
    saveNow,
    saveStatus,
    saveError,
  } = useWizard();

  // ✅ mark current step so the homepage can resume correctly
  useEffect(() => {
    setExtras((p: any) => ({ ...p, currentStep: 4 }));
  }, [setExtras]);

  const payload = useMemo(() => {
    if (!draft) return null;
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.lastName ?? "").trim() ||
        (c.israeliId ?? "").trim() ||
        (c.birthDate ?? "").trim(),
    );
    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;
    return cleaned;
  }, [draft]);

  if (!isHydrated || !draft || !payload) {
    return <main className={styles.page}>Loading…</main>;
  }

  const kids = draft.intake.step6.children ?? [];

  // ✅ keep instanceId while navigating forward
  const nextUrl = instanceId
    ? `./step-5?instanceId=${encodeURIComponent(instanceId)}`
    : "./step-5";

  async function onSaveAndExit() {
    const id = await saveNow(); // creates/updates the instance + keeps instanceId in provider
    if (id) {
      router.push(`/${locale}/forms/child-allowance-request`);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>طلب مخصصات الأطفال</div>
        <div className={styles.headerText}>טופס בקשה לקצבת ילדים</div>
      </div>

      {/* -----------------------------
          Keep your Step-4 UI here.
          Make sure every field writes to:
          - draft via update/updateChild
          - extras via setExtras
         ----------------------------- */}

      {/* Example draft field */}
      {/* <Field label="בנק   בנק">
        <input
          className={styles.input}
          value={draft.intake.step4.bank.bankName}
          onChange={(e) => update("intake.step4.bank.bankName", e.target.value)}
        />
      </Field> */}

      {/* Example extras children field */}
      {/* <div className={styles.childrenGrid}>
        {kids.map((child, i) => (
          <div key={i} className={styles.childCard}>
            <Field label="תאריך כניסה ראשון (PDF בלבד)">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.firstEntryDate ?? ""}
                onChange={(e) =>
                  setExtras((p: any) => {
                    const next = structuredClone(p);
                    if (!next.children[i]) next.children[i] = emptyChildExtras();
                    next.children[i]!.firstEntryDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div> */}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push(nextUrl)}
        >
          אישור
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onSaveAndExit}
          disabled={saveStatus === "saving"}
        >
          שמור כטיוטה
        </button>
      </div>

      {saveStatus === "error" && saveError ? (
        <p className={styles.errorText}>{saveError}</p>
      ) : null}
    </main>
  );
}
