// @ts-nocheck
import "./style.css"
import { loadLiveChannels } from "./lib/supabase"

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

type Channel = { name: string; title: string; game: string; viewers: string; image: string; avatar: string; tag: string }

let channels: Channel[] = [
  { name: 'pixelpilot', title: 'late night ranked until we hit the next level ✨', game: 'VALORANT', viewers: '8.4K', image: 'photo-1542751371-adc38448a05e', avatar: 'photo-1535713875002-d1d0cf377fde', tag: 'FPS' },
  { name: 'mira.wav', title: 'making a cozy little world, come hang 🌿', game: 'Minecraft', viewers: '2.1K', image: 'photo-1603481546238-487240415921', avatar: 'photo-1534528741775-53994a69daeb', tag: 'Cozy' },
  { name: 'thebside', title: 'new season, new chaos | first playthrough', game: 'Apex Legends', viewers: '14.7K', image: 'photo-1547394765-185e1e68f34e', avatar: 'photo-1500648767791-00dcc994a43e', tag: 'FPS' },
  { name: 'ninaonair', title: 'your favorite songs, your requests 🎧', game: 'Music', viewers: '945', image: 'photo-1516280440614-37939bbacd81', avatar: 'photo-1524504388940-b1c1722653e1', tag: 'Music' },
  { name: 'cookwithkai', title: 'crispy chilli oil noodles from scratch 🍜', game: 'Just Chatting', viewers: '3.6K', image: 'photo-1556911220-e15b29be8c8f', avatar: 'photo-1506794778202-cad84cf45f1d', tag: 'IRL' },
  { name: 'orbitals', title: 'the climb to immortal starts NOW', game: 'VALORANT', viewers: '6.2K', image: 'photo-1542751371-adc38448a05e', avatar: 'photo-1535713875002-d1d0cf377fde', tag: 'FPS' },
]

const categories = [
  { name: 'Just Chatting', viewers: '218K viewers', image: 'photo-1528605248644-14dd04022da1', color: '#e6a36e' },
  { name: 'VALORANT', viewers: '96K viewers', image: 'photo-1542751371-adc38448a05e', color: '#e75b5b' },
  { name: 'Minecraft', viewers: '74K viewers', image: 'photo-1603481546238-487240415921', color: '#75b985' },
  { name: 'Music', viewers: '31K viewers', image: 'photo-1516280440614-37939bbacd81', color: '#9a81df' },
  { name: 'Apex Legends', viewers: '28K viewers', image: 'photo-1547394765-185e1e68f34e', color: '#e77b4c' },
  { name: 'Art', viewers: '12K viewers', image: 'photo-1513364776144-60967b0f800f', color: '#4b9d9b' },
]

const followedStorageKey = 'kaltv_followed_channels'
const followerCountStorageKey = 'kaltv_follower_counts'
const defaultFollowerCounts: Record<string, number> = { pixelpilot: 12400, 'mira.wav': 8300, thebside: 28700, ninaonair: 5100, cookwithkai: 6900, orbitals: 4100 }
const readStorage = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback }
}
let followedChannels = new Set<string>(readStorage<string[]>(followedStorageKey, []))
let followerCounts = { ...defaultFollowerCounts, ...readStorage<Record<string, number>>(followerCountStorageKey, {}) }
function getFollowerCount(name: string) { return followerCounts[name] ?? 0 }
function formatCount(count: number) { return count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}K` : count.toLocaleString() }
function saveFollowState() {
  localStorage.setItem(followedStorageKey, JSON.stringify([...followedChannels]))
  localStorage.setItem(followerCountStorageKey, JSON.stringify(followerCounts))
}
function updateFollowButton(button: HTMLButtonElement, name: string, following: boolean) {
  button.classList.toggle('is-following', following)
  button.innerHTML = following ? '♥' : icon('heart')
  button.setAttribute('aria-label', following ? `Unfollow ${name}` : `Follow ${name}`)
  button.setAttribute('aria-pressed', String(following))
  button.setAttribute('title', following ? 'Following' : 'Follow channel')
  const count = document.querySelector<HTMLElement>(`[data-follower-count="${name}"]`)
  if (count) count.textContent = `${formatCount(getFollowerCount(name))} followers`
}

const photo = (id: string, width = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const icon = (name: string) => {
  const paths: Record<string, string> = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] ?? ''}</svg>`
}

const channelCard = (channel: Channel) => `
  <article class="stream-card" data-search="${channel.name} ${channel.title} ${channel.game}" data-tag="${channel.tag}">
      <button class="thumbnail" data-channel="${channel.name}" aria-label="Watch ${channel.name}">
      <img src="${photo(channel.image, 720)}" alt="Live ${channel.game} stream" loading="lazy">
      <span class="live-pill"><i></i> LIVE</span><span class="viewer-count">${channel.viewers} watching</span>
      <span class="play-overlay">▶</span>
    </button>
    <div class="stream-info"><img class="avatar" src="${photo(channel.avatar, 100)}" alt="${channel.name}">
      <div class="stream-copy"><h3>${channel.title}</h3><p>${channel.name}</p><p class="game-name">${channel.game}</p><p class="follower-count" data-follower-count="${channel.name}">${formatCount(getFollowerCount(channel.name))} followers</p><div class="tags"><span>${channel.tag}</span><span>English</span></div><button class="creator-message" data-creator-message="${channel.name}" type="button">Message creator</button></div>
      <button class="follow${followedChannels.has(channel.name) ? ' is-following' : ''}" aria-label="${followedChannels.has(channel.name) ? `Unfollow ${channel.name}` : `Follow ${channel.name}`}" aria-pressed="${followedChannels.has(channel.name)}" title="${followedChannels.has(channel.name) ? 'Following' : 'Follow channel'}">${followedChannels.has(channel.name) ? '♥' : icon('heart')}</button>
    </div>
  </article>`

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<a class="skip-link" href="#discover">Skip to main content</a>
<header class="topbar">
  <a class="brand" href="#home" aria-label="KalTV home"><span class="brand-mark">K</span><span>kal<span>tv</span></span></a>
  <nav class="main-nav"><a class="active" href="#discover">Discover</a><a href="#categories">Categories</a><a href="#reels">Reels</a><a href="#chat">Chat</a><a href="#gifts">Gifts</a><a href="#music">Music</a></nav>
  <label class="search-box">${icon('search')}<input id="search" placeholder="Search streams, games, creators…" autocomplete="off"><kbd>⌘ K</kbd></label>
  <div class="top-actions"><button class="icon-button mobile-search" aria-label="Search">${icon('search')}</button><button class="icon-button" aria-label="Notifications">${icon('bell')}<i class="notification-dot"></i></button><button class="login" id="login-button">Log in</button><button class="stream-button" id="go-live-button">Go live <span>●</span></button><button class="signup" id="signup-button">Join KalTV <span>↗</span></button><button class="mobile-menu" id="hamburger-btn" aria-label="Open navigation" aria-expanded="false" type="button">${icon('menu')}</button></div>
</header>
<div class="mobile-nav-backdrop" id="mobile-nav-backdrop" hidden></div>
<nav class="mobile-nav" id="mobile-menu" aria-label="Mobile navigation" hidden><div class="mobile-nav-head"><b>Explore KalTV</b><button class="icon-button" id="mobile-nav-close" aria-label="Close navigation" type="button">×</button></div><button class="mobile-nav-item mobile-nav-action" id="mobile-go-live" type="button">Go Live <span>●</span></button><a class="mobile-nav-item" href="#home">Dashboard</a><button class="mobile-nav-item mobile-nav-action" id="mobile-settings" type="button">Settings <span>⚙</span></button><div class="mobile-nav-divider"></div><a href="#discover">Discover</a><a href="#categories">Categories</a><a href="#reels">Reels</a><a href="#chat">Chat</a><a href="#gifts">Gifts</a><a href="#music">Music</a><div class="mobile-nav-divider"></div><a href="#live">Live now <span class="live-dot"></span></a></nav>
<div class="app-shell">
  <aside class="sidebar"><div class="side-label">YOUR SPACE <button class="collapse" aria-label="Collapse sidebar">‹</button></div>
    <a class="side-link selected" href="#discover">${icon('home')}<span>Discover</span></a><a class="side-link" href="#live">${icon('heart')}<span>Following</span></a>
    <div class="side-heading">LIVE CHANNELS <span class="live-dot"></span></div>
    <div class="followed-list"><button class="followed"><img src="${photo('photo-1535713875002-d1d0cf377fde', 80)}"><span><b>pixelpilot</b><small>VALORANT</small></span><em>8.4K</em></button><button class="followed"><img src="${photo('photo-1534528741775-53994a69daeb', 80)}"><span><b>mira.wav</b><small>Minecraft</small></span><em>2.1K</em></button><button class="followed"><img src="${photo('photo-1500648767791-00dcc994a43e', 80)}"><span><b>thebside</b><small>Apex Legends</small></span><em>14.7K</em></button><button class="followed"><img src="${photo('photo-1524504388940-b1c1722653e1', 80)}"><span><b>ninaonair</b><small>Music</small></span><em>945</em></button></div>
    <div class="sidebar-bottom"><button class="sidebar-go-live go-live-trigger" type="button">🎥 Go Live Now</button><div class="community-card"><div class="sparkle">✳</div><b>Find your people.</b><p>Follow creators and never miss a moment.</p><button class="signup">Explore creators <span>↗</span></button></div><span>© 2025 KalTV <a href="#about">About</a> <a href="#guidelines">Guidelines</a></span></div>
  </aside>
  <main id="home" class="content"><section class="welcome" id="discover"><div><div class="eyebrow"><span class="live-dot"></span> THE INTERNET, LIVE</div><h1>Find your <span>next</span><br>favorite stream.</h1><p>Big moments, cozy corners, and everything in between.<br>There’s a place for you here.</p><div class="welcome-actions"><a class="primary-cta" href="#live">Explore live streams <span>↘</span></a><a class="text-cta" href="#categories">Browse categories</a></div></div><div class="hero-art"><div class="hero-glow"></div><img class="hero-photo" src="${photo('photo-1535223289827-42f1e9919769', 850)}" alt="Colorful live creator setup"><div class="hero-live"><span class="live-pill"><i></i> LIVE NOW</span><b>studioafterdark</b><small>Just Chatting · 12.8K watching</small></div><div class="floating-note">✦ &nbsp; good vibes only</div></div><div class="hero-index">01 <span>—</span> 06</div></section><button class="go-live-cta go-live-trigger" id="big-go-live" type="button"><span>🎥 Go Live Now</span><small>Start streaming on KalTV</small></button>
    <section class="category-section" id="categories"><div class="section-head"><div><div class="eyebrow">A LITTLE BIT OF EVERYTHING</div><h2>Explore categories <span class="heading-arrow">↗</span></h2></div><a href="#all-categories">All categories <span>→</span></a></div><div class="category-row">${categories.map(c => `<button class="category-card" data-category="${c.name}"><div class="category-image" style="--tint:${c.color}"><img src="${photo(c.image, 450)}" alt="${c.name}" loading="lazy"><span>↗</span></div><b>${c.name}</b><small>${c.viewers}</small></button>`).join('')}</div></section>
    <section class="live-section" id="live"><div class="section-head live-head"><div><div class="eyebrow"><span class="live-dot"></span> HAPPENING RIGHT NOW</div><h2>Live for you <span class="live-pill"><i></i> LIVE</span></h2></div><div class="filter-tabs"><button class="filter active" data-filter="All">For you</button><button class="filter" data-filter="FPS">FPS</button><button class="filter" data-filter="Cozy">Cozy</button><button class="filter" data-filter="IRL">IRL</button></div></div><div class="stream-grid" id="stream-grid">${channels.slice(0, 4).map(channelCard).join('')}</div><div class="empty-state" hidden>No streams found. Try another search.</div><button class="load-more" id="load-more">Show me more streams <span>↓</span></button><div class="gift-panel"><div class="gift-panel-title"><div><div class="eyebrow">MAKE THEIR MOMENT</div><h3>Send a gift while they’re live <span>✦</span></h3></div><span class="coin-balance">◈ 1,240 coins</span></div><div class="gift-row"><button class="gift-card" data-gift="Tiny Star" data-price="10"><span>⭐</span><b>Tiny Star</b><small>10 coins</small></button><button class="gift-card" data-gift="Sparkle" data-price="25"><span>✨</span><b>Sparkle</b><small>25 coins</small></button><button class="gift-card" data-gift="Heart" data-price="50"><span>💖</span><b>Heart</b><small>50 coins</small></button><button class="gift-card" data-gift="Party Popper" data-price="75"><span>🎉</span><b>Party Popper</b><small>75 coins</small></button><button class="gift-card" data-gift="Crown" data-price="150"><span>👑</span><b>Crown</b><small>150 coins</small></button><button class="gift-card" data-gift="Rocket" data-price="300"><span>🚀</span><b>Rocket</b><small>300 coins</small></button><button class="gift-card" data-gift="Fireworks" data-price="500"><span>🎆</span><b>Fireworks</b><small>500 coins</small></button><button class="gift-card" data-gift="Diamond" data-price="1000"><span>💎</span><b>Diamond</b><small>1,000 coins</small></button></div></div></section>
    <section class="feature-section" id="reels"><div class="section-head"><div><div class="eyebrow">QUICK MOMENTS</div><h2>KalTV Reels <span class="heading-arrow">↗</span></h2></div><button class="outline-button" id="create-reel">+ Create reel</button></div><div class="reel-row"><article class="reel-card reel-one"><div class="reel-overlay"><span class="live-pill">TRENDING</span><b>That clutch was unreal 😳</b><small>@pixelpilot · 42K views</small></div></article><article class="reel-card reel-two"><div class="reel-overlay"><span class="live-pill">NEW</span><b>Cozy build tour 🌿</b><small>@mira.wav · 18K views</small></div></article><article class="reel-card reel-three"><div class="reel-overlay"><span class="live-pill">FEATURED</span><b>Late night studio vibes</b><small>@ninaonair · 9.4K views</small></div></article></div></section>
    <section class="feature-section" id="chat"><div class="section-head"><div><div class="eyebrow">STAY CONNECTED</div><h2>Chat & calls</h2></div><span class="online-label"><i></i> 6 friends online</span></div><div class="chat-grid"><div class="chat-card"><div class="chat-card-head"><img src="${photo('photo-1535713875002-d1d0cf377fde', 100)}"><div><b>pixelpilot</b><small>Online now · watching VALORANT</small></div><span class="online-dot"></span></div><div class="chat-actions"><button class="call-button" data-call="voice">☎ <span>Voice call</span></button><button class="call-button video" data-call="video">▣ <span>Video chat</span></button><button class="chat-button" data-chat="pixelpilot">Open chat →</button></div></div><div class="chat-card group-card"><div class="group-avatars"><img src="${photo('photo-1534528741775-53994a69daeb', 70)}"><img src="${photo('photo-1500648767791-00dcc994a43e', 70)}"><img src="${photo('photo-1524504388940-b1c1722653e1', 70)}"><span>+8</span></div><div><b>Late Night Crew</b><small>12 members · 4 online</small></div><button class="chat-button" data-chat="Late Night Crew">Open group →</button></div></div></section>
    <section class="feature-section" id="gifts"><div class="section-head"><div><div class="eyebrow">CELEBRATE LIVE MOMENTS</div><h2>Send a gift <span class="heading-arrow">✦</span></h2></div><span class="gift-balance">✦ 1,240 coins</span></div><div class="gift-panel"><div class="gift-recipient"><img src="${photo('photo-1535713875002-d1d0cf377fde', 100)}"><div><b>Send to pixelpilot</b><small>Live now · 8.4K watching</small></div><button class="chat-button" id="change-recipient">Change</button></div><div class="gift-grid"><button class="gift-item" data-gift="Tiny Star" data-cost="10"><span>⭐</span><b>Tiny Star</b><small>10 coins</small></button><button class="gift-item" data-gift="Sparkle" data-cost="25"><span>✨</span><b>Sparkle</b><small>25 coins</small></button><button class="gift-item" data-gift="Party Popper" data-cost="75"><span>🎉</span><b>Party Popper</b><small>75 coins</small></button><button class="gift-item" data-gift="Heart" data-cost="100"><span>💖</span><b>Heart</b><small>100 coins</small></button><button class="gift-item" data-gift="Golden Crown" data-cost="250"><span>👑</span><b>Golden Crown</b><small>250 coins</small></button><button class="gift-item" data-gift="Hype Rocket" data-cost="500"><span>🚀</span><b>Hype Rocket</b><small>500 coins</small></button><button class="gift-item" data-gift="Galaxy Heart" data-cost="1000"><span>💎</span><b>Galaxy Heart</b><small>1,000 coins</small></button><button class="gift-item" data-gift="Legendary Crown" data-cost="2500"><span>🏆</span><b>Legendary Crown</b><small>2,500 coins</small></button></div><button class="buy-coins" id="buy-coins">+ Buy more coins</button></div></section>
    <section class="feature-section" id="music"><div class="section-head"><div><div class="eyebrow">YOUR SOUNDTRACK</div><h2>Music library</h2></div><div class="music-actions"><label class="upload-button">↑ Upload music<input id="music-upload" type="file" accept="audio/*" multiple></label><button class="outline-button" id="download-mix">↓ Download mix</button></div></div><div class="music-panel"><div class="now-playing"><div class="album-art">♫</div><div><span class="eyebrow">NOW PLAYING</span><b>Midnight Signals</b><small>KalTV Radio · 03:42</small></div><button class="play-button" id="play-music">▶</button></div><div class="track-list"><div><span>01</span><b>Midnight Signals</b><small>KalTV Radio</small><em>03:42</em><button class="track-download">↓</button></div><div><span>02</span><b>Soft Reset</b><small>mira.wav</small><em>02:58</em><button class="track-download">↓</button></div><div><span>03</span><b>Afterglow FM</b><small>ninaonair</small><em>04:16</em><button class="track-download">↓</button></div></div></div></section>
    <footer><a class="brand footer-brand" href="#home"><span class="brand-mark">K</span><span>kal<span>tv</span></span></a><span>Made for the moments you share.</span><div><a href="#about">About</a><a href="#safety">Safety</a><a href="#terms">Terms</a></div></footer>
  </main>
</div>
<div class="toast" role="status"></div><div class="auth-backdrop" id="auth-backdrop" hidden><form class="auth-modal" id="auth-form"><button class="auth-close" type="button" id="auth-close" aria-label="Close">×</button><div class="eyebrow">WELCOME TO KALTV</div><h2 id="auth-title">Join the community</h2><p id="auth-copy">Create your free profile to follow creators and join the conversation.</p><label>Display name<input id="auth-name" required placeholder="Your creator name"></label><label>Email<input id="auth-email" required type="email" placeholder="you@example.com"></label><label>Password<input id="auth-password" required type="password" minlength="6" placeholder="At least 6 characters"></label><button class="signup auth-submit" type="submit" id="auth-submit">Create account <span>↗</span></button><button class="auth-switch" type="button" id="auth-switch">Already have an account? Log in</button></form></div>`

document.querySelector('#login-button')?.setAttribute('id', 'login-btn')
document.querySelector('#go-live-button')?.remove()
document.querySelector('#mobile-nav-backdrop')?.setAttribute('id', 'mobile-backdrop')
document.querySelector('#mobile-go-live')?.remove()
document.querySelector('.sidebar-go-live')?.remove()
const goLiveCta = document.querySelector<HTMLButtonElement>('#big-go-live, #small-go-live')
goLiveCta?.setAttribute('id', 'big-go-live')
const musicSection = document.querySelector<HTMLElement>('#music')
if (goLiveCta && musicSection) {
  const goLiveBottom = document.createElement('section')
  goLiveBottom.id = 'go-live-bottom'
  goLiveBottom.style.cssText = 'padding:16px;display:flex;justify-content:center;'
  goLiveCta.style.cssText = 'width:100%;background:#eaff00;color:#000;height:88px;padding:0 20px;font-size:26px;font-weight:900;border-radius:18px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 0 25px rgba(234,255,0,0.6);'
  goLiveCta.innerHTML = 'Go Live Now 🎥'
  goLiveBottom.append(goLiveCta)
  document.querySelector<HTMLElement>('main.content')?.append(goLiveBottom)
}

const grid = document.querySelector<HTMLDivElement>('#stream-grid')!
let activeFilter = 'All'
let expanded = false
const search = document.querySelector<HTMLInputElement>('#search')!
function renderStreams() {
  const query = search.value.trim().toLowerCase()
  const shown = (expanded ? channels : channels.slice(0, 4)).filter(channel => (activeFilter === 'All' || channel.tag === activeFilter) && `${channel.name} ${channel.title} ${channel.game}`.toLowerCase().includes(query))
  grid.innerHTML = shown.map(channelCard).join('')
  document.querySelector<HTMLElement>('.empty-state')!.hidden = shown.length > 0
  grid.querySelectorAll<HTMLButtonElement>('[data-creator-message]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation()
    openCreatorChat(button.dataset.creatorMessage ?? 'creator')
  }))
  grid.querySelectorAll<HTMLButtonElement>('.follow').forEach(button => button.addEventListener('click', () => {
    const name = button.closest<HTMLElement>('.stream-card')?.querySelector<HTMLElement>('[data-follower-count]')?.dataset.followerCount
    if (!name) return
    const followed = !followedChannels.has(name)
    followed ? followedChannels.add(name) : followedChannels.delete(name)
    followerCounts[name] = Math.max(0, getFollowerCount(name) + (followed ? 1 : -1))
    saveFollowState()
    button.innerHTML = followed ? '♥' : icon('heart')
    button.setAttribute('aria-label', followed ? `Unfollow ${name}` : `Follow ${name}`)
    button.setAttribute('aria-pressed', String(followed))
    button.setAttribute('title', followed ? 'Following' : 'Follow channel')
    document.querySelector<HTMLElement>(`[data-follower-count="${name}"]`)!.textContent = `${formatCount(getFollowerCount(name))} followers`
    showToast(followed ? 'You’re following this creator ✨' : 'Unfollowed creator')
  }))
  grid.querySelectorAll<HTMLButtonElement>('.thumbnail').forEach(button => button.addEventListener('click', () => showToast('Stream preview is coming soon 👀')))
  grid.querySelectorAll<HTMLButtonElement>('[data-creator-message]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation()
    openCreatorChat(button.dataset.creatorMessage ?? 'creator')
  }))
  grid.querySelectorAll<HTMLButtonElement>('.thumbnail').forEach(button => button.addEventListener('click', () => { const channel = channels.find(item => item.name === button.dataset.channel); if (channel) openChannel(channel) }))
}
let toastTimer: number
function showToast(message: string) { const toast = document.querySelector<HTMLElement>('.toast')!; toast.textContent = message; toast.classList.add('visible'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2400) }
search.addEventListener('input', renderStreams)
void loadLiveChannels().then(remoteChannels => {
  if (remoteChannels.length > 0) {
    channels = remoteChannels
    renderStreams()
  }
})
document.querySelectorAll<HTMLButtonElement>('.filter').forEach(button => button.addEventListener('click', () => { document.querySelector('.filter.active')?.classList.remove('active'); button.classList.add('active'); activeFilter = button.dataset.filter ?? 'All'; renderStreams() }))
document.querySelectorAll<HTMLButtonElement>('.category-card').forEach(button => button.addEventListener('click', () => { search.value = button.dataset.category ?? ''; activeFilter = 'All'; document.querySelector('.filter.active')?.classList.remove('active'); document.querySelector('.filter[data-filter="All"]')?.classList.add('active'); renderStreams(); document.querySelector('#live')?.scrollIntoView({ behavior: 'smooth' }) }))
document.querySelector<HTMLButtonElement>('#load-more')!.addEventListener('click', event => { expanded = !expanded; (event.currentTarget as HTMLButtonElement).innerHTML = expanded ? 'Show fewer streams <span>↑</span>' : 'Show me more streams <span>↓</span>'; renderStreams() })
document.querySelector<HTMLButtonElement>('.mobile-search')!.addEventListener('click', () => { search.focus(); search.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
const hamburgerBtn = document.getElementById('hamburger-btn') as HTMLButtonElement
const mobileMenu = document.getElementById('mobile-menu') as HTMLElement
const mobileNavBackdrop = document.getElementById('mobile-backdrop') as HTMLElement
const mobileNavClose = document.querySelector<HTMLButtonElement>('#mobile-nav-close')!
const mobileGoLive = document.querySelector<HTMLButtonElement>('#mobile-go-live')
const mobileSettings = document.querySelector<HTMLButtonElement>('#mobile-settings')!
function setMobileNav(open: boolean) {
  mobileMenu.hidden = !open
  mobileMenu.classList.toggle('hidden', !open)
  mobileMenu.classList.toggle('flex', open)
  mobileMenu.style.display = open ? 'flex' : 'none'
  mobileMenu.classList.toggle('open', open)
  mobileNavBackdrop.hidden = !open
  hamburgerBtn.setAttribute('aria-expanded', String(open))
  hamburgerBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  document.body.classList.toggle('nav-open', open)
  if (open) mobileNavClose.focus()
}
mobileNavClose.addEventListener('click', () => setMobileNav(false))
mobileNavBackdrop.addEventListener('click', () => setMobileNav(false))
mobileGoLive?.addEventListener('click', () => { setMobileNav(false); goLiveCta?.click() })
mobileSettings.addEventListener('click', () => { setMobileNav(false); document.querySelector<HTMLButtonElement>('#settings-button')?.click() })
mobileMenu.querySelectorAll<HTMLAnchorElement>('a').forEach(link => link.addEventListener('click', () => setMobileNav(false)))
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) setMobileNav(false) })
document.querySelectorAll<HTMLAnchorElement>('.main-nav a').forEach(link => link.addEventListener('click', () => { document.querySelector('.main-nav a.active')?.classList.remove('active'); link.classList.add('active') }))
const sectionNav = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) return; const link = document.querySelector<HTMLAnchorElement>(`.main-nav a[href="#${entry.target.id}"]`); if (!link) return; document.querySelector('.main-nav a.active')?.classList.remove('active'); link.classList.add('active') }), { rootMargin: '-35% 0px -55% 0px' })
document.querySelectorAll<HTMLElement>('#discover, #categories, #reels, #chat, #gifts, #music').forEach(section => sectionNav.observe(section))
document.querySelector<HTMLButtonElement>('.collapse')!.addEventListener('click', () => document.querySelector('.sidebar')!.classList.toggle('compact'))
document.body.insertAdjacentHTML('beforeend', `<div class="live-backdrop" id="live-backdrop" hidden><section class="live-modal" role="dialog" aria-modal="true" aria-labelledby="live-title"><button class="auth-close" type="button" id="live-close" aria-label="Close">×</button><div class="eyebrow"><span class="live-dot"></span> CREATOR STUDIO</div><h2 id="live-title">Go live</h2><p class="live-copy">Camera and microphone are optional for this demo. Supabase can connect the room later.</p><div class="live-setup"><label>Stream title<input id="live-title-input" value="Welcome to my first stream"></label><label>Category<select id="live-category"><option>Just Chatting</option><option>Gaming</option><option>Music</option><option>Art</option></select></label></div><label class="audio-only-toggle"><input id="audio-only" type="checkbox"> Audio-only live</label><video id="live-preview" autoplay muted playsinline></video><div class="live-status" id="live-status">Ready to start your live room.</div><div class="live-actions"><button class="outline-button" id="check-media" type="button">Check camera & mic</button><button class="signup" id="start-live" type="button">Start live <span>●</span></button><button class="chat-button" id="stop-live" type="button" hidden>Stop live</button></div><div class="live-room" id="live-room" hidden><div class="live-room-head"><div><span class="live-pill"><i></i> LIVE</span><strong id="live-room-title">Welcome to my first stream</strong><small id="live-room-category">Just Chatting · 1 viewer</small></div><button class="like-button" id="live-like" type="button">♡ <span>0</span></button></div><div class="live-chat" id="live-chat"><div class="live-chat-message"><b>KalTV</b><span>Welcome to the stream chat ✨</span></div></div><form class="live-chat-form" id="live-chat-form"><input id="live-chat-input" maxlength="160" placeholder="Send a message…" autocomplete="off"><button type="submit">Send</button></form><div class="live-gifts"><span>Send a gift</span><button type="button" data-live-gift="✨ Sparkle">✨</button><button type="button" data-live-gift="💖 Heart">💖</button><button type="button" data-live-gift="🚀 Rocket">🚀</button></div></div></section></div>`)
document.body.insertAdjacentHTML('beforeend', `<div class="channel-viewer" id="channel-viewer" hidden><section class="channel-viewer-card" role="dialog" aria-modal="true"><button class="auth-close" id="channel-viewer-close" type="button" aria-label="Close stream">×</button><div class="channel-viewer-screen"><img id="channel-viewer-image" alt="Live channel preview"><span class="live-pill"><i></i> LIVE</span><span id="channel-viewer-viewers" class="viewer-count"></span></div><div class="channel-viewer-body"><div><div class="eyebrow">LIVE CHANNEL</div><h2 id="channel-viewer-title"></h2><p id="channel-viewer-meta"></p></div><div class="channel-viewer-chat" id="channel-viewer-chat"><div><b>KalTV</b><span>Welcome to the stream ✨</span></div></div><form class="channel-viewer-form" id="channel-viewer-form"><input id="channel-viewer-input" maxlength="160" placeholder="Chat with the channel…" autocomplete="off"><button type="submit">Send</button></form></div></section></div>`)
const channelViewer = document.querySelector<HTMLDivElement>('#channel-viewer')!
const channelViewerImage = document.querySelector<HTMLImageElement>('#channel-viewer-image')!
const channelViewerTitle = document.querySelector<HTMLElement>('#channel-viewer-title')!
const channelViewerMeta = document.querySelector<HTMLElement>('#channel-viewer-meta')!
const channelViewerViewers = document.querySelector<HTMLElement>('#channel-viewer-viewers')!
const channelViewerChat = document.querySelector<HTMLElement>('#channel-viewer-chat')!
const channelViewerInput = document.querySelector<HTMLInputElement>('#channel-viewer-input')!
document.querySelector<HTMLElement>('.channel-viewer-body')!.insertAdjacentHTML('afterbegin', '<div class="channel-viewer-actions"><button type="button" id="channel-like">♡ Like <span>0</span></button><button type="button" id="channel-gift">🎁 Send gift</button><button type="button" id="channel-share">↗ Share</button></div>')
document.querySelector<HTMLElement>('.channel-viewer-body')!.insertAdjacentHTML('afterbegin', '<div class="channel-gift-panel" id="channel-gift-panel" hidden><strong>Send a gift while they’re live</strong><div><button type="button" data-channel-gift="✨ Sparkle" data-channel-price="25">✨ 25</button><button type="button" data-channel-gift="💖 Heart" data-channel-price="100">💖 100</button><button type="button" data-channel-gift="🚀 Rocket" data-channel-price="500">🚀 500</button><button type="button" data-channel-gift="💎 Diamond" data-channel-price="1000">💎 1,000</button></div></div>')
const channelLike = document.querySelector<HTMLButtonElement>('#channel-like')!
const channelGift = document.querySelector<HTMLButtonElement>('#channel-gift')!
const channelShare = document.querySelector<HTMLButtonElement>('#channel-share')!
const channelGiftPanel = document.querySelector<HTMLElement>('#channel-gift-panel')!
const channelGiftOptions = channelGiftPanel.querySelector<HTMLElement>('div')!
channelGiftPanel.insertAdjacentHTML('beforeend', '<button type="button" id="channel-gift-send" disabled>Send selected gift</button>')
const channelGiftSend = document.querySelector<HTMLButtonElement>('#channel-gift-send')!
let selectedChannelGift: { name: string; cost: number } | null = null
let activeChannel: Channel | null = null
let channelLikes = 0
function openChannel(channel: Channel) { activeChannel = channel; channelLikes = 0; channelLike.innerHTML = '♡ Like <span>0</span>'; channelGiftPanel.hidden = true; channelViewerImage.src = photo(channel.image, 1200); channelViewerTitle.textContent = channel.title; channelViewerMeta.textContent = `${channel.name} · ${channel.game} · ${channel.tag}`; channelViewerViewers.textContent = `${channel.viewers} watching`; channelViewer.hidden = false; channelViewerInput.focus() }
channelLike.addEventListener('click', () => { channelLikes += 1; channelLike.innerHTML = `♥ Like <span>${channelLikes}</span>`; showToast('Like sent to the channel ✨') })
channelGift.addEventListener('click', () => { channelGiftPanel.hidden = !channelGiftPanel.hidden; if (!channelGiftPanel.hidden) { selectedChannelGift = null; channelGiftSend.disabled = true; channelGiftOptions.replaceChildren(); document.querySelectorAll<HTMLButtonElement>('.gift-item').forEach(gift => { const option = document.createElement('button'); option.type = 'button'; option.textContent = `${gift.querySelector('span')?.textContent ?? '🎁'} ${gift.dataset.gift} · ${Number(gift.dataset.cost ?? '0').toLocaleString()} coins`; option.addEventListener('click', () => { selectedChannelGift = { name: gift.dataset.gift ?? 'Gift', cost: Number(gift.dataset.cost ?? '0') }; channelGiftOptions.querySelector('.selected')?.classList.remove('selected'); option.classList.add('selected'); channelGiftSend.disabled = false; channelGiftSend.textContent = `Send ${selectedChannelGift.name}` }); channelGiftOptions.appendChild(option) }); channelGiftPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) } })
channelGiftSend.addEventListener('click', () => { if (!selectedChannelGift) return; showToast(`${selectedChannelGift.name} sent to ${activeChannel?.name ?? 'the creator'} for ${selectedChannelGift.cost.toLocaleString()} coins 🎁`); channelGiftSend.disabled = true; channelGiftSend.textContent = 'Gift sent ✨'; selectedChannelGift = null })
channelGiftPanel.querySelectorAll<HTMLButtonElement>('[data-channel-gift]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.channelGift} sent to ${activeChannel?.name ?? 'the creator'} for ${button.dataset.channelPrice} coins 🎁`)))
channelShare.addEventListener('click', async () => { if (!activeChannel) return; const shareData = { title: `${activeChannel.name} is live`, text: `Watch ${activeChannel.name} on KalTV`, url: `${window.location.href.split('#')[0]}#live` }; try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); showToast('Channel link copied ✨') } } catch { showToast('Sharing cancelled') } })
document.head.insertAdjacentHTML('beforeend', `<style>.channel-viewer-actions{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.channel-viewer-actions button{border:1px solid #3a3c35;background:#282b24;color:#d0d5c6;border-radius:6px;padding:8px 11px;font-size:10px;cursor:pointer}.channel-viewer-actions button:hover{border-color:var(--lime);color:var(--lime)}.channel-viewer-actions button:first-child{color:#ffaaa2}</style>`)
document.head.insertAdjacentHTML('beforeend', `<style>.channel-gift-panel{margin:0 0 14px;padding:12px;background:#26321f;border:1px solid #59733a;border-radius:8px}.channel-gift-panel[hidden]{display:none}.channel-gift-panel strong{display:block;color:#e3f4bc;font-size:11px;margin-bottom:9px}.channel-gift-panel>div{display:flex;gap:7px;flex-wrap:wrap}.channel-gift-panel button{border:1px solid #657747;background:#303b25;color:#dff2b8;border-radius:6px;padding:8px 10px;font-size:10px;cursor:pointer}.channel-gift-panel button:hover,.channel-gift-panel button.selected{border-color:var(--lime);background:#3b4a2b}.channel-gift-panel>#channel-gift-send{margin-top:10px;background:var(--lime);color:#171913;border-color:var(--lime);font-weight:700}.channel-gift-panel>#channel-gift-send:disabled{opacity:.45;cursor:not-allowed}</style>`)
document.querySelector<HTMLButtonElement>('#channel-viewer-close')!.addEventListener('click', () => { channelViewer.hidden = true })
channelViewer.addEventListener('click', event => { if (event.target === channelViewer) channelViewer.hidden = true })
document.querySelector<HTMLFormElement>('#channel-viewer-form')!.addEventListener('submit', event => { event.preventDefault(); const message = channelViewerInput.value.trim(); if (!message) return; const bubble = document.createElement('div'); bubble.innerHTML = `<b>You</b><span></span>`; bubble.querySelector('span')!.textContent = message; channelViewerChat.appendChild(bubble); channelViewerInput.value = ''; channelViewerChat.scrollTop = channelViewerChat.scrollHeight })
document.querySelectorAll<HTMLButtonElement>('.followed').forEach((button, index) => button.addEventListener('click', () => { const channel = channels[index]; if (channel) openChannel(channel) }))
document.head.insertAdjacentHTML('beforeend', `<style>.channel-viewer{position:fixed;inset:0;z-index:140;background:#080908dd;backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}.channel-viewer[hidden]{display:none}.channel-viewer-card{width:min(980px,100%);max-height:calc(100vh - 40px);overflow:auto;background:#20221e;border:1px solid #3b4033;border-radius:12px;box-shadow:0 20px 70px #000b}.channel-viewer-screen{position:relative;background:#10120f}.channel-viewer-screen img{display:block;width:100%;max-height:560px;aspect-ratio:16/9;object-fit:cover}.channel-viewer-screen .live-pill{position:absolute;top:14px;left:14px}.channel-viewer-screen .viewer-count{position:absolute;right:14px;bottom:14px}.channel-viewer-card>.auth-close{z-index:2}.channel-viewer-body{padding:20px}.channel-viewer-body h2{font:700 22px 'Manrope';margin:8px 0 4px}.channel-viewer-body p{color:#9b9e94;font-size:10px;margin:0}.channel-viewer-chat{display:grid;gap:7px;max-height:150px;overflow:auto;margin-top:17px;padding:12px;background:#151714;border:1px solid #30332c;border-radius:7px}.channel-viewer-chat div{display:flex;gap:7px;font-size:10px;line-height:1.4}.channel-viewer-chat b{color:var(--lime)}.channel-viewer-chat span{color:#d0d3c8}.channel-viewer-form{display:flex;gap:7px;margin-top:8px}.channel-viewer-form input{flex:1;min-width:0;border:1px solid #3a3d35;background:#151714;color:#f3f4ed;border-radius:6px;padding:10px;font-size:10px}.channel-viewer-form button{border:0;border-radius:6px;background:var(--lime);color:#171913;padding:0 14px;font-size:10px;font-weight:700}</style>`)
const authBackdrop = document.querySelector<HTMLDivElement>('#auth-backdrop')!
const authForm = document.querySelector<HTMLFormElement>('#auth-form')!
let authMode: 'signup' | 'login' = 'signup'
function openAuth(mode: 'signup' | 'login') { authMode = mode; authBackdrop.hidden = false; document.querySelector('#auth-title')!.textContent = mode === 'signup' ? 'Join the community' : 'Welcome back'; document.querySelector('#auth-copy')!.textContent = mode === 'signup' ? 'Create your free profile to follow creators and join the conversation.' : 'Log in to pick up where you left off.'; document.querySelector<HTMLLabelElement>('#auth-name')!.hidden = mode === 'login'; document.querySelector<HTMLButtonElement>('#auth-submit')!.innerHTML = mode === 'signup' ? 'Create account <span>↗</span>' : 'Log in <span>↗</span>'; document.querySelector<HTMLButtonElement>('#auth-switch')!.textContent = mode === 'signup' ? 'Already have an account? Log in' : 'New to KalTV? Create an account'; document.querySelector<HTMLInputElement>('#auth-name')!.required = mode === 'signup' }
document.querySelector<HTMLButtonElement>('#signup-button')!.addEventListener('click', () => openAuth('signup'))
document.querySelector<HTMLButtonElement>('#login-btn')!.addEventListener('click', () => openAuth('login'))
document.querySelector<HTMLButtonElement>('#auth-close')!.addEventListener('click', () => { authBackdrop.hidden = true })
document.querySelector<HTMLButtonElement>('#auth-switch')!.addEventListener('click', () => openAuth(authMode === 'signup' ? 'login' : 'signup'))
authBackdrop.addEventListener('click', event => { if (event.target === authBackdrop) authBackdrop.hidden = true })
const liveBackdrop = document.querySelector<HTMLDivElement>('#live-backdrop')!
const liveModal = document.querySelector<HTMLElement>('.live-modal')!
const livePreview = document.querySelector<HTMLVideoElement>('#live-preview')!
const liveActions = document.querySelector<HTMLElement>('.live-actions')!
liveActions.insertAdjacentHTML('beforeend', '<button class="outline-button" id="invite-guest" type="button" hidden>Invite guest</button><button class="chat-button" id="share-live" type="button" hidden>Share live</button><button class="outline-button" id="share-screen" type="button">Share desktop screen</button>')
document.querySelector<HTMLElement>('.live-setup')!.insertAdjacentHTML('afterend', '<div class="game-setup" id="game-setup" hidden><label>Choose installed game<select id="installed-game"><option value="VALORANT">VALORANT</option><option value="Fortnite">Fortnite</option><option value="Minecraft">Minecraft</option><option value="Apex Legends">Apex Legends</option><option value="EA SPORTS FC 25">EA SPORTS FC 25</option><option value="Call of Duty">Call of Duty</option></select></label><button class="outline-button" id="share-game" type="button">Share game invite</button><small>Share your game screen so viewers can watch you play.</small></div>')
livePreview.insertAdjacentHTML('afterend', '<video class="guest-preview" id="guest-preview" autoplay muted playsinline hidden></video>')
liveModal.insertAdjacentHTML('beforeend', '<section class="guest-invite-panel" id="guest-invite-panel" hidden><div class="eyebrow"><span class="live-dot"></span> INVITE A GUEST</div><h3>Join your live stream</h3><p>Confirm to let a guest join with their camera and microphone.</p><input id="guest-name" placeholder="Guest name" autocomplete="off"><div><button class="chat-button" id="cancel-guest-invite" type="button">Cancel</button><button class="signup" id="confirm-guest-invite" type="button">Confirm invite</button></div></section><section class="guest-accepted-panel" id="guest-accepted-panel" hidden><span class="live-pill"><i></i> GUEST JOINED</span><strong id="guest-accepted-name">Guest</strong><small>Camera is live beside the host.</small><button class="chat-button" id="remove-guest" type="button">Remove guest</button></section>')
const inviteGuest = document.querySelector<HTMLButtonElement>('#invite-guest')!
const shareLive = document.querySelector<HTMLButtonElement>('#share-live')!
const guestPreview = document.querySelector<HTMLVideoElement>('#guest-preview')!
const liveVideoStage = document.createElement('div')
liveVideoStage.className = 'live-video-stage'
livePreview.parentElement?.insertBefore(liveVideoStage, livePreview)
liveVideoStage.append(livePreview, guestPreview)
document.querySelector('#guest-invite-panel')?.setAttribute('id', 'invite-panel')
const guestInvitePanel = document.querySelector<HTMLElement>('#invite-panel')!
const guestName = document.querySelector<HTMLInputElement>('#guest-name')!
const cancelGuestInvite = document.querySelector<HTMLButtonElement>('#cancel-guest-invite')!
const confirmGuestInvite = document.querySelector<HTMLButtonElement>('#confirm-guest-invite')!
guestInvitePanel.insertAdjacentHTML('afterbegin', '<button type="button" id="guest-invite-close" aria-label="Close invite">×</button>')
document.querySelector<HTMLButtonElement>('#guest-invite-close')?.addEventListener('click', () => { guestInvitePanel.hidden = true })
const guestAcceptedPanel = document.querySelector<HTMLElement>('#guest-accepted-panel')!
const guestAcceptedName = document.querySelector<HTMLElement>('#guest-accepted-name')!
const removeGuest = document.querySelector<HTMLButtonElement>('#remove-guest')!
const audioOnly = document.querySelector<HTMLInputElement>('#audio-only')!
const liveStatus = document.querySelector<HTMLElement>('#live-status')!
const checkMedia = document.querySelector<HTMLButtonElement>('#check-media')!
const startLive = document.querySelector<HTMLButtonElement>('#start-live')!
const stopLive = document.querySelector<HTMLButtonElement>('#stop-live')!
let liveStream: MediaStream | null = null
let screenStream: MediaStream | null = null
let guestStream: MediaStream | null = null
const liveRoom = document.querySelector<HTMLElement>('#live-room')!
const liveTitleInput = document.querySelector<HTMLInputElement>('#live-title-input')!
const liveCategory = document.querySelector<HTMLSelectElement>('#live-category')!
const gameSetup = document.querySelector<HTMLElement>('#game-setup')!
const installedGame = document.querySelector<HTMLSelectElement>('#installed-game')!
const shareGame = document.querySelector<HTMLButtonElement>('#share-game')!
const shareScreen = document.querySelector<HTMLButtonElement>('#share-screen')!
const liveRoomTitle = document.querySelector<HTMLElement>('#live-room-title')!
const liveRoomCategory = document.querySelector<HTMLElement>('#live-room-category')!
const liveChat = document.querySelector<HTMLElement>('#live-chat')!
const liveChatForm = document.querySelector<HTMLFormElement>('#live-chat-form')!
const liveChatInput = document.querySelector<HTMLInputElement>('#live-chat-input')!
const liveLike = document.querySelector<HTMLButtonElement>('#live-like')!
let liveLikes = 0
function stopLivePreview() { liveStream?.getTracks().forEach(track => track.stop()); screenStream?.getTracks().forEach(track => track.stop()); liveStream = null; screenStream = null; livePreview.srcObject = null; shareScreen.textContent = 'Share desktop screen'; stopLive.hidden = true; checkMedia.disabled = false }
function resetLiveRoom() { liveRoom.hidden = true; liveLikes = 0; liveLike.innerHTML = '♡ <span>0</span>'; liveChat.innerHTML = '<div class="live-chat-message"><b>KalTV</b><span>Welcome to the stream chat ✨</span></div>'; startLive.hidden = false; stopLive.hidden = true }
goLiveCta?.addEventListener('click', () => { liveBackdrop.hidden = false; liveModal.classList.remove('live-active'); resetLiveRoom(); liveStatus.textContent = 'Ready to check your camera and microphone.' })
document.querySelectorAll<HTMLButtonElement>('.go-live-trigger').forEach(button => button.addEventListener('click', () => goLiveCta?.click()))
document.querySelector<HTMLButtonElement>('#live-close')!.addEventListener('click', () => { liveBackdrop.hidden = true; stopLivePreview() })
liveBackdrop.addEventListener('click', event => { if (event.target === liveBackdrop) { liveBackdrop.hidden = true; stopLivePreview() } })
audioOnly.addEventListener('change', () => { livePreview.hidden = audioOnly.checked; checkMedia.textContent = audioOnly.checked ? 'Check microphone' : 'Check camera & mic' })
liveCategory.addEventListener('change', () => { gameSetup.hidden = liveCategory.value !== 'Gaming' })
checkMedia.addEventListener('click', async () => { try { liveStream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly.checked, audio: true }); livePreview.srcObject = liveStream; liveStatus.textContent = audioOnly.checked ? 'Microphone ready. Your audio-only preview is private.' : 'Camera and microphone ready. This is a private preview.'; checkMedia.disabled = true } catch { liveStatus.textContent = 'Camera or microphone unavailable. You can still start a text-only demo room.' } })
startLive.addEventListener('click', () => { const title = liveTitleInput.value.trim() || 'Untitled stream'; liveRoomTitle.textContent = title; liveRoomCategory.textContent = `${liveCategory.value} · 1 viewer`; liveRoom.hidden = false; liveStatus.textContent = liveStream ? 'You are live in local demo mode. Comments, likes, and gifts are ready to try.' : 'You are live in text-only demo mode. Comments, likes, and gifts are ready to try.'; startLive.hidden = true; stopLive.hidden = false; showToast('You are live in preview mode ✨') })
startLive.addEventListener('click', () => { if (liveCategory.value === 'Gaming') { liveRoomCategory.textContent = `${installedGame.value} · game lobby · 1 viewer`; liveStatus.textContent = `You are live with ${installedGame.value}. Share the game invite so people can play with you.` } })
stopLive.addEventListener('click', () => { stopLivePreview(); resetLiveRoom(); liveStatus.textContent = 'Stream stopped. Ready to go live again.'; startLive.hidden = false; showToast('Stream stopped') })
liveLike.addEventListener('click', () => { liveLikes += 1; liveLike.innerHTML = `♥ <span>${liveLikes}</span>`; showToast('Like sent ✨') })
liveChatForm.addEventListener('submit', event => { event.preventDefault(); const message = liveChatInput.value.trim(); if (!message) return; const bubble = document.createElement('div'); bubble.className = 'live-chat-message'; bubble.innerHTML = `<b>You</b><span>${message.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char))}</span>`; liveChat.appendChild(bubble); liveChatInput.value = ''; liveChat.scrollTop = liveChat.scrollHeight })
document.querySelectorAll<HTMLButtonElement>('[data-live-gift]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.liveGift} sent to the streamer ✨`)))
shareGame.addEventListener('click', async () => { const game = installedGame.value; const shareData = { title: `${game} game session`, text: `Join my ${game} game on KalTV`, url: `${window.location.href.split('#')[0]}#live` }; try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); showToast(`${game} invite link copied ✨`) } } catch { showToast('Game sharing cancelled') } })
shareScreen.addEventListener('click', async () => {
  if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); screenStream = null; livePreview.srcObject = liveStream; shareScreen.textContent = 'Share desktop screen'; checkMedia.disabled = !liveStream; liveStatus.textContent = liveStream ? 'Camera and microphone preview is ready.' : 'Desktop sharing stopped.'; return }
  const displayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices)
  if (!displayMedia) { liveStatus.textContent = 'Desktop sharing needs HTTPS or localhost in a supported browser.'; showToast('Open the app on HTTPS or localhost to share your desktop'); return }
  try {
    liveStream?.getTracks().forEach(track => track.stop())
    liveStream = null
    screenStream = await displayMedia({ video: true, audio: false })
    livePreview.srcObject = screenStream
    livePreview.play().catch(() => undefined)
    livePreview.hidden = false
    shareScreen.textContent = 'Stop screen share'
    checkMedia.disabled = true
    liveStatus.textContent = `Your ${installedGame.value} desktop screen is ready to share.`
    screenStream.getVideoTracks()[0]?.addEventListener('ended', () => { screenStream = null; livePreview.srcObject = null; shareScreen.textContent = 'Share desktop screen'; checkMedia.disabled = false; liveStatus.textContent = 'Desktop sharing stopped.' })
    showToast('Desktop screen is ready to share ✨')
  } catch (error) { const reason = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Screen permission was denied or cancelled.' : 'Desktop sharing could not start in this browser.'; liveStatus.textContent = reason; showToast(reason) }
})
authForm.addEventListener('submit', event => { event.preventDefault(); const name = document.querySelector<HTMLInputElement>('#auth-name')!.value || 'KalTV creator'; localStorage.setItem('kaltv_user', JSON.stringify({ name })); authBackdrop.hidden = true; document.querySelector<HTMLButtonElement>('#signup-button')!.textContent = name; document.querySelector<HTMLButtonElement>('#login-btn')!.textContent = 'Profile'; showToast(authMode === 'signup' ? `Welcome to KalTV, ${name} ✨` : `Welcome back, ${name}`) })
document.querySelectorAll<HTMLButtonElement>('.community-card button').forEach(button => button.addEventListener('click', () => openAuth('signup')))
const savedUser = localStorage.getItem('kaltv_user'); if (savedUser) { try { const name = JSON.parse(savedUser).name; document.querySelector<HTMLButtonElement>('#signup-button')!.textContent = name; document.querySelector<HTMLButtonElement>('#login-btn')!.textContent = 'Profile' } catch { localStorage.removeItem('kaltv_user') } }
document.querySelector<HTMLButtonElement>('#create-reel')?.addEventListener('click', () => showToast('Reel creator is ready for your next moment 🎬'))
document.querySelectorAll<HTMLButtonElement>('[data-call]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.call === 'video' ? 'Video chat' : 'Voice call'} invite sent ✨`)))
document.querySelectorAll<HTMLButtonElement>('[data-chat]').forEach(button => button.addEventListener('click', () => showToast(`Opening chat with ${button.dataset.chat}`)))
const musicUpload = document.querySelector<HTMLInputElement>('#music-upload')
const trackList = document.querySelector<HTMLElement>('.track-list')!
musicUpload?.addEventListener('change', event => {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  files.forEach((file, index) => {
    const url = URL.createObjectURL(file)
    const track = document.createElement('div')
    track.className = 'uploaded-track'
    const number = document.createElement('span')
    number.textContent = 'NEW'
    const name = document.createElement('b')
    name.textContent = file.name.replace(/\.[^/.]+$/, '')
    const meta = document.createElement('small')
    meta.textContent = `${file.type || 'Audio'} · uploaded now`
    const audio = document.createElement('audio')
    audio.controls = true
    audio.preload = 'metadata'
    audio.src = url
    const download = document.createElement('a')
    download.className = 'track-download-link'
    download.href = url
    download.download = file.name
    download.textContent = '↓'
    download.title = `Download ${file.name}`
    track.append(number, name, meta, audio, download)
    trackList.appendChild(track)
    if (index === files.length - 1) showToast(`${files.length} track${files.length > 1 ? 's' : ''} added to your library 🎵`)
  })
  if (musicUpload) musicUpload.value = ''
})
document.querySelector<HTMLButtonElement>('#download-mix')?.addEventListener('click', () => showToast('Select a track download button to save it to your device ↓'))
document.querySelectorAll<HTMLButtonElement>('.track-download').forEach(button => button.addEventListener('click', () => showToast('Track download started 🎵')))
document.head.insertAdjacentHTML('beforeend', `<style>.uploaded-track{position:relative;flex-wrap:wrap}.uploaded-track audio{flex:1 1 180px;width:auto;height:28px;margin-top:4px}.uploaded-track .track-download-link{display:grid;place-items:center;color:var(--lime);text-decoration:none;font-size:16px;border:1px solid #3a3c35;border-radius:5px;width:28px;height:28px}.uploaded-track .track-download-link:hover{border-color:var(--lime);background:#293021}.uploaded-track small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>`)
document.querySelector<HTMLElement>('.gift-row')?.insertAdjacentHTML('beforeend', '<button class="gift-card" data-gift="Magic Wand" data-price="1500"><span>🪄</span><b>Magic Wand</b><small>1,500 coins</small></button><button class="gift-card" data-gift="Golden Dragon" data-price="2500"><span>🐉</span><b>Golden Dragon</b><small>2,500 coins</small></button><button class="gift-card" data-gift="Rainbow" data-price="3500"><span>🌈</span><b>Rainbow</b><small>3,500 coins</small></button><button class="gift-card" data-gift="Unicorn" data-price="5000"><span>🦄</span><b>Unicorn</b><small>5,000 coins</small></button><button class="gift-card" data-gift="Treasure Chest" data-price="7500"><span>🧰</span><b>Treasure Chest</b><small>7,500 coins</small></button><button class="gift-card" data-gift="Royal Palace" data-price="10000"><span>🏰</span><b>Royal Palace</b><small>10,000 coins</small></button>')
document.querySelector<HTMLElement>('.gift-grid')?.insertAdjacentHTML('beforeend', '<button class="gift-item" data-gift="Magic Wand" data-cost="5000"><span>🪄</span><b>Magic Wand</b><small>5,000 coins</small></button><button class="gift-item" data-gift="Golden Dragon" data-cost="10000"><span>🐉</span><b>Golden Dragon</b><small>10,000 coins</small></button><button class="gift-item" data-gift="Rainbow" data-cost="15000"><span>🌈</span><b>Rainbow</b><small>15,000 coins</small></button><button class="gift-item" data-gift="Unicorn" data-cost="25000"><span>🦄</span><b>Unicorn</b><small>25,000 coins</small></button><button class="gift-item" data-gift="Treasure Chest" data-cost="50000"><span>🧰</span><b>Treasure Chest</b><small>50,000 coins</small></button><button class="gift-item" data-gift="Royal Palace" data-cost="100000"><span>🏰</span><b>Royal Palace</b><small>100,000 coins</small></button>')
document.querySelectorAll<HTMLButtonElement>('.gift-card').forEach(button => button.addEventListener('click', () => { document.querySelector('.gift-card.selected')?.classList.remove('selected'); button.classList.add('selected'); showToast(`${button.dataset.gift} selected — send it to the live creator ✨`) }))
document.querySelectorAll<HTMLButtonElement>('.gift-card').forEach(button => button.addEventListener('dblclick', () => showToast(`${button.dataset.gift} sent for ${button.dataset.price} coins! 🎁`)))
document.querySelectorAll<HTMLButtonElement>('.gift-item').forEach(button => button.addEventListener('click', () => { document.querySelector('.gift-item.selected')?.classList.remove('selected'); button.classList.add('selected'); showToast(`${button.dataset.gift} sent for ${button.dataset.cost} coins! 🎁`) }))
document.body.insertAdjacentHTML('beforeend', `<div class="coin-shop-backdrop" id="coin-shop-backdrop" hidden><section class="coin-shop-modal" role="dialog" aria-modal="true" aria-labelledby="coin-shop-title"><button class="auth-close" id="coin-shop-close" type="button" aria-label="Close coin shop">×</button><div class="eyebrow">GIFT COINS</div><h2 id="coin-shop-title">Buy coins for gifts</h2><p>Choose a coin pack, then pay with airtime or a credit card.</p><div class="coin-pack-grid"><button type="button" class="coin-pack selected" data-coins="500" data-price="5"><b>500</b><small>R5</small></button><button type="button" class="coin-pack" data-coins="1200" data-price="10"><b>1,200</b><small>R10</small></button><button type="button" class="coin-pack" data-coins="3000" data-price="25"><b>3,000</b><small>R25</small></button><button type="button" class="coin-pack" data-coins="7500" data-price="50"><b>7,500</b><small>R50</small></button></div><div class="payment-methods"><button type="button" class="payment-method selected" data-payment="airtime">📱 Airtime</button><button type="button" class="payment-method" data-payment="card">💳 Credit card</button></div><label class="payment-field" id="airtime-field">Mobile number<input id="airtime-number" inputmode="tel" placeholder="e.g. 071 234 5678"></label><label class="payment-field" id="card-field" hidden>Card number<input id="card-number" inputmode="numeric" placeholder="1234 5678 9012 3456"></label><button class="signup coin-buy-confirm" id="coin-buy-confirm" type="button">Buy 500 coins for R5</button></section></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>.coin-shop-backdrop{position:fixed;inset:0;z-index:130;background:#080908cc;backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}.coin-shop-backdrop[hidden]{display:none}.coin-shop-modal{width:min(430px,100%);position:relative;background:#20221e;border:1px solid #3b4033;border-radius:12px;padding:27px;box-shadow:0 20px 70px #0009}.coin-shop-modal h2{font:700 25px 'Manrope';margin:10px 0 7px}.coin-shop-modal>p{color:#9b9e94;font-size:10px;line-height:1.5;margin:0 0 16px}.coin-pack-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.coin-pack,.payment-method{border:1px solid #3a3c35;background:#282b24;color:#d0d5c6;border-radius:6px;padding:10px 6px;cursor:pointer}.coin-pack{display:grid;gap:4px}.coin-pack b{color:#f3f4ed;font-size:12px}.coin-pack small{color:#aeb99a;font-size:9px}.coin-pack.selected,.payment-method.selected{border-color:var(--lime);background:#303b25;color:var(--lime)}.payment-methods{display:flex;gap:7px;margin-top:14px}.payment-method{flex:1;font-size:10px}.payment-field{display:grid;gap:6px;margin-top:13px;color:#b7baae;font-size:10px}.payment-field[hidden]{display:none}.payment-field input{border:1px solid #3a3d35;background:#151714;color:#f3f4ed;border-radius:6px;padding:10px;font-size:11px;outline:0}.coin-buy-confirm{width:100%;border:0;cursor:pointer;font-size:10px;padding:11px;margin-top:16px}@media(max-width:430px){.coin-pack-grid{grid-template-columns:repeat(2,1fr)}}</style>`)
const coinShopBackdrop = document.querySelector<HTMLDivElement>('#coin-shop-backdrop')!
const coinShopClose = document.querySelector<HTMLButtonElement>('#coin-shop-close')!
const coinBuyConfirm = document.querySelector<HTMLButtonElement>('#coin-buy-confirm')!
const airtimeField = document.querySelector<HTMLElement>('#airtime-field')!
const cardField = document.querySelector<HTMLElement>('#card-field')!
let selectedCoinPack = { coins: '500', price: '5' }
let selectedPayment = 'airtime'
document.querySelectorAll<HTMLButtonElement>('.coin-pack').forEach(button => button.addEventListener('click', () => { document.querySelector('.coin-pack.selected')?.classList.remove('selected'); button.classList.add('selected'); selectedCoinPack = { coins: button.dataset.coins ?? '500', price: button.dataset.price ?? '5' }; coinBuyConfirm.textContent = `Buy ${Number(selectedCoinPack.coins).toLocaleString()} coins for R${selectedCoinPack.price}` }))
document.querySelectorAll<HTMLButtonElement>('.payment-method').forEach(button => button.addEventListener('click', () => { document.querySelector('.payment-method.selected')?.classList.remove('selected'); button.classList.add('selected'); selectedPayment = button.dataset.payment ?? 'airtime'; airtimeField.hidden = selectedPayment !== 'airtime'; cardField.hidden = selectedPayment !== 'card' }))
document.querySelector<HTMLButtonElement>('#buy-coins')?.addEventListener('click', () => { coinShopBackdrop.hidden = false })
coinShopClose.addEventListener('click', () => { coinShopBackdrop.hidden = true })
coinShopBackdrop.addEventListener('click', event => { if (event.target === coinShopBackdrop) coinShopBackdrop.hidden = true })
coinBuyConfirm.addEventListener('click', () => { const detail = selectedPayment === 'airtime' ? document.querySelector<HTMLInputElement>('#airtime-number')!.value.trim() : document.querySelector<HTMLInputElement>('#card-number')!.value.trim(); if (!detail) { showToast(`Enter your ${selectedPayment === 'airtime' ? 'mobile number' : 'card number'} first`); return } coinShopBackdrop.hidden = true; showToast(`${Number(selectedCoinPack.coins).toLocaleString()} coins purchased with ${selectedPayment === 'airtime' ? 'airtime' : 'credit card'} ✨`) })
document.querySelector<HTMLButtonElement>('#change-recipient')?.addEventListener('click', () => showToast('Choose a live creator from the stream cards'))
document.querySelector<HTMLButtonElement>('#play-music')?.addEventListener('click', event => { const button = event.currentTarget as HTMLButtonElement; button.textContent = button.textContent === '▶' ? 'Ⅱ' : '▶'; showToast(button.textContent === 'Ⅱ' ? 'Playing Midnight Signals' : 'Music paused') })
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus() } })
document.body.insertAdjacentHTML('beforeend', `<div class="chat-backdrop" id="chat-backdrop" hidden><section class="chat-modal" role="dialog" aria-modal="true" aria-labelledby="chat-title"><button class="auth-close" type="button" id="chat-close" aria-label="Close chat">×</button><div class="eyebrow">DIRECT CHAT</div><h2 id="chat-title">Chat with pixelpilot</h2><div class="chat-messages"><div class="chat-message received">Hey! Are you watching the match?</div><div class="chat-message sent">Yep, that clutch was wild ✨</div></div><div class="voice-recorder"><div class="voice-status" id="voice-status">Tap the mic to record a voice message</div><div class="voice-controls"><button class="record-button" id="record-voice" type="button" aria-label="Record voice message">●</button><span id="record-time">00:00</span><audio id="voice-preview" controls hidden></audio></div><div class="voice-actions"><button class="chat-button" id="discard-voice" type="button" hidden>Discard</button><button class="signup" id="send-voice" type="button" hidden>Send voice ↗</button></div></div></section></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>.chat-backdrop{position:fixed;inset:0;z-index:110;background:#080908cc;backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}.chat-backdrop[hidden]{display:none}.chat-modal{width:min(460px,100%);position:relative;background:#20221e;border:1px solid #3b4033;border-radius:12px;padding:27px;box-shadow:0 20px 70px #0009}.chat-modal h2{font:700 25px 'Manrope';margin:10px 0 18px;letter-spacing:-1px}.chat-messages{display:grid;gap:8px;padding:15px 0;border-top:1px solid #ffffff0b;border-bottom:1px solid #ffffff0b}.chat-message{max-width:80%;padding:9px 11px;border-radius:9px;font-size:11px;line-height:1.45}.chat-message.received{background:#2a2d25;color:#dfe2d7}.chat-message.sent{justify-self:end;background:#c8f169;color:#171913}.voice-recorder{margin-top:17px}.voice-status{color:#9b9e94;font-size:10px}.voice-controls{display:flex;align-items:center;gap:12px;margin-top:13px}.record-button{width:42px;height:42px;border:0;border-radius:50%;background:#ff655e;color:#fff;cursor:pointer;box-shadow:0 0 0 5px #ff655e22;font-size:18px}.record-button.recording{animation:voice-pulse 1.2s infinite;background:#d83f50}.voice-controls>span{font:600 12px 'Manrope';color:#d7dbce}.voice-controls audio{height:32px;flex:1;min-width:0}.voice-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.voice-actions .signup{border:0;cursor:pointer;font-size:10px;padding:9px 12px}.voice-actions .chat-button{font-size:10px}@keyframes voice-pulse{50%{box-shadow:0 0 0 10px #ff655e08}}</style>`)
document.head.insertAdjacentHTML('beforeend', `<style>.chat-modal{width:min(720px,calc(100vw - 32px));min-height:min(680px,calc(100vh - 48px));display:flex;flex-direction:column}.chat-modal h2{font-size:30px}.chat-messages{flex:1;min-height:260px;align-content:start;overflow:auto}.chat-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.chat-toolbar button{border:1px solid #3a3c35;background:#282b24;color:#d0d5c6;border-radius:6px;padding:9px 12px;font-size:10px;cursor:pointer}.chat-toolbar button:hover{border-color:var(--lime);color:var(--lime)}.chat-compose{display:flex;gap:8px;margin-top:14px}.chat-compose input{flex:1;min-width:0;border:1px solid #3a3d35;background:#151714;color:#f3f4ed;border-radius:6px;padding:11px;font-size:11px;outline:0}.chat-compose input:focus{border-color:var(--lime)}.chat-compose button{border:0;border-radius:6px;background:var(--lime);color:#171913;padding:0 15px;font-size:10px;font-weight:700;cursor:pointer}.voice-recorder{margin-top:17px;padding-top:17px;border-top:1px solid #ffffff0b}</style>`)
document.querySelector<HTMLElement>('.top-actions')?.insertAdjacentHTML('afterbegin', `<button class="icon-button settings-button" id="settings-button" aria-label="Open settings" title="Settings">⚙</button>`)
document.body.insertAdjacentHTML('beforeend', `<div class="settings-backdrop" id="settings-backdrop" hidden><section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button class="auth-close" type="button" id="settings-close" aria-label="Close settings">×</button><div class="eyebrow">KALTV SETTINGS</div><h2 id="settings-title">Settings & app info</h2><p class="settings-intro">Manage how KalTV works for you and learn what each preference controls.</p><div class="settings-list"><label class="setting-row"><span><strong>Notifications</strong><small>Get alerts for followed creators going live.</small></span><input type="checkbox" id="setting-notifications" checked></label><label class="setting-row"><span><strong>Autoplay previews</strong><small>Play stream previews while browsing.</small></span><input type="checkbox" id="setting-autoplay" checked></label><div class="setting-row info-row"><span><strong>Privacy</strong><small>Your profile and status are visible to people you connect with.</small></span><b>Standard</b></div><div class="setting-row info-row"><span><strong>App version</strong><small>Current KalTV experience.</small></span><b>1.0.0</b></div></div><button class="signup settings-done" id="settings-done" type="button">Done</button></section></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>.settings-button{font-size:17px;color:#b9bcb2}.settings-backdrop{position:fixed;inset:0;z-index:120;background:#080908cc;backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}.settings-backdrop[hidden]{display:none}.settings-modal{width:min(500px,100%);position:relative;background:#20221e;border:1px solid #3b4033;border-radius:12px;padding:28px;box-shadow:0 20px 70px #0009}.settings-modal h2{font:700 25px 'Manrope';margin:10px 0 8px;letter-spacing:-1px}.settings-intro{color:#9b9e94;font-size:11px;line-height:1.6;margin:0 0 18px}.settings-list{border-top:1px solid #ffffff0b}.setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid #ffffff0b}.setting-row span{display:grid;gap:4px}.setting-row strong{font-size:11px}.setting-row small{color:#8c8f86;font-size:9px;line-height:1.4}.setting-row input{accent-color:var(--lime);width:16px;height:16px}.info-row b{color:var(--lime);font-size:9px;font-weight:600}.settings-done{border:0;cursor:pointer;font-size:10px;padding:10px 16px;margin-top:18px}</style>`)
const settingsBackdrop = document.querySelector<HTMLDivElement>('#settings-backdrop')!
function closeSettings() { settingsBackdrop.hidden = true }
document.querySelector<HTMLButtonElement>('#settings-button')!.addEventListener('click', () => { settingsBackdrop.hidden = false })
document.querySelector<HTMLButtonElement>('#settings-close')!.addEventListener('click', closeSettings)
document.querySelector<HTMLButtonElement>('#settings-done')!.addEventListener('click', closeSettings)
settingsBackdrop.addEventListener('click', event => { if (event.target === settingsBackdrop) closeSettings() })
const chatSection = document.querySelector<HTMLElement>('#chat')!
chatSection.querySelector('.section-head')?.insertAdjacentHTML('afterend', `<div class="status-card"><div><div class="eyebrow">YOUR STATUS</div><strong id="current-status">Online</strong><small>Let friends know what you’re up to.</small></div><div class="status-actions"><button type="button" class="status-option selected" data-status="Online">● Online</button><button type="button" class="status-option" data-status="Busy">Busy</button><button type="button" class="status-option" data-status="Away">Away</button><label class="status-custom"><input id="status-input" maxlength="48" placeholder="Set a status…"><button type="button" id="save-status">Set</button></label></div></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>.status-card{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 14px;padding:15px;background:#1b1d19;border:1px solid #2d302a;border-radius:8px}.status-card strong,.status-card small{display:block}.status-card strong{margin-top:6px;font:700 14px 'Manrope';color:var(--lime)}.status-card small{margin-top:4px;color:#8c8f86;font-size:9px}.status-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.status-option{border:1px solid #3a3c35;background:transparent;color:#aeb2a4;border-radius:5px;padding:7px 9px;font-size:9px;cursor:pointer}.status-option.selected,.status-option:hover{border-color:var(--lime);color:var(--lime);background:#293021}.status-custom{display:flex;gap:5px}.status-custom input{width:140px;border:1px solid #3a3d35;background:#151714;color:#f3f4ed;border-radius:5px;padding:8px;font-size:9px;outline:0}.status-custom input:focus{border-color:var(--lime)}.status-custom button{border:0;border-radius:5px;background:var(--lime);color:#171913;padding:8px 10px;font-size:9px;font-weight:700;cursor:pointer}@media(max-width:760px){.status-card{align-items:flex-start;flex-direction:column}.status-actions{justify-content:flex-start}}</style>`)
const statusCard = document.querySelector<HTMLElement>('.status-card')!
statusCard.insertAdjacentHTML('beforeend', `<div class="status-media"><div class="eyebrow">POST TO STATUS</div><div class="status-media-controls"><label class="media-picker">＋ Add photo or video<input id="status-media-input" type="file" accept="image/*,video/*"></label><button type="button" id="post-status-media" disabled>Post status</button></div><div id="status-media-preview" class="status-media-preview" hidden></div><div id="status-posts" class="status-posts"></div></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>.status-card{flex-wrap:wrap}.status-media{width:100%;padding-top:14px;border-top:1px solid #ffffff0b}.status-media-controls{display:flex;align-items:center;gap:7px;margin-top:8px}.media-picker{display:inline-flex;align-items:center;border:1px solid #3a3c35;color:#c8cac0;border-radius:5px;padding:8px 10px;font-size:9px;cursor:pointer}.media-picker:hover{border-color:var(--lime);color:var(--lime)}.media-picker input{display:none}.status-media-controls>button{border:0;border-radius:5px;background:var(--lime);color:#171913;padding:8px 10px;font-size:9px;font-weight:700;cursor:pointer}.status-media-controls>button:disabled{opacity:.4;cursor:not-allowed}.status-media-preview{margin-top:10px;max-width:280px}.status-media-preview img,.status-media-preview video{display:block;width:100%;max-height:180px;object-fit:cover;border-radius:6px;border:1px solid #34382e}.status-posts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.status-post{width:110px}.status-post img,.status-post video{display:block;width:110px;height:76px;object-fit:cover;border-radius:5px;border:1px solid #34382e}.status-post small{display:block;margin-top:4px;color:#8c8f86;font-size:8px}@media(max-width:760px){.status-media-controls{align-items:stretch;flex-direction:column}.status-media-controls>button{width:max-content}}</style>`)
const statusMediaInput = document.querySelector<HTMLInputElement>('#status-media-input')!
const postStatusMedia = document.querySelector<HTMLButtonElement>('#post-status-media')!
const statusMediaPreview = document.querySelector<HTMLElement>('#status-media-preview')!
const statusPosts = document.querySelector<HTMLElement>('#status-posts')!
let selectedStatusMedia: File | null = null
let selectedStatusMediaUrl: string | null = null
statusMediaInput.addEventListener('change', () => { const file = statusMediaInput.files?.[0]; if (!file) return; selectedStatusMedia = file; if (selectedStatusMediaUrl) URL.revokeObjectURL(selectedStatusMediaUrl); selectedStatusMediaUrl = URL.createObjectURL(file); statusMediaPreview.hidden = false; statusMediaPreview.innerHTML = file.type.startsWith('video/') ? `<video src="${selectedStatusMediaUrl}" controls></video>` : `<img src="${selectedStatusMediaUrl}" alt="Status preview">`; postStatusMedia.disabled = false })
postStatusMedia.addEventListener('click', () => { if (!selectedStatusMedia || !selectedStatusMediaUrl) return; const post = document.createElement('article'); post.className = 'status-post'; post.innerHTML = selectedStatusMedia.type.startsWith('video/') ? `<video src="${selectedStatusMediaUrl}" controls></video><small>Video status · just now</small>` : `<img src="${selectedStatusMediaUrl}" alt="Posted status"><small>Photo status · just now</small>`; statusPosts.prepend(post); showToast(`${selectedStatusMedia.type.startsWith('video/') ? 'Video' : 'Photo'} status posted ✨`); selectedStatusMedia = null; selectedStatusMediaUrl = null; statusMediaInput.value = ''; statusMediaPreview.hidden = true; statusMediaPreview.innerHTML = ''; postStatusMedia.disabled = true })
const currentStatus = document.querySelector<HTMLElement>('#current-status')!
const statusInput = document.querySelector<HTMLInputElement>('#status-input')!
function setStatus(status: string, notify = true) { currentStatus.textContent = status; document.querySelectorAll<HTMLButtonElement>('.status-option').forEach(button => button.classList.toggle('selected', button.dataset.status === status)); localStorage.setItem('kaltv_status', status); if (notify) showToast(`Status set to ${status}`) }
document.querySelectorAll<HTMLButtonElement>('.status-option').forEach(button => button.addEventListener('click', () => setStatus(button.dataset.status ?? 'Online')))
document.querySelector<HTMLButtonElement>('#save-status')!.addEventListener('click', () => { const status = statusInput.value.trim(); if (status) { setStatus(status); statusInput.value = '' } })
statusInput.addEventListener('keydown', event => { if (event.key === 'Enter') document.querySelector<HTMLButtonElement>('#save-status')!.click() })
const savedStatus = localStorage.getItem('kaltv_status'); if (savedStatus) setStatus(savedStatus, false)
const voiceRecorder = document.querySelector<HTMLElement>('.voice-recorder')!
voiceRecorder.insertAdjacentHTML('beforebegin', `<div class="chat-toolbar"><button type="button" data-chat-call="voice">☎ Voice call</button><button type="button" data-chat-call="video">▣ Video call</button></div><div class="chat-compose"><input id="chat-message-input" placeholder="Type a message…" autocomplete="off"><button type="button" id="send-chat-message">Send</button></div>`)
document.querySelector<HTMLElement>('.chat-compose')!.insertAdjacentHTML('afterbegin', '<label class="chat-media-button" title="Send a picture or video">＋<input id="chat-media-input" type="file" accept="image/*,video/*" hidden></label>')
const chatMessageInput = document.querySelector<HTMLInputElement>('#chat-message-input')!
const chatMediaInput = document.querySelector<HTMLInputElement>('#chat-media-input')!
const chatMessages = document.querySelector<HTMLElement>('.chat-messages')!
const conversationHistory = new Map<string, Node[]>([['direct', Array.from(chatMessages.childNodes).map(node => node.cloneNode(true))]])
let activeConversation = 'direct'

// Keep direct messages available as a right-side panel without changing the rest of the layout.
document.head.insertAdjacentHTML('beforeend', `<style>
  .chat-backdrop{place-items:stretch end;padding:0 0 0 20px}
  .chat-modal{height:100%;min-height:100vh;max-height:none;margin-left:auto;border-radius:12px 0 0 12px}
  @media(max-width:760px){.chat-backdrop{padding:0}.chat-modal{width:100%;border-radius:0}}
</style>`)

function initHamburger() {
  const btn = document.getElementById('hamburger-btn') as HTMLButtonElement
  const menu = document.getElementById('mobile-menu') as HTMLElement
  const backdrop = document.getElementById('mobile-backdrop') as HTMLElement
  if (!btn || !menu) return
  btn.style.pointerEvents = 'auto'
  btn.style.zIndex = '99999'
  btn.style.cursor = 'pointer'
  menu.classList.add('hidden')
  menu.setAttribute('hidden', '')
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    console.log('HAMBURGER CLICKED - OPENING MENU')
    const isHidden = menu.hasAttribute('hidden')
    if (isHidden) { menu.classList.remove('hidden'); menu.classList.add('flex'); menu.removeAttribute('hidden'); backdrop?.removeAttribute('hidden'); menu.style.display = 'flex' }
    else { menu.classList.add('hidden'); menu.classList.remove('flex'); menu.setAttribute('hidden', ''); backdrop?.setAttribute('hidden', ''); menu.style.display = 'none' }
    btn.setAttribute('aria-expanded', String(isHidden))
  })
  backdrop?.addEventListener('click', () => { menu.classList.add('hidden'); menu.classList.remove('flex'); menu.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); menu.style.display = 'none'; btn.setAttribute('aria-expanded', 'false') })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hasAttribute('hidden')) { menu.classList.add('hidden'); menu.classList.remove('flex'); menu.setAttribute('hidden', ''); backdrop?.setAttribute('hidden', ''); menu.style.display = 'none'; btn.setAttribute('aria-expanded', 'false') } })
}
setTimeout(initHamburger, 500)

document.head.insertAdjacentHTML('beforeend', `<style>
  .chat-media-button{display:grid;place-items:center;width:38px;flex:0 0 38px;border:1px solid #3a3d35;background:#282b24;color:#c8f169;border-radius:6px;font-size:20px;line-height:1;cursor:pointer}
  .chat-media-button:hover{border-color:var(--lime);background:#343a2b}
  .media-message{display:grid;gap:6px;max-width:82%;overflow:hidden}
  .media-message img,.media-message video{display:block;width:min(300px,100%);max-height:240px;object-fit:cover;border-radius:7px;background:#11130f}
  .media-message small{font-size:9px;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>`)

function stopGuestCamera() {
  guestStream?.getTracks().forEach(track => track.stop())
  guestStream = null
  guestPreview.srcObject = null
  guestPreview.hidden = true
  liveVideoStage.classList.remove('has-guest')
  guestInvitePanel.hidden = true
  guestAcceptedPanel.hidden = true
  inviteGuest.hidden = true
  shareLive.hidden = true
}

startLive.addEventListener('click', () => {
  inviteGuest.hidden = false
  shareLive.hidden = false
})
document.body.insertAdjacentHTML('beforeend', `<div class="reel-viewer" id="reel-viewer" hidden><section class="reel-viewer-card"><button class="auth-close" id="reel-viewer-close" type="button" aria-label="Close reel">×</button><div class="reel-viewer-media" id="reel-viewer-media"></div><div class="reel-viewer-copy"><span class="live-pill">REEL</span><h2 id="reel-viewer-title"></h2><small id="reel-viewer-meta"></small></div></section></div>`)
const reelViewer = document.querySelector<HTMLDivElement>('#reel-viewer')!
const reelViewerMedia = document.querySelector<HTMLElement>('#reel-viewer-media')!
const reelViewerTitle = document.querySelector<HTMLElement>('#reel-viewer-title')!
const reelViewerMeta = document.querySelector<HTMLElement>('#reel-viewer-meta')!
const closeReelViewer = () => { reelViewer.hidden = true }
document.querySelector<HTMLButtonElement>('#reel-viewer-close')!.addEventListener('click', closeReelViewer)
reelViewer.addEventListener('click', event => { if (event.target === reelViewer) closeReelViewer() })
document.querySelectorAll<HTMLElement>('.reel-card').forEach(reel => reel.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('button,input')) return
  const title = reel.querySelector<HTMLElement>('.reel-overlay b')?.textContent ?? 'KalTV Reel'
  const meta = reel.querySelector<HTMLElement>('.reel-overlay small')?.textContent ?? 'Watch this moment on KalTV'
  reelViewerMedia.style.backgroundImage = getComputedStyle(reel).backgroundImage
  reelViewerTitle.textContent = title
  reelViewerMeta.textContent = meta
  reelViewer.hidden = false
}))
stopLive.addEventListener('click', stopGuestCamera)
document.querySelector<HTMLButtonElement>('#live-close')!.addEventListener('click', stopGuestCamera)
liveBackdrop.addEventListener('click', event => { if (event.target === liveBackdrop) stopGuestCamera() })
inviteGuest.addEventListener('click', () => { guestInvitePanel.hidden = false; guestName.focus() })
cancelGuestInvite.addEventListener('click', () => { guestInvitePanel.hidden = true })
confirmGuestInvite.addEventListener('click', async () => {
  try {
    guestStream?.getTracks().forEach(track => track.stop())
    guestStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    guestPreview.srcObject = guestStream
    guestPreview.hidden = false
    liveVideoStage.classList.add('has-guest')
    guestInvitePanel.hidden = true
    guestAcceptedName.textContent = guestName.value.trim() || 'Guest'
    guestAcceptedPanel.hidden = false
    liveRoomCategory.textContent = `${liveCategory.value} Â· 2 viewers`
    showToast('Guest camera joined the live ✨')
  } catch {
    showToast('Guest camera permission was cancelled')
  }
})
removeGuest.addEventListener('click', () => { stopGuestCamera(); if (!liveRoom.hidden) { inviteGuest.hidden = false; shareLive.hidden = false }; showToast('Guest left the live') })
shareLive.addEventListener('click', async () => {
  const shareData = { title: liveRoomTitle.textContent || 'Live on KalTV', text: 'Join my live stream on KalTV', url: `${window.location.href.split('#')[0]}#live` }
  try {
    if (navigator.share) await navigator.share(shareData)
    else { await navigator.clipboard.writeText(shareData.url); showToast('Live link copied ✨') }
  } catch { showToast('Live sharing cancelled') }
})

const liveRoomVisibilityObserver = new MutationObserver(() => {
  liveModal.classList.toggle('live-active', !liveRoom.hidden)
})
liveRoomVisibilityObserver.observe(liveRoom, { attributes: true, attributeFilter: ['hidden'] })

document.querySelectorAll<HTMLButtonElement>('[data-chat-call]').forEach(button => button.addEventListener('click', () => showToast(`${button.dataset.chatCall === 'video' ? 'Video call' : 'Voice call'} started with ${chatTitle.textContent?.replace('Chat with ', '') ?? 'your friend'} ✨`)))
document.querySelector<HTMLButtonElement>('#send-chat-message')!.addEventListener('click', () => { const message = chatMessageInput.value.trim(); if (!message) return; const bubble = document.createElement('div'); bubble.className = 'chat-message sent'; bubble.textContent = message; chatMessages.appendChild(bubble); chatMessageInput.value = ''; chatMessages.scrollTop = chatMessages.scrollHeight })
chatMediaInput.addEventListener('change', () => {
  const file = chatMediaInput.files?.[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  const bubble = document.createElement('div')
  bubble.className = 'chat-message sent media-message'
  if (file.type.startsWith('video/')) {
    const video = document.createElement('video')
    video.src = url
    video.controls = true
    video.playsInline = true
    video.preload = 'metadata'
    bubble.append(video)
  } else {
    const image = document.createElement('img')
    image.src = url
    image.alt = 'Shared picture'
    bubble.append(image)
  }
  const caption = document.createElement('small')
  caption.textContent = file.name
  bubble.append(caption)
  chatMessages.appendChild(bubble)
  chatMediaInput.value = ''
  chatMessages.scrollTop = chatMessages.scrollHeight
  showToast(`${file.type.startsWith('video/') ? 'Video' : 'Picture'} sent ✨`)
})
chatMessageInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); document.querySelector<HTMLButtonElement>('#send-chat-message')!.click() } })
const chatBackdrop = document.querySelector<HTMLDivElement>('#chat-backdrop')!
const chatTitle = document.querySelector<HTMLElement>('#chat-title')!
const chatMode = document.querySelector<HTMLElement>('.chat-modal .eyebrow')!
function openConversation(key: string, title: string, group = false) {
  conversationHistory.set(activeConversation, Array.from(chatMessages.childNodes).map(node => node.cloneNode(true)))
  activeConversation = key
  const savedMessages = conversationHistory.get(key) ?? [document.createTextNode('')]
  if (!conversationHistory.has(key)) {
    const welcome = document.createElement('div')
    welcome.className = 'chat-message received'
    welcome.textContent = 'Welcome to the group chat!'
    conversationHistory.set(key, [welcome])
  }
  chatMessages.replaceChildren(...(conversationHistory.get(key) ?? savedMessages).map(node => node.cloneNode(true)))
  chatTitle.textContent = group ? `Group chat · ${title}` : `Chat with ${title}`
  chatMode.textContent = group ? 'GROUP CHAT ROOM' : 'DIRECT CHAT'
  resetVoiceRecorder()
  chatBackdrop.hidden = false
}
function openCreatorChat(creator: string) {
  openConversation('direct', creator)
  chatMessageInput.focus()
}
const voiceStatus = document.querySelector<HTMLElement>('#voice-status')!
const recordButton = document.querySelector<HTMLButtonElement>('#record-voice')!
const recordTime = document.querySelector<HTMLElement>('#record-time')!
const voicePreview = document.querySelector<HTMLAudioElement>('#voice-preview')!
const discardVoice = document.querySelector<HTMLButtonElement>('#discard-voice')!
const sendVoice = document.querySelector<HTMLButtonElement>('#send-voice')!
let mediaRecorder: MediaRecorder | null = null
let voiceChunks: Blob[] = []
let voiceUrl: string | null = null
let recordTimer: number | undefined
let recordSeconds = 0
function resetVoiceRecorder() { if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); mediaRecorder = null; voiceChunks = []; if (voiceUrl) URL.revokeObjectURL(voiceUrl); voiceUrl = null; voicePreview.hidden = true; voicePreview.removeAttribute('src'); discardVoice.hidden = true; sendVoice.hidden = true; recordButton.classList.remove('recording'); recordTime.textContent = '00:00'; voiceStatus.textContent = 'Tap the mic to record a voice message'; window.clearInterval(recordTimer) }
document.querySelectorAll<HTMLButtonElement>('[data-chat]').forEach(button => button.addEventListener('click', () => { const title = button.dataset.chat ?? 'Chat'; openConversation(title === 'Late Night Crew' ? 'group' : 'direct', title, title === 'Late Night Crew'); chatMessageInput.focus() }))
document.querySelector<HTMLButtonElement>('#chat-close')!.addEventListener('click', () => { chatBackdrop.hidden = true; resetVoiceRecorder() })
chatBackdrop.addEventListener('click', event => { if (event.target === chatBackdrop) { chatBackdrop.hidden = true; resetVoiceRecorder() } })
recordButton.addEventListener('click', async () => {
  if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); return }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { voiceStatus.textContent = 'Voice recording is not supported in this browser'; return }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream); voiceChunks = []; recordSeconds = 0; recordTime.textContent = '00:00'; recordButton.classList.add('recording'); voiceStatus.textContent = 'Recording… tap the mic to stop'; window.clearInterval(recordTimer); recordTimer = window.setInterval(() => { recordSeconds += 1; recordTime.textContent = `${String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:${String(recordSeconds % 60).padStart(2, '0')}` }, 1000)
    mediaRecorder.addEventListener('dataavailable', event => { if (event.data.size) voiceChunks.push(event.data) })
    mediaRecorder.addEventListener('stop', () => { stream.getTracks().forEach(track => track.stop()); window.clearInterval(recordTimer); recordButton.classList.remove('recording'); if (!voiceChunks.length) return; voiceUrl = URL.createObjectURL(new Blob(voiceChunks, { type: 'audio/webm' })); voicePreview.src = voiceUrl; voicePreview.hidden = false; discardVoice.hidden = false; sendVoice.hidden = false; voiceStatus.textContent = 'Voice message ready to send' })
    mediaRecorder.start()
  } catch { voiceStatus.textContent = 'Microphone access was cancelled or unavailable' }
})
discardVoice.addEventListener('click', resetVoiceRecorder)
sendVoice.addEventListener('click', () => { chatBackdrop.hidden = true; resetVoiceRecorder(); showToast('Voice message sent ✨') })
renderStreams()
// Keep the live stream chat beside the preview instead of pushing it below the stream.
document.head.insertAdjacentHTML('beforeend', `<style>
  .live-backdrop{overflow:auto}
  .live-modal{width:min(560px,calc(100vw - 40px));max-height:calc(100vh - 40px);overflow-y:auto;padding:20px}
  .live-modal.live-active{padding-right:340px}
  .live-backdrop:has(.live-modal.live-active){padding:0}
  .live-modal.live-active{width:100%;height:100%;max-width:none;max-height:none;border-radius:0;padding:32px 340px 32px 32px}
  .live-modal.live-active video{height:calc(100vh - 255px);aspect-ratio:auto}
  .live-video-stage{display:grid;grid-template-columns:1fr;gap:10px;width:100%;flex:1;min-height:0}
  .live-video-stage.has-guest{grid-template-columns:repeat(2,minmax(0,1fr))}
  .live-video-stage video{width:100%;height:75vh;min-height:500px;aspect-ratio:auto;object-fit:cover;border-radius:12px;background:#000;flex:1}
  .live-modal.live-active .live-video-stage video{height:75vh;min-height:500px;aspect-ratio:auto}
  .live-video-stage .guest-preview{border:2px solid #c8f169;box-shadow:0 8px 25px #0009}
  .guest-invite-panel{position:fixed;z-index:100;right:12px;bottom:20px;top:auto;left:auto;transform:none;width:210px;max-width:210px;max-height:60px;overflow:hidden;padding:8px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;box-shadow:none}
  .guest-invite-panel #guest-invite-close{position:absolute;top:4px;right:6px;background:none;border:0;color:#fff;font-size:14px;line-height:14px;cursor:pointer}
  .guest-invite-panel[hidden]{display:none}
  .guest-invite-panel h3{font:700 10px 'Manrope';margin:0 0 4px;color:#666}
  .guest-invite-panel p{display:none}
  .guest-invite-panel input{width:100%;border:0;background:#222;color:#aaa;border-radius:4px;padding:4px;font-size:9px;outline:0;margin-bottom:4px}
  .guest-invite-panel input:focus{border-color:#c8f169}
  .guest-invite-panel>div:last-child{display:flex;justify-content:flex-end;gap:8px}
  .guest-invite-panel>div:last-child{gap:3px}.guest-invite-panel>div:last-child button{padding:3px 5px;font-size:8px}
  .game-setup{display:flex;align-items:end;gap:9px;flex-wrap:wrap;margin:12px 0;padding:12px;background:#171b14;border:1px solid #303b28;border-radius:8px}
  .game-setup[hidden]{display:none}
  .game-setup label{display:grid;gap:6px;flex:1;min-width:190px;color:#b7baae;font-size:10px}
  .game-setup select{border:1px solid #414833;background:#11130f;color:#f3f4ed;border-radius:6px;padding:10px;font-size:11px}
  .game-setup small{width:100%;color:#8f9b7e;font-size:9px}
  .guest-accepted-panel{display:flex;align-items:center;gap:9px;margin-top:12px;padding:11px 13px;background:#26321f;border:1px solid #59733a;border-radius:8px}
  .guest-accepted-panel[hidden]{display:none}
  .guest-accepted-panel strong{font-size:11px;color:#e3f4bc}
  .guest-accepted-panel small{flex:1;color:#aeb99a;font-size:9px}
  .guest-accepted-panel .chat-button{margin-left:auto}
  .live-modal.live-active .live-room{top:145px;right:32px;bottom:32px;width:290px}
  .live-room{position:absolute;top:145px;right:27px;bottom:27px;width:290px;overflow:auto;margin-top:0}
  .live-room{display:flex;flex-direction:column}
  .live-room .live-chat{flex:0 1 auto;height:clamp(180px,42vh,360px);min-height:0;max-height:none}
  .live-room .live-chat{scrollbar-width:thin;scrollbar-color:#4a5140 transparent;background:#11130f;border-color:#3a4030;gap:3px;padding:12px}
  .live-room .live-chat-message{display:block;padding:7px 8px;border-radius:6px;font-size:11px;line-height:1.5;transition:background .15s}
  .live-room .live-chat-message:hover{background:#20251a}
  .live-room .live-chat-message b{display:inline;color:#c8f169;font-size:10px;font-weight:800;margin-right:7px}
  .live-room .live-chat-message b:after{content:':' ;color:#72796a}
  .live-room .live-chat-message span{color:#e4e8dc}
  .live-room .live-chat-form{background:#1a1d17;padding-top:10px;position:sticky;bottom:0}
  .live-room .live-chat-form input{background:#0f110e;border-color:#414833;padding:11px 12px}
  .live-room .live-chat-form input:focus{border-color:#c8f169;box-shadow:0 0 0 2px #c8f1691a}
  .live-room .live-chat-form button{min-width:58px;box-shadow:0 4px 12px #0005}
  @media(max-width:760px){
    .live-modal{width:100%;max-height:calc(100vh - 40px);padding-right:20px}
    .live-backdrop:has(.live-modal.live-active){padding:0}
    .live-modal.live-active{width:100%;height:auto;min-height:100vh;padding:20px;border-radius:0}
    .live-modal.live-active video{height:75vh;min-height:360px;width:100%;aspect-ratio:auto}
    .live-video-stage.has-guest{grid-template-columns:1fr}
    .live-room,.live-modal.live-active .live-room{position:static;width:auto;max-height:none;overflow:visible;margin-top:18px}
    .live-room .live-chat{height:130px;max-height:none}
    .guest-invite-panel{width:210px;max-width:210px;right:12px;bottom:20px;max-height:60px}
  }
</style>`)
document.head.insertAdjacentHTML('beforeend', `<style>
  .reel-actions{position:absolute;right:12px;bottom:12px;display:flex;gap:5px;z-index:2}
  .reel-action{border:1px solid #ffffff3d;background:#11130dcc;color:#f2f4ec;border-radius:14px;padding:6px 8px;font-size:9px;cursor:pointer;backdrop-filter:blur(8px)}
  .reel-action:hover,.reel-action.is-liked{border-color:#c8f169;color:#c8f169;background:#20291acc}
  .reel-action.is-liked{color:#ff8e88;border-color:#ff8e88}
  .reel-comment-box{position:absolute;left:12px;right:12px;bottom:48px;display:flex;gap:5px;z-index:3}
  .reel-comment-box[hidden]{display:none}
  .reel-comment-box input{min-width:0;flex:1;border:1px solid #ffffff45;background:#11130ee8;color:#fff;border-radius:14px;padding:7px 9px;font-size:9px;outline:0}
  .reel-comment-box button{border:0;border-radius:14px;background:#c8f169;color:#171913;padding:0 9px;font-size:9px;font-weight:700;cursor:pointer}
</style>`)
document.querySelectorAll<HTMLElement>('.reel-card').forEach((reel, index) => {
  const reelId = `reel-${index + 1}`
  reel.insertAdjacentHTML('beforeend', `<div class="reel-comment-box" id="${reelId}-comment-box" hidden><input placeholder="Write a comment…" maxlength="120"><button type="button">Post</button></div><div class="reel-actions"><button class="reel-action" data-reel-open type="button">▶ View</button><button class="reel-action" data-reel-like type="button">♡ Like <span>0</span></button><button class="reel-action" data-reel-comment type="button">💬 Comment <span>0</span></button><button class="reel-action" data-reel-share type="button">↗ Share</button></div>`)
  const open = reel.querySelector<HTMLButtonElement>('[data-reel-open]')!
  const like = reel.querySelector<HTMLButtonElement>('[data-reel-like]')!
  const comment = reel.querySelector<HTMLButtonElement>('[data-reel-comment]')!
  const share = reel.querySelector<HTMLButtonElement>('[data-reel-share]')!
  const commentBox = reel.querySelector<HTMLElement>('.reel-comment-box')!
  const commentInput = reel.querySelector<HTMLInputElement>('.reel-comment-box input')!
  const commentSubmit = reel.querySelector<HTMLButtonElement>('.reel-comment-box button')!
  const openReel = () => { const title = reel.querySelector<HTMLElement>('.reel-overlay b')?.textContent ?? 'KalTV Reel'; const meta = reel.querySelector<HTMLElement>('.reel-overlay small')?.textContent ?? 'Watch this moment on KalTV'; reelViewerMedia.style.backgroundImage = getComputedStyle(reel).backgroundImage; reelViewerTitle.textContent = title; reelViewerMeta.textContent = meta; reelViewer.hidden = false }
  open.addEventListener('click', openReel)
  like.addEventListener('click', () => { const liked = like.classList.toggle('is-liked'); like.innerHTML = `${liked ? '♥' : '♡'} Like <span>${liked ? 1 : 0}</span>` })
  comment.addEventListener('click', () => { commentBox.hidden = !commentBox.hidden; if (!commentBox.hidden) commentInput.focus() })
  const postComment = () => { const value = commentInput.value.trim(); if (!value) return; comment.innerHTML = `💬 Comment <span>1</span>`; commentBox.hidden = true; commentInput.value = ''; showToast('Comment added to the reel ✨') }
  commentSubmit.addEventListener('click', postComment)
  commentInput.addEventListener('keydown', event => { if (event.key === 'Enter') postComment() })
  share.addEventListener('click', async () => { const shareData = { title: 'KalTV Reel', text: 'Watch this Reel on KalTV', url: `${window.location.href.split('#')[0]}#reels` }; try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); showToast('Reel link copied ✨') } } catch { showToast('Reel sharing cancelled') } })
})
document.head.insertAdjacentHTML('beforeend', `<style>
  .reel-viewer{position:fixed;inset:0;z-index:140;display:grid;place-items:center;padding:24px;background:#080908d9;backdrop-filter:blur(10px)}
  .reel-viewer[hidden]{display:none}
  .reel-viewer-card{position:relative;width:min(760px,100%);overflow:hidden;background:#1b1d19;border:1px solid #3b4033;border-radius:12px;box-shadow:0 20px 70px #000b}
  .reel-viewer-media{height:min(560px,70vh);background-position:center;background-size:cover}
  .reel-viewer-copy{padding:18px 20px 20px}.reel-viewer-copy h2{font:700 22px 'Manrope';margin:9px 0 5px}.reel-viewer-copy small{color:#aeb3a5;font-size:10px}
  .reel-card{cursor:pointer}
  @media(max-width:600px){.reel-viewer{padding:12px}.reel-viewer-media{height:60vh}}
</style>`)
document.body.insertAdjacentHTML('beforeend', `<div class="reel-create-backdrop" id="reel-create-backdrop" hidden><section class="reel-create-modal" role="dialog" aria-modal="true" aria-labelledby="reel-create-title"><button class="auth-close" id="reel-create-close" type="button" aria-label="Close">×</button><div class="eyebrow">CREATE A REEL</div><h2 id="reel-create-title">Share your next moment</h2><p>Choose a title and publish a new Reel for your viewers.</p><input id="new-reel-title" placeholder="Reel title" maxlength="80"><textarea id="new-reel-caption" placeholder="Tell viewers what happened…" maxlength="180"></textarea><button class="signup" id="publish-reel" type="button">Publish Reel ↗</button></section></div>`)
document.head.insertAdjacentHTML('beforeend', `<style>
  .reel-create-backdrop{position:fixed;inset:0;z-index:145;display:grid;place-items:center;padding:20px;background:#080908d9;backdrop-filter:blur(9px)}
  .reel-create-backdrop[hidden]{display:none}.reel-create-modal{width:min(450px,100%);position:relative;background:#20221e;border:1px solid #3b4033;border-radius:12px;padding:27px;box-shadow:0 20px 70px #000b}.reel-create-modal h2{font:700 25px 'Manrope';margin:10px 0 8px}.reel-create-modal p{color:#9b9e94;font-size:11px;line-height:1.5;margin:0 0 18px}.reel-create-modal input,.reel-create-modal textarea{width:100%;border:1px solid #3a3d35;background:#151714;color:#f3f4ed;border-radius:6px;padding:11px;font-size:11px;outline:0;margin-bottom:10px}.reel-create-modal textarea{min-height:100px;resize:vertical}.reel-create-modal input:focus,.reel-create-modal textarea:focus{border-color:var(--lime)}.reel-create-modal .signup{width:100%;padding:11px}
</style>`)
const createReelButton = document.querySelector<HTMLButtonElement>('#create-reel')!
const reelCreateBackdrop = document.querySelector<HTMLDivElement>('#reel-create-backdrop')!
createReelButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); reelCreateBackdrop.hidden = false; document.querySelector<HTMLInputElement>('#new-reel-title')!.focus() }, true)
document.querySelector<HTMLButtonElement>('#reel-create-close')!.addEventListener('click', () => { reelCreateBackdrop.hidden = true })
reelCreateBackdrop.addEventListener('click', event => { if (event.target === reelCreateBackdrop) reelCreateBackdrop.hidden = true })
document.querySelector<HTMLButtonElement>('#publish-reel')!.addEventListener('click', () => { const title = document.querySelector<HTMLInputElement>('#new-reel-title')!.value.trim() || 'Untitled Reel'; reelCreateBackdrop.hidden = true; showToast(`${title} is ready to share ✨`) })
const reelCreateModal = document.querySelector<HTMLElement>('.reel-create-modal')!
reelCreateModal.querySelector('textarea')?.insertAdjacentHTML('afterend', '<label class="reel-video-upload"><span>Reel video</span><input id="new-reel-video" type="file" accept="video/*"><small>Choose an MP4 or other video from your device.</small></label><video id="new-reel-video-preview" class="new-reel-video-preview" controls muted hidden></video>')
const reelVideoInput = document.querySelector<HTMLInputElement>('#new-reel-video')!
const reelVideoPreview = document.querySelector<HTMLVideoElement>('#new-reel-video-preview')!
let reelVideoUrl: string | null = null
reelVideoInput.addEventListener('change', () => {
  const file = reelVideoInput.files?.[0]
  if (!file) return
  if (reelVideoUrl) URL.revokeObjectURL(reelVideoUrl)
  reelVideoUrl = URL.createObjectURL(file)
  reelVideoPreview.src = reelVideoUrl
  reelVideoPreview.hidden = false
})
document.head.insertAdjacentHTML('beforeend', `<style>
  .reel-video-upload{display:grid;gap:6px;margin:2px 0 12px;color:#c7cbbf;font-size:10px}
  .reel-video-upload input{margin:0;padding:8px;font-size:10px}
  .reel-video-upload small{color:#8f9489;font-size:9px}
  .new-reel-video-preview{width:100%;max-height:220px;object-fit:contain;background:#11130f;border:1px solid #3a3d35;border-radius:7px;margin:0 0 12px}
  .custom-reel{background:#11130f}.uploaded-reel-video{display:block;width:100%;height:100%;min-height:205px;object-fit:cover;background:#11130f}.custom-reel .reel-overlay{z-index:2}
</style>`)
document.querySelector<HTMLButtonElement>('#publish-reel')!.addEventListener('click', event => {
  event.preventDefault()
  event.stopImmediatePropagation()
  const file = reelVideoInput.files?.[0]
  if (!file) { showToast('Choose a video for your Reel first'); return }
  const title = document.querySelector<HTMLInputElement>('#new-reel-title')!.value.trim() || 'Untitled Reel'
  const caption = document.querySelector<HTMLTextAreaElement>('#new-reel-caption')!.value.trim() || 'New moment from KalTV'
  const uploadedReel = document.createElement('article')
  uploadedReel.className = 'reel-card custom-reel'
  uploadedReel.innerHTML = `<video class="uploaded-reel-video" src="${reelVideoUrl}" muted loop playsinline controls></video><div class="reel-overlay"><span class="live-pill">NEW</span><b></b><small></small></div>`
  uploadedReel.querySelector('b')!.textContent = title
  uploadedReel.querySelector('small')!.textContent = `@you · ${caption}`
  document.querySelector('.reel-row')!.prepend(uploadedReel)
  const statusPosts = document.querySelector<HTMLElement>('#status-posts')
  if (statusPosts) { const statusPost = document.createElement('article'); statusPost.className = 'status-post'; statusPost.innerHTML = `<video src="${reelVideoUrl}" controls></video><small>Reel status · just now</small>`; statusPosts.prepend(statusPost) }
  const currentStatus = document.querySelector<HTMLElement>('#current-status')
  if (currentStatus) currentStatus.textContent = `Shared a new Reel: ${title}`
  reelCreateBackdrop.hidden = true
  showToast(`${file.name} is ready to share as a Reel ✨`)
}, true)
document.head.insertAdjacentHTML('beforeend', `<style>
  .status-post{width:220px;background:#20231d;border:1px solid #343a2d;border-radius:8px;padding:7px}
  .status-post img,.status-post video{width:100%;height:135px;border-radius:6px}
  .status-post small{font-size:9px;color:#c5cbbd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .status-engagement{display:flex;gap:5px;margin-top:7px}.status-engagement button{border:1px solid #3a4033;background:#171a15;color:#bfc5b6;border-radius:12px;padding:5px 7px;font-size:9px;cursor:pointer}.status-engagement button:hover,.status-engagement .is-liked{border-color:var(--lime);color:var(--lime)}
  .status-comment-box{display:flex;gap:4px;margin-top:6px}.status-comment-box[hidden]{display:none}.status-comment-box input{min-width:0;flex:1;border:1px solid #3a4033;background:#11130f;color:#f3f4ed;border-radius:12px;padding:6px 8px;font-size:9px;outline:0}.status-comment-box button{border:0;border-radius:12px;background:var(--lime);color:#171913;padding:0 8px;font-size:9px;font-weight:700;cursor:pointer}
  @media(max-width:760px){.status-post{width:100%;max-width:280px}}
</style>`)
const decorateStatusPost = (post: HTMLElement) => {
  if (post.querySelector('.status-engagement')) return
  post.insertAdjacentHTML('beforeend', '<div class="status-engagement"><button type="button" data-status-like>♡ Like <span>0</span></button><button type="button" data-status-comment>💬 Comment <span>0</span></button></div><div class="status-comment-box" hidden><input placeholder="Comment to this user…" maxlength="120"><button type="button">Send</button></div>')
  const like = post.querySelector<HTMLButtonElement>('[data-status-like]')!
  const comment = post.querySelector<HTMLButtonElement>('[data-status-comment]')!
  const box = post.querySelector<HTMLElement>('.status-comment-box')!
  const input = box.querySelector<HTMLInputElement>('input')!
  const send = box.querySelector<HTMLButtonElement>('button')!
  like.addEventListener('click', () => { const liked = like.classList.toggle('is-liked'); like.innerHTML = `${liked ? '♥' : '♡'} Like <span>${liked ? 1 : 0}</span>` })
  comment.addEventListener('click', () => { box.hidden = !box.hidden; if (!box.hidden) input.focus() })
  const sendComment = () => { if (!input.value.trim()) return; comment.innerHTML = `💬 Comment <span>1</span>`; input.value = ''; box.hidden = true; showToast('Comment sent to this user ✨') }
  send.addEventListener('click', sendComment)
  input.addEventListener('keydown', event => { if (event.key === 'Enter') sendComment() })
}
const statusPostObserver = new MutationObserver(() => statusPosts.querySelectorAll<HTMLElement>('.status-post').forEach(decorateStatusPost))
statusPostObserver.observe(statusPosts, { childList: true })
statusPosts.querySelectorAll<HTMLElement>('.status-post').forEach(decorateStatusPost)
statusCard.insertAdjacentHTML('afterbegin', '<div class="text-status-engagement"><div class="eyebrow">STATUS ENGAGEMENT</div><div><button type="button" id="text-status-like">♡ Like <span>0</span></button><button type="button" id="text-status-comment">💬 Comment <span>0</span></button><button type="button" id="text-status-share">↗ Share</button></div><div id="text-status-comment-box" hidden><input id="text-status-comment-input" placeholder="Comment to this user…" maxlength="120"><button type="button" id="text-status-comment-send">Send</button></div></div>')
document.head.insertAdjacentHTML('beforeend', `<style>
  .text-status-engagement{width:100%;padding:12px 0 0;border-top:1px solid #ffffff0b}.text-status-engagement>div:nth-child(2){display:flex;gap:6px;margin-top:8px}.text-status-engagement button{border:1px solid #3a4033;background:#171a15;color:#bfc5b6;border-radius:12px;padding:6px 9px;font-size:9px;cursor:pointer}.text-status-engagement button:hover,.text-status-engagement button.is-liked{border-color:var(--lime);color:var(--lime)}.text-status-engagement #text-status-comment-box{display:flex;gap:5px;margin-top:7px}.text-status-engagement #text-status-comment-box[hidden]{display:none}.text-status-engagement input{min-width:0;flex:1;border:1px solid #3a4033;background:#11130f;color:#f3f4ed;border-radius:12px;padding:7px 9px;font-size:9px;outline:0}.text-status-engagement #text-status-comment-send{border:0;background:var(--lime);color:#171913}
</style>`)
const textStatusLike = document.querySelector<HTMLButtonElement>('#text-status-like')!
const textStatusComment = document.querySelector<HTMLButtonElement>('#text-status-comment')!
const textStatusShare = document.querySelector<HTMLButtonElement>('#text-status-share')!
const textStatusCommentBox = document.querySelector<HTMLElement>('#text-status-comment-box')!
const textStatusCommentInput = document.querySelector<HTMLInputElement>('#text-status-comment-input')!
const sendTextStatusComment = () => { if (!textStatusCommentInput.value.trim()) return; textStatusComment.innerHTML = '💬 Comment <span>1</span>'; textStatusCommentInput.value = ''; textStatusCommentBox.hidden = true; showToast('Comment sent to this user ✨') }
textStatusLike.addEventListener('click', () => { const liked = textStatusLike.classList.toggle('is-liked'); textStatusLike.innerHTML = `${liked ? '♥' : '♡'} Like <span>${liked ? 1 : 0}</span>` })
textStatusComment.addEventListener('click', () => { textStatusCommentBox.hidden = !textStatusCommentBox.hidden; if (!textStatusCommentBox.hidden) textStatusCommentInput.focus() })
document.querySelector<HTMLButtonElement>('#text-status-comment-send')!.addEventListener('click', sendTextStatusComment)
textStatusCommentInput.addEventListener('keydown', event => { if (event.key === 'Enter') sendTextStatusComment() })
textStatusShare.addEventListener('click', async () => { const shareData = { title: 'My KalTV status', text: currentStatus.textContent || 'See my status on KalTV', url: `${window.location.href.split('#')[0]}#chat` }; try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareData.url); showToast('Status link copied ✨') } } catch { showToast('Status sharing cancelled') } })
const textStatusEngagement = document.querySelector<HTMLElement>('.text-status-engagement')!
textStatusEngagement.hidden = true
document.querySelectorAll<HTMLButtonElement>('.status-option').forEach(button => button.addEventListener('click', () => { textStatusEngagement.hidden = true }))
document.querySelector<HTMLButtonElement>('#save-status')!.addEventListener('click', () => { if (statusInput.value.trim()) textStatusEngagement.hidden = false })
document.head.insertAdjacentHTML('beforeend', `<style>.text-status-post{padding:12px}.text-status-body{display:block;color:#f0f3e9;font:600 14px 'Manrope';line-height:1.4;padding:8px 0 10px;white-space:pre-wrap;overflow-wrap:anywhere}</style>`)
document.querySelector<HTMLButtonElement>('#save-status')!.addEventListener('click', () => {
  const text = statusInput.value.trim()
  if (!text) return
  const post = document.createElement('article')
  post.className = 'status-post text-status-post'
  post.innerHTML = '<div class="eyebrow">TEXT STATUS · JUST NOW</div><div class="text-status-body"></div><small>Posted to your profile</small>'
  post.querySelector<HTMLElement>('.text-status-body')!.textContent = text
  statusPosts.prepend(post)
})
document.querySelector<HTMLButtonElement>('#save-status')!.addEventListener('click', () => {
  const text = statusInput.value.trim()
  if (!text) return
  const post = document.createElement('article')
  post.className = 'status-post text-status-post'
  post.innerHTML = '<div class="eyebrow">TEXT STATUS · JUST NOW</div><div class="text-status-body"></div><small>Posted to your profile</small>'
  post.querySelector<HTMLElement>('.text-status-body')!.textContent = text
  statusPosts.prepend(post)
}, true)
document.head.insertAdjacentHTML('beforeend', `<style>.chat-message.voice-message{display:flex;align-items:center;gap:8px;background:#2a2d25}.chat-message.voice-message audio{width:210px;height:30px}.call-message{display:flex;align-items:center;gap:8px;background:#252b20!important;color:#d8eca0!important}.call-message button{border:1px solid #596541;background:transparent;color:#ffaaa2;border-radius:5px;padding:5px 8px;font-size:9px;cursor:pointer}.call-video{width:150px;height:90px;object-fit:cover;border-radius:7px;border:1px solid #c8f169;background:#11130f}</style>`)
sendVoice.addEventListener('click', event => {
  event.preventDefault()
  event.stopImmediatePropagation()
  if (!voiceUrl) return
  const sentUrl = voiceUrl
  voiceUrl = null
  const bubble = document.createElement('div')
  bubble.className = 'chat-message sent voice-message'
  bubble.innerHTML = '<span>Voice message</span><audio controls></audio>'
  bubble.querySelector<HTMLAudioElement>('audio')!.src = sentUrl
  chatMessages.appendChild(bubble)
  chatMessages.scrollTop = chatMessages.scrollHeight
  resetVoiceRecorder()
  showToast('Voice message sent into the chat ✨')
}, true)
let activeCallStream: MediaStream | null = null
document.querySelector<HTMLElement>('.chat-modal')!.insertAdjacentHTML('beforeend', '<section class="call-stage" id="call-stage" hidden><div class="eyebrow"><span class="live-dot"></span> VIDEO CALL</div><video id="call-stage-video" autoplay muted playsinline></video><div><strong id="call-stage-title">Calling…</strong><button type="button" id="call-stage-end">End call</button></div></section>')
const callStage = document.querySelector<HTMLElement>('#call-stage')!
document.body.appendChild(callStage)
const callStageVideo = document.querySelector<HTMLVideoElement>('#call-stage-video')!
const callStageTitle = document.querySelector<HTMLElement>('#call-stage-title')!
const callStageEnd = document.querySelector<HTMLButtonElement>('#call-stage-end')!
callStageEnd.insertAdjacentHTML('beforebegin', '<button type="button" id="call-stage-switch">Switch to video</button>')
const callStageSwitch = document.querySelector<HTMLButtonElement>('#call-stage-switch')!
callStageEnd.insertAdjacentHTML('beforebegin', '<button type="button" id="call-stage-invite">Invite people</button>')
callStage.insertAdjacentHTML('beforeend', '<div class="call-invite-panel" id="call-invite-panel" hidden><input id="call-invite-name" placeholder="Person to invite"><button type="button" id="call-invite-confirm">Send invite</button></div><div class="call-participants" id="call-participants">You</div>')
const callInvite = document.querySelector<HTMLButtonElement>('#call-stage-invite')!
const callInvitePanel = document.querySelector<HTMLElement>('#call-invite-panel')!
const callInviteName = document.querySelector<HTMLInputElement>('#call-invite-name')!
const callInviteConfirm = document.querySelector<HTMLButtonElement>('#call-invite-confirm')!
const callParticipants = document.querySelector<HTMLElement>('#call-participants')!
callInvite.addEventListener('click', () => { callInvitePanel.hidden = false; callInviteName.focus() })
callInviteConfirm.addEventListener('click', () => {
  const name = callInviteName.value.trim() || 'Guest'
  const participant = document.createElement('span')
  participant.textContent = name
  callParticipants.append(' · ', participant)
  callInviteName.value = ''
  callInvitePanel.hidden = true
  showToast(`${name} invited to the call ✨`)
})
callStageEnd.addEventListener('click', () => { activeCallStream?.getTracks().forEach(track => track.stop()); activeCallStream = null; callStage.hidden = true; callStageVideo.srcObject = null; callStageVideo.hidden = true; callStageSwitch.hidden = false; callStageSwitch.textContent = 'Switch to video'; showToast('Call ended') })
callStageSwitch.addEventListener('click', async () => {
  try {
    const switchingToAudio = !callStageVideo.hidden
    activeCallStream?.getTracks().forEach(track => track.stop())
    activeCallStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !switchingToAudio })
    callStageVideo.srcObject = switchingToAudio ? null : activeCallStream
    callStageVideo.hidden = switchingToAudio
    callStageSwitch.textContent = switchingToAudio ? 'Switch to video' : 'Switch to audio'
    callStageTitle.textContent = `${switchingToAudio ? 'Voice' : 'Video'} call with ${chatTitle.textContent?.replace('Chat with ', '') ?? 'your friend'}`
    showToast(switchingToAudio ? 'Switched back to audio call' : 'Video camera switched on')
  } catch { showToast('Camera permission was cancelled') }
})
document.querySelectorAll<HTMLButtonElement>('[data-chat-call]').forEach(button => button.addEventListener('click', async () => {
  const video = button.dataset.chatCall === 'video'
  try {
    activeCallStream?.getTracks().forEach(track => track.stop())
    activeCallStream = await navigator.mediaDevices.getUserMedia({ audio: true, video })
    callStage.hidden = false
    callStageVideo.hidden = !video
    callStageVideo.srcObject = video ? activeCallStream : null
    callStageSwitch.hidden = false
    callStageSwitch.textContent = video ? 'Switch to audio' : 'Switch to video'
    callStageTitle.textContent = `${video ? 'Video' : 'Voice'} call with ${chatTitle.textContent?.replace('Chat with ', '') ?? 'your friend'}`
    const callBubble = document.createElement('div')
    callBubble.className = 'chat-message call-message'
    callBubble.innerHTML = `<span>${video ? 'Video' : 'Voice'} call connected</span><button type="button">End call</button>`
    if (video) { const callVideo = document.createElement('video'); callVideo.className = 'call-video'; callVideo.autoplay = true; callVideo.muted = true; callVideo.playsInline = true; callVideo.srcObject = activeCallStream; callBubble.prepend(callVideo) }
    callBubble.querySelector('button')!.addEventListener('click', () => { activeCallStream?.getTracks().forEach(track => track.stop()); activeCallStream = null; callBubble.remove(); showToast('Call ended') })
    chatMessages.appendChild(callBubble)
    chatMessages.scrollTop = chatMessages.scrollHeight
  } catch { showToast(`${video ? 'Video' : 'Voice'} call permission was cancelled`) }
}))
document.head.insertAdjacentHTML('beforeend', `<style>
  .call-stage{position:fixed;z-index:160;top:50%;left:50%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 32px));margin:0;padding:14px;background:#171a15;border:1px solid #4a5538;border-radius:9px;box-shadow:0 20px 70px #000b}
  .call-stage[hidden]{display:none}.call-stage video{display:block;width:100%;height:260px;object-fit:cover;background:#0d0f0c;border-radius:7px;margin:10px 0;border:1px solid #66754a}
  .call-stage>div:last-child{display:flex;align-items:center;justify-content:space-between;gap:10px}.call-stage strong{font:700 12px 'Manrope';color:#d9ed9e}.call-stage button{border:1px solid #ff7770;background:#3a211f;color:#ffaaa2;border-radius:5px;padding:7px 10px;font-size:9px;cursor:pointer}
  @media(max-width:600px){.call-stage video{height:210px}}
</style>`)
document.head.insertAdjacentHTML('beforeend', `<style>
  .call-invite-panel{display:flex;gap:6px;margin-top:10px}.call-invite-panel[hidden]{display:none}.call-invite-panel input{flex:1;min-width:0;border:1px solid #3a4033;background:#11130f;color:#f3f4ed;border-radius:5px;padding:8px;font-size:10px}.call-invite-panel button{border:1px solid #9ec85b;background:#c8f169;color:#171913}.call-participants{margin-top:9px;color:#9ca690;font-size:9px}.call-participants span{color:#d8eca0}
</style>`)
