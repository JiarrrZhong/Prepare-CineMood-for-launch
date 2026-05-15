function extractMovieCandidates(text: string) {
  const knownMovies = [
    "Back To The Future",
    "Paddington",
    "Paddington 2",
    "Planes, Trains and Automobiles",
    "Sing Street",
    "Brigsby Bear",
    "Moonlight",
    "The Last Black Man in San Francisco",
    "Before Sunrise",
    "About Time",
    "Little Forest",
    "Soul",
    "The Secret Life of Walter Mitty",
    "Our Little Sister",
    "Aftersun",
  ];

  const candidates = knownMovies.filter((movie) =>
    text.toLowerCase().includes(movie.toLowerCase())
  );

  return Array.from(new Set(candidates));
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || "comfort movies for anxiety";
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Missing TAVILY_API_KEY. Please check your .env.local file.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const tavilyResponse = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  });

  if (!tavilyResponse.ok) {
    const errorText = await tavilyResponse.text();

    return new Response(
      JSON.stringify({
        error: "Tavily search failed",
        details: errorText,
      }),
      {
        status: tavilyResponse.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  const data = await tavilyResponse.json();

const simplifiedResults = data.results.map(
  (item: { title: string; url: string; content: string; score?: number }) => ({
    title: item.title,
    url: item.url,
    content: item.content,
    score: item.score,
  })
);
const combinedText = simplifiedResults
  .map(
    (item: { title: string; content: string }) =>
      `${item.title} ${item.content}`
  )
  .join(" ");

const candidates = extractMovieCandidates(combinedText);

return new Response(
  JSON.stringify({
    query,
    candidates,
    results: simplifiedResults,
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  }
);
}
