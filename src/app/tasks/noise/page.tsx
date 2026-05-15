'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CloudRain, Trees, Wind, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NOISE_DB = {
  雨声: 'https://assets.mixkit.co/active_storage/sfx/2418/2418-preview.mp3',
  森林: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3',
  冥想: 'https://assets.mixkit.co/active_storage/sfx/1075/1075-preview.mp3',
};

const NoisePage = () => {
  const [current, setCurrent] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (type: string) => {
    if (current === type) {
      audioRef.current?.pause();
      setCurrent(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(NOISE_DB[type as keyof typeof NOISE_DB]);
    audio.loop = true;
    audio.play();
    audioRef.current = audio;
    setCurrent(type);
  };

  return (
    <div className="noise-page glass-card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', borderRadius: '24px' }}>
      <Link href="/tasks" className="back-link" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <ArrowLeft size={20} /> 返回任务管理
      </Link>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>专注音效库</h1>
      <p>点击下方按钮即可播放对应的白噪音，帮助您进入专注状态。</p>
      <div className="noise-grid" style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => play('雨声')} className={current === '雨声' ? 'active' : ''} style={buttonStyle}>
          <CloudRain size={20} /> 舒适雨声
        </button>
        <button onClick={() => play('森林')} className={current === '森林' ? 'active' : ''} style={buttonStyle}>
          <Trees size={20} /> 森林环境
        </button>
        <button onClick={() => play('冥想')} className={current === '冥想' ? 'active' : ''} style={buttonStyle}>
          <Wind size={20} /> 空灵冥想
        </button>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  border: '2px solid #f4f4f5',
  background: '#fff',
  padding: '1.25rem',
  borderRadius: '18px',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#52525b',
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export default NoisePage;
