import { NextResponse } from 'next/server';

const RSS_FEEDS: Record<string, string> = {
  '科技': 'https://36kr.com/feed', // 36氪，最快科技快讯
  '国内时政': 'http://www.people.com.cn/rss/politics.xml', // 人民网-时政
  '国际实事': 'http://www.people.com.cn/rss/world.xml' // 人民网-国际
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('cat') || '科技';
  
  // 如果请求的是法律或不存在的板块，默认回退到科技
  const rssUrl = RSS_FEEDS[category] || RSS_FEEDS['科技'];

  try {
    // 使用 rss2json 代理将 RSS 转为 JSON，并设置 revalidate 以支持 Next.js 缓存
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const response = await fetch(proxyUrl, { next: { revalidate: 300 } }); // 每 5 分钟刷新一次缓存
    const data = await response.json();

    if (data.status === 'ok') {
      const results = data.items.slice(0, 15).map((item: any) => ({
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
    // 保底数据，避免页面白屏
    return NextResponse.json([
      { title: `${category}资讯库正在同步中，请稍后刷新...`, date: new Date().toISOString(), link: "#", source: "系统提示", category: category }
    ]);
  }
}
