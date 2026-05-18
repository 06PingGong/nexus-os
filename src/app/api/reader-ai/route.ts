import { NextResponse } from 'next/server';

const AI_BASE_URL = process.env.AI_BASE_URL || '';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

type ReaderAction = 'explain' | 'translate' | 'frontier' | 'card' | 'plan' | 'application_insight' | 'tech_tool_update';

const SYSTEM_PROMPTS: Record<ReaderAction, string> = {
  explain: '你是严谨的科研论文精读助手。请用中文输出：核心问题、主要贡献、方法路线、实验结论、局限性、精读建议。避免编造。',
  translate: '你是科研英文翻译助手。请给出中文精译，并补充关键术语解释、长难句拆解和可能的论文语境。',
  frontier: '你是学术前沿分析助手。请严格基于给定论文列表，用中文输出 JSON，不要输出 Markdown。JSON 字段包括：summary:string, trends:string[], hotTerms:string[], activeLevel:string, readingPriority:string, reviewFocus:string。不要编造论文列表外的信息。',
  card: '你是科研精读卡片助手。请严格基于输入论文信息，用中文输出结构化精读卡片：一句话结论、研究问题、方法核心、数据/实验、关键贡献、局限、可借鉴点、适合写入综述的位置。避免编造。',
  plan: '你是科研项目管理助手。请基于论文信息生成可执行计划：精读步骤、复现实验、代码/数据检查、写作输出、后续引用场景。用中文短条目输出。',
  application_insight: '你是保研/出国申请情报分析助手。基于用户提供的目标院校、研究方向、背景材料等信息，用中文输出 JSON（不要 Markdown）：title:string（情报标题）, keywords:string[](关键准备点), timeline:string(备战时间轴), preparation:string[](核心准备清单), competitive_edges:string[](竞争力亮点), risk_warning:string(需要注意的风险)。严格基于常识，不要编造。',
  tech_tool_update: '你是技术工具与前沿趋势分析助手。基于用户关注的领域/研究方向/竞赛/求职，用中文输出 JSON（不要 Markdown）：trending_tools:string[](最新值得掌握的工具/框架), benchmarks:string[](新发布的数据集/评测), research_directions:string[](当前热点研究方向), summer_program_insights:string[](与夏令营/竞赛相关的能力需求), implementation_guide:string(如何快速实践这些工具)。基于公开信息，不要编造。',
};

const repairMojibake = (text: string) => {
  if (!/[åæèçãï¼]/.test(text)) return text;
  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8');
    const originalBadMarks = (text.match(/[åæèçãï¼]/g) || []).length;
    const repairedBadMarks = (repaired.match(/[åæèçãï¼]/g) || []).length;
    return repairedBadMarks < originalBadMarks ? repaired : text;
  } catch {
    return text;
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = (body.action || 'explain') as ReaderAction;
    const content = String(body.content || '').trim();

    if (!content) {
      return NextResponse.json({ error: '缺少需要分析的内容。' }, { status: 400 });
    }

    if (!AI_BASE_URL || !AI_API_KEY) {
      return NextResponse.json({
        configured: false,
        result: `AI 接口尚未配置。\n\n当前已收到内容：\n${content.slice(0, 1200)}\n\n请在 .env.local 中配置 AI_BASE_URL、AI_API_KEY、AI_MODEL 后重启服务，即可启用真实 AI 解读。`,
      });
    }

    const response = await fetch(`${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.25,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.explain },
          { role: 'user', content },
        ],
      }),
    });

    const responseText = new TextDecoder('utf-8').decode(await response.arrayBuffer());

    if (!response.ok) {
      return NextResponse.json({ error: responseText || 'AI 接口请求失败。' }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    const result = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.output_text || data.data?.content || 'AI 没有返回有效内容。';
    const cleanResult = typeof result === 'string' ? repairMojibake(result) : result;
    return NextResponse.json({ configured: true, result: cleanResult });
  } catch (error) {
    console.error('Reader AI route failed:', error);
    return NextResponse.json({ error: 'AI 服务调用异常。' }, { status: 500 });
  }
}
