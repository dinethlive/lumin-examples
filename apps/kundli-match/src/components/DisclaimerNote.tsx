/**
 * Mandated in the prompt, validated as a required field on arrival, rendered
 * here. Disclaimers in this repo are data, not decoration: if the model omits
 * it, the response fails validation and the request errors rather than
 * rendering without it.
 */
export function DisclaimerNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-xs text-black/60 ring-1 ring-black/[0.06]">
      {text}
    </p>
  );
}
