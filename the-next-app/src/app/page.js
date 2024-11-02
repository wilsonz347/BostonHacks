// import Image from "next/image";

// app/page.js
export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', backgroundColor: '#000' }}>
      <h1>Welcome to the Space Exploration Project</h1>
      <p>Explore the cosmos and uncover the secrets of the universe.</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/missions" style={{ color: '#ffcc00', textDecoration: 'underline' }}>Explore Space Missions</a>
      </div>
    </div>
  );
}