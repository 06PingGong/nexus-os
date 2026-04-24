import { NextResponse } from 'next/server';

const CATEGORY_MAP: Record<string, string> = {
  '科技': 'https://rss.itdirect.cn/it/latest', // IT之家类科技快讯
  '国内时政': 'https://www.cctv.com/rss/china.xml', // CCTV 国内
  '法律': 'https://www.chinacourt.org/article/index/id/MzAwNDAwMCEA.shtml', // 中国法院网（此处仅为示意，实际会转为可用 RSS）
  '国际实事': 'https://www.cctv.com/rss/world.xml' // CCTV 国际
};

// 为法律板块寻找更稳定的源
const RSS_FEEDS: Record<string, string> = {
  '科技': 'https://36kr.com/feed',
  '国内时政': 'http://www.people.com.cn/rss/politics.xml',
  '法律': 'http://www.npc.gov.cn/npc/c30834/rss_cl.xml', // 人大法律新闻
  '国际实事': 'http://www.people.com.cn/rss/world.xml'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('cat') || '科技';
  
  const rssUrl = RSS_FEEDS[category] || RSS_FEEDS['科技'];

  try {
    // 使用 rss2json 代理将 RSS 转为干净的 JSON
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const response = await fetch(proxyUrl, { next: { revalidate: 600 } }); // 缓存 10 分钟
    const data = await response.json();

    if (data.status === 'ok') {
      const results = data.items.map((item: any) => ({
        title: item.title,
        date: item.pubDate,
        link: item.link,
        source: data.feed.title || category,
        category: category
      }));
      return NextResponse.json(results);
    }
    throw new Error("RSS Proxy failed");
  } catch (error) {
    console.error("News Relay Error:", error);
    // 保底数据
    return NextResponse.json([
      { title: `${category}板块实时连接中...`, date: new Date().toISOString(), link: "#", source: "系统提示", category: category }
    ]);
  }
}
