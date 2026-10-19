// The upstream mail backend call was removed (see CHANGES.md). Nothing is sent.
export async function send() {
  throw new Error("device-only");
}
