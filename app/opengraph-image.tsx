import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #f7f9fb 0%, #eef2f7 55%, #e5e9f0 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Three-dot brandmark */}
        <div style={{ display: 'flex', marginBottom: '18px' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 96,
              background: '#64708f',
              opacity: 0.9,
            }}
          />
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 96,
              background: '#3cc0e2',
              opacity: 0.9,
              marginLeft: -22,
            }}
          />
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 96,
              background: '#f2d94a',
              opacity: 0.92,
              marginLeft: -22,
            }}
          />
        </div>

        <div style={{ display: 'flex', fontSize: 132, fontWeight: 700, color: '#2f3547' }}>
          Maitra
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            letterSpacing: 16,
            color: '#6f8398',
            marginTop: 4,
          }}
        >
          JEWELLERY
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: '#515c78',
            marginTop: 34,
            maxWidth: 900,
            textAlign: 'center',
          }}
        >
          Budget-Friendly Premium Handcrafted Jewellery
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            color: '#8a9db2',
            marginTop: 14,
          }}
        >
          Necklaces · Kemp · Palakka · Temple · American Diamond · Micro Gold
        </div>
      </div>
    ),
    { ...size }
  );
}
