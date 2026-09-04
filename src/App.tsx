import './App.css'
import { Carousel } from './Carousel/Carousel'

const CMS = 'https://wp.sfdcdigital.com/en-us/wp-content/uploads/sites/4/2026/09'

export const MOCKED_CAROUSEL_DATA = [
  {
    title: 'Slack + Tableau',
    description: 'Connect to almost any database, drag and drop to create visualizations, and share with a click.',
    image: `${CMS}/slack_tablau.png?w=1024`,
  },
  {
    title: 'Tableau Studio',
    description: 'Connect to almost any database, drag and drop to create visualizations, and share with a click.',
    image: `${CMS}/tablau_studio.png?w=1024`,
    leftCardImg: `${CMS}/left-card.png`,
    rightCardImg: `${CMS}/right-card2.png`,
  },
  {
    title: 'Tableau Knowledge',
    description: 'Connect to almost any database, drag and drop to create visualizations, and share with a click.',
    image: `${CMS}/tablau_knowledge.png?w=1024`,
    leftCardImg: `${CMS}/left-card.png`,
  },
  {
    title: 'Claude + Tableau',
    description: 'Connect to almost any database, drag and drop to create visualizations, and share with a click.',
    image: `${CMS}/slack_tablau.png?w=1024`,
  },
]

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.76904 15.1271V2.87321C2.76904 2.52706 3.21904 2.28475 3.53058 2.56167L15.0229 8.55014C15.2998 8.75783 15.2998 9.20783 15.0229 9.41552L3.53058 15.4732C3.21904 15.7155 2.76904 15.5078 2.76904 15.1271Z"
      fill="currentColor"
    />
  </svg>
)

function App() {
  return (
    <div className="app">
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-headline" style={{ fontWeight: 600, fontFamily: 'Avant Garde for Salesforce' }}>Activate agentic analytics&nbsp;across Tableau</h1>
          <p>Agentic AI has reached every corner of Tableau. Whether you’re on Tableau Cloud, Server, or Next, you can now turn trusted data into smarter actions everywhere.</p>
          <div className="hero-actions">
            <a className="hero-btn hero-btn--primary" href="#demos">
              Start for free
            </a>
            <a className="hero-btn hero-btn--secondary" href="#try">
              Watch demos
              <PlayIcon />
            </a>
          </div>
        </div>
      </section>

      <div className="app-carousel">
        <Carousel data={MOCKED_CAROUSEL_DATA} />
      </div>
    </div>
  )
}

export default App
