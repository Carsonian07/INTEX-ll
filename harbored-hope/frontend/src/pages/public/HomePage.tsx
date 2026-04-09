import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Each pair: [leftImage, rightImage] with per-image bg-position
// Left images: face toward the right of the panel (near center box)
// Right images: face toward the left of the panel (near center box)
const imagePairs = [
  [
    { src: '/images/hero5.png', position: '50% 15%' }, // girl facing right
    { src: '/images/hero3.jpg', position: '50% 15%' }, // girl facing left
  ],
  [
    { src: '/images/hero1.jpg', position: '50% 12%' }, // girl, upper center
    { src: '/images/hero2.jpg', position: '50% 15%' }, // two girls
  ],
  [
    { src: '/images/hero4.jpg', position: '35% 20%' }, // group, show left faces
    { src: '/images/hero6.jpg', position: '50% 15%' }, // group portrait
  ],
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const advance = useCallback((next: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setPrev(current);
    setCurrent(next);
    setTimeout(() => {
      setPrev(null);
      setTransitioning(false);
    }, 900);
  }, [current, transitioning]);

  useEffect(() => {
    const id = setInterval(() => {
      advance((current + 1) % imagePairs.length);
    }, 5500);
    return () => clearInterval(id);
  }, [current, advance]);

  return (
    <section className="relative h-[520px] md:h-[580px] overflow-hidden bg-hh-navy-dark">
      {/* Image pair layers */}
      {imagePairs.map((pair, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : i === prev ? 0 : 0,
            zIndex: i === current ? 2 : i === prev ? 1 : 0,
            transition: 'opacity 900ms ease-in-out',
          }}
        >
          {/* Left image */}
          <div
            className="absolute top-0 left-0 bottom-0 w-1/2 bg-cover"
            style={{ backgroundImage: `url(${pair[0].src})`, backgroundPosition: pair[0].position }}
          />
          {/* Right image */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1/2 bg-cover"
            style={{ backgroundImage: `url(${pair[1].src})`, backgroundPosition: pair[1].position }}
          />
        </div>
      ))}

      {/* Center overlay — fades edges into center */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 38% 100% at 50% 50%, rgba(18,40,80,0.72) 0%, rgba(18,40,80,0.18) 70%, transparent 100%)' }}
      />

      {/* Caption */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-[11px] font-semibold text-hh-gold uppercase tracking-widest mb-3">Safe homes · Philippines</p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white leading-snug mb-4 drop-shadow-lg">
            Every girl deserves a safe place to heal
          </h1>
          <p className="text-sm text-white/80 leading-relaxed mb-6 drop-shadow">
            Harbored Hope provides shelter, counseling, and education for girls who have survived trafficking and abuse.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="bg-hh-gold text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-yellow-600 transition-colors shadow-lg">
              Support a safehouse
            </Link>
            <Link to="/impact" className="border border-white/70 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              See our impact
            </Link>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {imagePairs.map((_pair, i) => (
          <button
            key={i}
            onClick={() => advance(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero carousel */}
      <HeroCarousel />

      {/* Stats bar */}
      <section className="bg-hh-navy">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {[
            { value: '80%', label: 'Filipino children vulnerable to abuse online' },
            { value: '7 Million+', label: 'Children sexually abused every year in the Philippines' },
            { value: '33%', label: 'Of sexual abuse cases involve incest in the Philippines' },
            { value: '2 in 3', label: 'Child victims do not report abuse due to lack of sex education' },
          ].map(s => (
            <div key={s.label} className="py-5 px-6 text-center">
              <div className="text-2xl font-semibold text-hh-gold">{s.value}</div>
              <div className="text-xs text-white/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How your donation helps */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-2xl font-medium text-hh-navy dark:text-white mb-2">These are not just statistics. These are children. And this must end now.</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Your donations directly support girls across our safehouses</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="#1B3A6B" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              ),
              bg: 'bg-hh-navy-light', label: 'Safe shelter',
              desc: 'Secure housing and 24/7 staff care for every resident in our safehouses.'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="#2E86C1" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              ),
              bg: 'bg-hh-ocean-light', label: 'Counseling',
              desc: 'Structured process recordings and trauma-informed therapy sessions.'
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="#C9961A" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              ),
              bg: 'bg-hh-gold-light', label: 'Education',
              desc: 'Bridge programs, literacy support, and vocational training opportunities.'
            },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-4`}>
                {card.icon}
              </div>
              <h3 className="text-sm font-medium text-hh-navy dark:text-white mb-2">{card.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Donate CTA */}
      <section className="bg-hh-navy-dark py-16 px-4 text-center">
        <h2 className="font-serif text-3xl font-medium text-white mb-3">Be someone's safe harbor</h2>
        <p className="text-sm text-white/70 max-w-md mx-auto mb-8 leading-relaxed">
          Help directly fund shelter, healing, and education for girls in need.
        </p>

        <Link to="/register" className="inline-block bg-hh-gold text-white font-medium px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors">
          Donate
        </Link>
      </section>
    </div>
  );
}
