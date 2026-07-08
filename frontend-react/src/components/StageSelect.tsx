import { useState } from "react";
import { api, errorDetail } from "../api";
import { STAGES } from "../utils";
import { useToast } from "../toast";
import type { Candidate, Stage } from "../types";

interface Props {
  candidateId: string;
  fullName: string;
  status: Stage;
  onChanged?: (status: Stage) => void;
}

/** Pipeline-stage pill selector that PATCHes the candidate's status. */
export default function StageSelect({ candidateId, fullName, status, onChanged }: Props) {
  const toast = useToast();
  const [value, setValue] = useState<Stage>(status);
  const [busy, setBusy] = useState(false);

  async function change(next: Stage) {
    setBusy(true);
    try {
      const updated = await api<Candidate>(`/v1/candidates/${candidateId}/status`, {
        method: "PATCH",
        json: { status: next },
      });
      setValue(updated.status);
      onChanged?.(updated.status);
      toast(`${fullName} → ${next}`);
    } catch (e) {
      toast(errorDetail(e), true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className={`stagesel stage-${value}`}
      value={value}
      disabled={busy}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        change(e.target.value as Stage);
      }}
    >
      {STAGES.map((s) => (
        <option key={s.v} value={s.v}>
          {s.t}
        </option>
      ))}
    </select>
  );
}
