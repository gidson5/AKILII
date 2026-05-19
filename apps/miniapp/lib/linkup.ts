const LINKUP_BASE_URL = "https://api.linkup.so/v1";

export type LinkupResult = {
  type: string;
  url: string;
  name: string;
  content: string;
};

export type LinkupSearchResponse = {
  results: LinkupResult[];
};

export async function linkupSearch(
  query: string,
  depth: "standard" | "deep" = "standard"
): Promise<LinkupSearchResponse> {
  const apiKey = process.env.LINKUP_API_KEY;
  if (!apiKey) throw new Error("LINKUP_API_KEY is not set");

  const res = await fetch(`${LINKUP_BASE_URL}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: query,
      depth,
      outputType: "searchResults",
      includeImages: false
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linkup search failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<LinkupSearchResponse>;
}

export async function researchAddress(address: string): Promise<string> {
  try {
    const response = await linkupSearch(
      `Celo blockchain address ${address} — what protocol or project is this? Is it safe?`,
      "standard"
    );
    return response.results
      .slice(0, 3)
      .map((r) => r.content)
      .join("\n\n");
  } catch {
    return "";
  }
}

export async function researchToken(symbol: string): Promise<string> {
  try {
    const response = await linkupSearch(
      `${symbol} token on Celo blockchain — what is it, is it legitimate?`,
      "standard"
    );
    return response.results
      .slice(0, 2)
      .map((r) => r.content)
      .join("\n\n");
  } catch {
    return "";
  }
}
