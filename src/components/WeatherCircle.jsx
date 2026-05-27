import { useMemo } from 'react'
import { memo } from 'react'
import { hm } from '../utils/time'

function WeatherCircle({weather}) {
  const {temp, condition, city, scene='day-clear', cond='clear', tod='afternoon', humidity, windKmh, sunrise, sunset} = weather;

  // Scene → gradient + glow + particle config
  const SCENES = {
    // CLEAR
    'clear-dawn':      { bg:'linear-gradient(160deg,#1a0a0a,#6b2d0a,#c4612a,#e8934a)', glow:'rgba(255,130,60,.4)',  particles:[] },
    'clear-morning':   { bg:'linear-gradient(160deg,#0a1a4a,#1a3a7a,#2a5aaa,#4a8acc)', glow:'rgba(100,170,255,.3)', particles:[] },
    'clear-afternoon': { bg:'linear-gradient(160deg,#0a1855,#1a3080,#2050b8,#4080e0)', glow:'rgba(80,150,255,.3)',  particles:[] },
    'clear-dusk':      { bg:'linear-gradient(160deg,#1a0525,#5a1540,#c04060,#e07030)', glow:'rgba(255,100,80,.4)',  particles:[] },
    'clear-night':     { bg:'linear-gradient(180deg,#020210,#050518,#08082a)',          glow:'rgba(108,99,255,.35)', particles:['stars'] },
    // CLOUD
    'cloud-dawn':      { bg:'linear-gradient(160deg,#1a1208,#3a2a18,#6a4a28,#9a7a58)', glow:'rgba(180,140,80,.2)',  particles:['cloud'] },
    'cloud-morning':   { bg:'linear-gradient(160deg,#0e1820,#1a2a38,#243850)',          glow:'rgba(100,120,160,.2)', particles:['cloud'] },
    'cloud-afternoon': { bg:'linear-gradient(160deg,#0e1420,#1a2030,#202840)',          glow:'rgba(100,110,150,.2)', particles:['cloud'] },
    'cloud-dusk':      { bg:'linear-gradient(160deg,#180d18,#2a1428,#4a2840,#7a4858)', glow:'rgba(180,80,140,.2)',  particles:['cloud'] },
    'cloud-night':     { bg:'linear-gradient(180deg,#060810,#0e1018,#141822)',          glow:'rgba(80,90,130,.15)',  particles:['cloud'] },
    // RAIN
    'rain-dawn':       { bg:'linear-gradient(160deg,#060c10,#0a1520,#101c2c,#182030)', glow:'rgba(60,120,200,.3)',  particles:['rain'] },
    'rain-morning':    { bg:'linear-gradient(160deg,#060e1a,#0d1a2e,#122040)',          glow:'rgba(80,150,255,.3)',  particles:['rain'] },
    'rain-afternoon':  { bg:'linear-gradient(160deg,#080e18,#101828,#182030)',          glow:'rgba(60,120,200,.25)', particles:['rain'] },
    'rain-dusk':       { bg:'linear-gradient(160deg,#0a0810,#180f1a,#201420)',          glow:'rgba(100,80,150,.3)',  particles:['rain'] },
    'rain-night':      { bg:'linear-gradient(160deg,#040408,#080810,#0c0c16)',          glow:'rgba(60,80,160,.2)',   particles:['rain'] },
    // STORM
    'storm-dawn':      { bg:'linear-gradient(160deg,#040408,#08080e,#0c0c14)',          glow:'rgba(200,200,60,.25)', particles:['rain','lightning'] },
    'storm-morning':   { bg:'linear-gradient(160deg,#040408,#080c18,#0c1022)',          glow:'rgba(220,220,80,.2)',  particles:['rain','lightning'] },
    'storm-afternoon': { bg:'linear-gradient(160deg,#040408,#080c18,#0c1022)',          glow:'rgba(220,220,80,.2)',  particles:['rain','lightning'] },
    'storm-dusk':      { bg:'linear-gradient(160deg,#060404,#100808,#180c0c)',          glow:'rgba(220,100,60,.2)',  particles:['rain','lightning'] },
    'storm-night':     { bg:'linear-gradient(160deg,#020202,#050508,#08080c)',          glow:'rgba(180,180,60,.2)',  particles:['rain','lightning'] },
    // FOG
    'fog-dawn':        { bg:'linear-gradient(160deg,#1a1610,#2a2618,#3a3628)',          glow:'rgba(200,190,160,.15)',particles:['fog'] },
    'fog-morning':     { bg:'linear-gradient(160deg,#101018,#181820,#202030)',          glow:'rgba(180,180,200,.12)',particles:['fog'] },
    'fog-afternoon':   { bg:'linear-gradient(160deg,#10101a,#181828,#202038)',          glow:'rgba(180,180,220,.1)', particles:['fog'] },
    'fog-dusk':        { bg:'linear-gradient(160deg,#181010,#281818,#302020)',          glow:'rgba(200,160,140,.12)',particles:['fog'] },
    'fog-night':       { bg:'linear-gradient(160deg,#080810,#101018,#181820)',          glow:'rgba(140,140,180,.1)', particles:['fog'] },
    // SNOW
    'snow-dawn':       { bg:'linear-gradient(160deg,#0c1420,#182034,#202844)',          glow:'rgba(180,210,255,.2)', particles:['snow'] },
    'snow-morning':    { bg:'linear-gradient(160deg,#0d1525,#1a2540,#203060)',          glow:'rgba(200,220,255,.25)',particles:['snow'] },
    'snow-afternoon':  { bg:'linear-gradient(160deg,#0c1428,#182040,#203055)',          glow:'rgba(180,210,255,.2)', particles:['snow'] },
    'snow-dusk':       { bg:'linear-gradient(160deg,#100c18,#201828,#282038)',          glow:'rgba(180,180,220,.2)', particles:['snow'] },
    'snow-night':      { bg:'linear-gradient(160deg,#050510,#0a0a1a,#0e0e22)',          glow:'rgba(140,160,220,.2)', particles:['snow','stars'] },
  };

  const s = SCENES[scene] || SCENES['clear-afternoon'];
  const now = new Date(), timeStr = hm(now);
  const dateStr = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})

  // Memoize random positions for particles so they don't shift on re-render
  const rainDrops = useMemo(() => Array.from({length:24},()=>({
    l: Math.random()*100,
    h: 8+Math.random()*14,
    dur: .3+Math.random()*.35,
    del: Math.random()*1.2,
    op: .45+Math.random()*.55,
  })),[scene]);
  const snowFlakes = useMemo(() => Array.from({length:16},()=>({
    l: Math.random()*100,
    sz: 7+Math.random()*6,
    dur: 2.5+Math.random()*2.5,
    del: Math.random()*2.5,
  })),[scene]);
  const stars = useMemo(() => Array.from({length:24},()=>({
    l: Math.random()*100, t: Math.random()*100,
    op: Math.random()*.7+.15,
    dur: 2+Math.random()*3, del: Math.random()*4,
  })),[scene]);

  const hasRain  = s.particles.includes('rain');
  const hasStorm = s.particles.includes('lightning');
  const hasSnow  = s.particles.includes('snow');
  const hasStars = s.particles.includes('stars');
  const hasCloud = s.particles.includes('cloud');
  const hasFog   = s.particles.includes('fog');
  const isSun    = cond==='clear' && (tod==='morning'||tod==='afternoon');
  const isDawnScene = cond==='clear' && (tod==='dawn'||tod==='dusk');

  // ── Continuous temperature wash ─────────────────────────────────────────────
  // Maps the EXACT temperature to a hue + intensity, interpolated smoothly
  // (no discrete bands). Laid OVER the scene gradient via screen blend, so a
  // 19°C and a 21°C day differ slightly, and 5°C vs 38°C differ a lot.
  // Anchor: -10°C → icy blue (hue 210), 20°C → neutral (no wash), 42°C → hot red (hue 8).
  const tNum = typeof temp === 'number' ? temp : parseFloat(temp);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let tempWash = null, tempFrom = '50% 0%'; // wash origin: top for cold, bottom for warm
  if (Number.isFinite(tNum)) {
    const NEUTRAL = 20;          // °C considered "neutral" — no tint
    const d = tNum - NEUTRAL;    // negative = cold, positive = warm
    if (Math.abs(d) >= 1.5) {    // tiny dead-zone so ~20°C stays clean
      let hue, sat, light, intensity;
      if (d < 0) {
        // Cold side: 20°C → 0°C → -10°C maps toward icy blue, glow from the top.
        const k = clamp(-d / 30, 0, 1);          // 0 at 20°C, 1 at -10°C
        hue = 200 + 18 * k;                       // 200 → 218 (blue → cyan-blue)
        sat = 70 + 25 * k;                        // 70% → 95%
        light = 72 - 7 * k;                       // 72% → 65%
        intensity = clamp(0.10 + 0.26 * k, 0, 0.36);
        tempFrom = '50% 0%';
      } else {
        // Warm side: 20°C → 32°C → 42°C maps toward hot orange-red, glow from bottom.
        const k = clamp(d / 22, 0, 1);            // 0 at 20°C, 1 at 42°C
        hue = 42 - 36 * k;                        // 42 → 6 (amber → red-orange)
        sat = 80 + 20 * k;                        // 80% → 100%
        light = 60 - 6 * k;                       // 60% → 54%
        intensity = clamp(0.12 + 0.28 * k, 0, 0.40);
        tempFrom = '50% 100%';
      }
      const col = `hsla(${hue.toFixed(0)},${sat.toFixed(0)}%,${light.toFixed(0)}%,${intensity.toFixed(3)})`;
      tempWash = `radial-gradient(ellipse at ${tempFrom},${col} 0%,transparent 70%)`;
    }
  }

  return (
    <div style={{width:240,height:240,borderRadius:'50%',position:'relative',overflow:'hidden',border:'2px solid rgba(255,255,255,.1)',boxShadow:'0 0 60px '+s.glow+',inset 0 0 40px rgba(0,0,0,.5)',flexShrink:0,transition:'box-shadow 1.8s ease'}}>
      {/* Background — CSS transition handles fade */}
      <div style={{position:'absolute',inset:0,zIndex:0,background:s.bg,transition:'background 2s ease',animation:'weatherFadeIn .8s ease'}}/>

      {/* Temperature wash — hue + intensity interpolate continuously with exact temp */}
      {tempWash&&(
        <div style={{position:'absolute',inset:0,zIndex:0,background:tempWash,transition:'background 2s ease,opacity 2s ease',animation:'tempWashPulse 5s ease-in-out infinite',mixBlendMode:'screen',pointerEvents:'none'}}/>
      )}

      {/* Rain drops */}
      {hasRain&&rainDrops.map((d,i)=>(
        <div key={i} style={{position:'absolute',left:d.l+'%',width:1.5,height:d.h+'px',background:'linear-gradient(to bottom,transparent,rgba(160,210,255,.8))',borderRadius:2,animation:'rainFall '+d.dur+'s '+d.del+'s linear infinite',zIndex:1,opacity:d.op,pointerEvents:'none'}}/>
      ))}

      {/* Lightning */}
      {hasStorm&&<div style={{position:'absolute',inset:0,zIndex:2,background:'rgba(255,255,200,.06)',animation:'lightningFlash 4s 1.5s infinite',pointerEvents:'none'}}/>}

      {/* Sun glow */}
      {isSun&&<div style={{position:'absolute',inset:0,zIndex:1,background:'radial-gradient(circle at 65% 22%,rgba(255,220,80,.22) 0%,transparent 55%)',animation:'sunPulse 3s ease-in-out infinite',pointerEvents:'none'}}/>}

      {/* Sunrise / sunset warm glow */}
      {isDawnScene&&<div style={{position:'absolute',inset:0,zIndex:1,background:'radial-gradient(ellipse at 50% 110%,rgba(255,140,40,.4) 0%,transparent 65%)',animation:'sunsetGlow 4s ease-in-out infinite',pointerEvents:'none'}}/>}

      {/* Cloud layer */}
      {hasCloud&&<div style={{position:'absolute',inset:0,zIndex:1,background:'radial-gradient(ellipse at 42% 32%,rgba(160,170,210,.14) 0%,transparent 62%)',animation:'cloudDrift 9s ease-in-out infinite',pointerEvents:'none'}}/>}

      {/* Fog */}
      {hasFog&&<div style={{position:'absolute',inset:0,zIndex:1,background:'radial-gradient(ellipse at 50% 50%,rgba(200,205,220,.12) 0%,transparent 70%)',animation:'fogPulse 7s ease-in-out infinite',pointerEvents:'none'}}/>}

      {/* Stars */}
      {hasStars&&stars.map((s2,i)=>(
        <div key={i} style={{position:'absolute',width:2,height:2,borderRadius:'50%',background:'#fff',left:s2.l+'%',top:s2.t+'%',opacity:s2.op,zIndex:1,animation:'starTwinkle '+s2.dur+'s '+s2.del+'s ease-in-out infinite',pointerEvents:'none'}}/>
      ))}

      {/* Snow flakes */}
      {hasSnow&&snowFlakes.map((f,i)=>(
        <div key={i} style={{position:'absolute',left:f.l+'%',fontSize:f.sz+'px',color:'rgba(255,255,255,.85)',animation:'snowDrift '+f.dur+'s '+f.del+'s linear infinite',zIndex:1,pointerEvents:'none',userSelect:'none'}}>❄</div>
      ))}

      {/* Moon for night clear */}
      {cond==='clear'&&tod==='night'&&(
        <div style={{position:'absolute',right:'18%',top:'15%',width:36,height:36,borderRadius:'50%',background:'radial-gradient(circle at 38% 38%,#e8e0c8,#c8c0a0)',zIndex:2,animation:'moonGlow 4s ease-in-out infinite',boxShadow:'0 0 18px 6px rgba(200,210,240,.2)',pointerEvents:'none'}}/>
      )}

      {/* Content */}
      <div style={{position:'relative',zIndex:3,width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:20,textShadow:'0 2px 14px rgba(0,0,0,.8)'}}>
        <div style={{fontSize:28,marginBottom:3}}>{condition.i}</div>
        <div style={{fontSize:48,fontWeight:300,letterSpacing:-2,lineHeight:1}}>{temp !== '--' ? temp+'°C' : '--°C'}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:5,letterSpacing:.3}}>{condition.l}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.6)',marginTop:2,letterSpacing:.3}}>{city}</div>
        <div style={{fontSize:20,fontWeight:600,color:'rgba(255,255,255,.95)',marginTop:7,fontFamily:'var(--mo)',letterSpacing:1}}>{timeStr}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,.48)',fontFamily:'var(--mo)',marginTop:3,letterSpacing:.5}}>{dateStr}</div>
        {humidity!==undefined&&<div style={{fontSize:9,color:'rgba(255,255,255,.38)',fontFamily:'var(--mo)',marginTop:4,letterSpacing:.3}}>💧{humidity}% · 💨{windKmh}km/h · ☀️{sunrise}–{sunset}</div>}
      </div>
    </div>
  );
}

// ── CONFIRM DELETE POPUP ─────────────────────────────────────────────────────

export default memo(WeatherCircle)
