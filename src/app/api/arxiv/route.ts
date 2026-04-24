import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'all:remote+sensing';
  
  const arxivUrl = `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=15&sortBy=submittedDate&sortOrder=descending`;

  try {
    const response = await fetch(arxivUrl, {
      next: { revalidate: 3600 } // 缓存 1 小时，提高速度
    });
    const xmlText = await response.text();

    // 极简 XML 解析逻辑（在服务端处理，更稳定）
    const entries = xmlText.split('<entry>');
    entries.shift();

    const results = entries.map((entry: string) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1].replace(/\n/g, ' ').trim() || "Research Paper";
      const authors = entry.match(/<name>([\s\S]*?)<\/name>/)?.[1] || "ArXiv Researcher";
      const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1] || "#";
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1].replace(/\n/g, ' ').trim() || "";
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1].slice(0, 10) || "2024";

      return {
        title,
        authors: authors + " 等",
        date: published,
        link: id,
        summary: summary,
        impact: '实时发现'
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("ArXiv Relay Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
