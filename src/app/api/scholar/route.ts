import { NextResponse } from 'next/server';

const TOP_VENUES = [
  'Nature',
  'Science',
  'Cell',
  'Nature Machine Intelligence',
  'Nature Communications',
  'Science Advances',
  'Remote Sensing of Environment',
  'ISPRS Journal of Photogrammetry and Remote Sensing',
  'IEEE Transactions on Geoscience and Remote Sensing',
  'IEEE Transactions on Pattern Analysis and Machine Intelligence',
  'IEEE Transactions on Neural Networks and Learning Systems',
  'International Journal of Computer Vision',
  'NeurIPS',
  'ICML',
  'ICLR',
  'CVPR',
  'ICCV',
  'AAAI',
  'ACL',
  'EMNLP'
];

const DOMAIN_QUERIES: Record<string, string> = {
  remote: 'remote sensing geospatial foundation model earth observation hyperspectral',
  ai: 'artificial intelligence machine learning deep learning foundation model',
  llm: 'large language model LLM reasoning retrieval augmented generation agent',
};

const DOMAIN_REVIEW_QUERIES: Record<string, string> = {
  remote: 'remote sensing review survey earth observation foundation model',
  ai: 'artificial intelligence review survey foundation model',
  llm: 'large language model review survey LLM reasoning agent',
};

const venueRank = (venue = '') => {
  const matched = TOP_VENUES.find(item => venue.toLowerCase().includes(item.toLowerCase()));
  if (!matched) return '权威来源候选';
  if (['Nature', 'Science', 'Cell'].some(item => matched.includes(item))) return '顶级综合期刊';
  if (['NeurIPS', 'ICML', 'ICLR', 'CVPR', 'ICCV', 'AAAI', 'ACL', 'EMNLP'].includes(matched)) return '顶级会议';
  return '顶刊 / 权威期刊';
};

const pickPdfUrl = (work: any) => {
  const locations = [work.primary_location, ...(work.locations || [])].filter(Boolean);
  const pdfLocation = locations.find((location: any) => {
    const pdfUrl = location?.pdf_url || '';
    return typeof pdfUrl === 'string' && pdfUrl.toLowerCase().includes('.pdf');
  });

  return pdfLocation?.pdf_url || '';
};

const normalizeOpenAlexWork = (work: any) => {
  const venue = work.primary_location?.source?.display_name || work.host_venue?.display_name || 'OpenAlex Indexed';
  const doi = work.doi || '';
  const openUrl = work.open_access?.oa_url || work.primary_location?.landing_page_url || doi || work.id;
  const pdfUrl = pickPdfUrl(work);

  return {
    title: work.title || 'Untitled research work',
    authors: (work.authorships || [])
      .slice(0, 4)
      .map((item: any) => item.author?.display_name)
      .filter(Boolean)
      .join(', ') || 'Unknown authors',
    date: work.publication_date || String(work.publication_year || ''),
    link: openUrl,
    source: venue,
    summary: work.abstract_inverted_index ? restoreAbstract(work.abstract_inverted_index) : '',
    doi,
    citations: work.cited_by_count || 0,
    level: venueRank(venue),
    type: work.type || 'article',
    pdfUrl,
  };
};

const restoreAbstract = (index: Record<string, number[]>) => {
  const words: string[] = [];
  Object.entries(index).forEach(([word, positions]) => {
    positions.forEach(position => {
      words[position] = word;
    });
  });
  return words.join(' ');
};

const fetchOpenAlexWorks = async (domain: string, isReview = false) => {
  const query = encodeURIComponent((isReview ? DOMAIN_REVIEW_QUERIES : DOMAIN_QUERIES)[domain] || DOMAIN_QUERIES.remote);
  const typeFilter = isReview ? ',type:review' : '';
  const url = `https://api.openalex.org/works?search=${query}&filter=from_publication_date:2021-01-01,is_retracted:false${typeFilter}&sort=cited_by_count:desc&per-page=${isReview ? 5 : 18}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Nexus-OS research dashboard (mailto:research@example.com)' },
    next: { revalidate: 21600 },
  });

  if (!response.ok) throw new Error(`OpenAlex error: ${response.status}`);
  const payload = await response.json();
  const works = Array.isArray(payload.results) ? payload.results.map(normalizeOpenAlexWork) : [];

  if (isReview) return works;

  const topVenueWorks = works.filter((paper: any) =>
    TOP_VENUES.some(venue => paper.source.toLowerCase().includes(venue.toLowerCase())) || paper.citations >= 80
  );

  return (topVenueWorks.length >= 6 ? topVenueWorks : works).slice(0, 12);
};

const fetchArxivFallback = async (domain: string) => {
  const queryMap: Record<string, string> = {
    remote: 'all:remote+sensing',
    ai: 'all:artificial+intelligence',
    llm: 'all:LLM',
  };
  const arxivUrl = `https://export.arxiv.org/api/query?search_query=${queryMap[domain] || queryMap.remote}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`;
  const response = await fetch(arxivUrl, { next: { revalidate: 3600 } });
  const xmlText = await response.text();
  const entries = xmlText.split('<entry>');
  entries.shift();

  return entries.map((entry: string) => {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1].replace(/\n/g, ' ').trim() || 'Research Paper';
    const authors = entry.match(/<name>([\s\S]*?)<\/name>/)?.[1] || 'ArXiv Researcher';
    const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1] || '#';
    const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1].replace(/\n/g, ' ').trim() || '';
    const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1].slice(0, 10) || '2024';

    return {
      title,
      authors: `${authors} 等`,
      date: published,
      link: id,
      summary,
      source: 'ArXiv fallback',
      citations: 0,
      level: '前沿预印本',
      type: 'preprint',
    };
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || 'remote';

  try {
    const [papers, reviews] = await Promise.all([
      fetchOpenAlexWorks(domain, false),
      fetchOpenAlexWorks(domain, true),
    ]);

    return NextResponse.json({
      source: 'OpenAlex + top venue filter',
      papers,
      reviews,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scholarly source error:', error);
    const fallback = await fetchArxivFallback(domain);
    return NextResponse.json({
      source: 'ArXiv fallback',
      papers: fallback,
      reviews: fallback.slice(0, 3),
      updatedAt: new Date().toISOString(),
    });
  }
}
