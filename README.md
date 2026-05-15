This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Nexus OS 功能

- 学术中心：OpenAlex 权威论文扫描、AI 前沿总结、综述入口。
- 精读库：阅读状态、标签、优先级、评分、AI 精读卡片、任务生成。
- 论文阅读器：PDF/原文入口、AI 解读、翻译、精读卡片、研究计划、笔记、高亮。
- 任务系统：云端任务、番茄钟、专注音效、专注会话统计。

## Cloud sync

任务、随记、精读库、阅读笔记、高亮和专注会话支持 Supabase 云端同步。配置后，数据会保存到网络数据库，并通过 Supabase Realtime 自动同步到其他设备和浏览器。

1. 在 Supabase 创建项目。
2. 打开 Supabase SQL Editor，执行 `supabase-schema.sql`。
3. 复制 `.env.example` 为 `.env.local`。
4. 将 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 替换为 Supabase 项目的真实值。
5. 重启开发服务器。

未配置 Supabase 时，应用会回退到当前浏览器的 `LocalStorage`，无法跨设备同步。

## AI gateway

论文解读、翻译、前沿扫描、精读卡片和研究计划依赖 OpenAI-compatible API。

`.env.local` 或 Vercel 环境变量需要配置：

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

## Vercel 部署检查

如果项目已经部署到 Vercel，进入对应 Project 的 Settings → Environment Variables，确认存在：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

更新环境变量后需要重新 Deploy。数据库结构更新后，请再次在 Supabase SQL Editor 执行最新版 `supabase-schema.sql`。

## Security note

当前 Supabase RLS 策略为了个人快速使用，允许匿名读写。若要公开部署或多人使用，建议下一步接入 Supabase Auth，并为 `tasks`、`journals`、`reading_library`、`reader_notes`、`reader_highlights`、`focus_sessions` 增加 `user_id` 字段和按用户隔离的 RLS 策略。

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
