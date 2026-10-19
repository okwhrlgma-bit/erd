// Tells the page shell (our one-step counter) that an export happened.
// It carries no diagram data. See CHANGES.md.
export function erdStep(name) {
  try {
    window.dispatchEvent(new CustomEvent("erd:step", { detail: name }));
  } catch {
    // ignore
  }
}
