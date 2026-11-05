/**
 * Read a public catalog route. The first try can land before the browser
 * finishes its bot check, so a 403 is retried twice.
 */
export async function fetchCatalog(input: string): Promise<Response> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await fetch(input);
    if (last.status !== 403 || attempt === 2) return last;
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
  return last as Response;
}
