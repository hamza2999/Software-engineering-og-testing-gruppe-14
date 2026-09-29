import { useState } from 'react'
import heroImage from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const communityLinks = [
  { label: 'GitHub', url: 'https://github.com/vitejs/vite', icon: 'github-icon' },
  { label: 'Discord', url: 'https://chat.vite.dev/', icon: 'discord-icon' },
  { label: 'X.com', url: 'https://x.com/vite_js', icon: 'x-icon' },
  { label: 'Bluesky', url: 'https://bsky.app/profile/vite.dev', icon: 'bluesky-icon' },
]

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section className="intro">
        <div className="hero">
          <img src={heroImage} className="hero-image" width="170" height="179" alt="" />
          <img src={reactLogo} className="react-logo" alt="React logo" />
          <img src={viteLogo} className="vite-logo" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="count-button"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="divider" />

      <section className="resources">
        <div className="documentation">
          <svg className="section-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="vite-icon" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="link-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div className="community">
          <svg className="section-icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            {communityLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank">
                  <svg className="link-icon" role="presentation" aria-hidden="true">
                    <use href={`/icons.svg#${link.icon}`}></use>
                  </svg>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="divider" />
      <section className="bottom-space"></section>
    </>
  )
}

export default App
