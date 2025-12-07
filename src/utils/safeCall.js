export async function safeCall(promise, label = "") {
  try {
    return await promise;
  } catch (e) {
    console.log(`SAFE ERROR ${label}:`, e.description || e);
  }
}